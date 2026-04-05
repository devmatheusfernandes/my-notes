import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import { searchService } from "@/services/searchService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { cookies } from "next/headers";
import { getUserFromSession } from "@/utils/auth-server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export async function POST(req: Request) {
  try {
    const { messages, chatId: existingChatId } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return NextResponse.json({ error: "Missing message" }, { status: 400 });
    }

    // 1. Authentication
    let userId: string;
    try {
      const user = await getUserFromSession();
      userId = user.uid;
    } catch (error) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. RAG: Search for context
    const searchResults = await searchService.semanticSearch(lastMessage, userId, 5);

    // Fetch content & titles for attribution links
    const contextParts = await Promise.all(
      searchResults.map(async (res) => {
        let title = "Sem Título";
        let url = "";
        const id = res.sourceId;

        if (res.sourceType === "note") {
          // Check if it's actually a JWPUB Publication (Symbol-Chapter)
          if (id.includes("-") && id.split("-").length === 2 && !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
             const [symbol, chapter] = id.split("-");
             title = `Publicação ${symbol} - Cap. ${chapter}`;
             url = `/hub/personal-study/${symbol}?c=${chapter}`;
          } else {
             // Real Firestore Note
             const doc = await adminDb.collection("notes").doc(id).get();
             const data = doc.data();
             title = data?.title || "Nota Sem Título";
             url = `/hub/notes/${id}`;
          }
        } else if (res.sourceType === "video") {
           const doc = await adminDb.collection("videos").doc(id).get();
           const data = doc.data();
           title = data?.title || "Vídeo Sem Título";
           url = `/hub/personal-study/video/${id}`;
        }

        return `[FONTE: ${title}]\nURL: ${url}\nCONTEÚDO: ${res.content}`;
      })
    );

    const context = contextParts.join("\n\n---\n\n");

    // 3. Prepare AI Prompt
    const systemInstruction = `Você é um assistente pessoal inteligente e útil. Seu objetivo é ajudar o usuário com base em suas próprias notas, vídeos e publicações.
    
    DIRETRIZES DE RESPOSTA:
    1. Use o CONTEXTO DO USUÁRIO abaixo para responder.
    2. SEMPRE cite a fonte de onde tirou a informação usando LINKS MARKDOWN com o título exato, por exemplo: [Título da Nota](/hub/notes/id).
    3. Se a informação vier de múltiplas fontes, cite todas elas com seus respectivos links.
    4. Responda em Markdown (use negrito, listas, tabelas se necessário).
    5. Se não encontrar a resposta no contexto, responda com base no seu conhecimento geral, mas priorize os dados do usuário.
    
    CONTEXTO DO USUÁRIO:
    ${context}
    
    Responda em Português do Brasil de forma clara e organizada.`;

    // 4. Create/Get Chat in Firestore
    let chatId = existingChatId;
    if (!chatId) {
      const chatRef = await adminDb.collection("chats").add({
        userId,
        title: lastMessage.substring(0, 50) + "...",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      chatId = chatRef.id;
    }

    // Save user message
    await adminDb.collection("chats").doc(chatId).collection("messages").add({
      role: "user",
      content: lastMessage,
      createdAt: new Date(),
    });

    // 5. Generate Streaming Response
    const chatSession = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
      systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
    });

    const result = await chatSession.sendMessageStream(lastMessage);

    // Setup streaming
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            controller.enqueue(encoder.encode(chunkText));
          }

          // Save AI message to Firestore after stream ends
          await adminDb.collection("chats").doc(chatId).collection("messages").add({
            role: "model",
            content: fullResponse,
            createdAt: new Date(),
          });

          await adminDb.collection("chats").doc(chatId).update({
            updatedAt: new Date(),
          });

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": chatId,
      },
    });

  } catch (error: unknown) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
