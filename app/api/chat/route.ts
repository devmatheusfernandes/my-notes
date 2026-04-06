import { adminDb } from "@/lib/firebase/firebase-admin";
import { searchService } from "@/services/searchService";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getUserFromSession } from "@/utils/auth-server";
import { NextResponse } from "next/server";
import { creditService } from "@/services/creditService";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1.1 Credit Check
    const hasCredits = await creditService.hasCredits(userId);
    if (!hasCredits) {
      return NextResponse.json(
        { error: "Você atingiu seu limite de créditos de IA para este mês." },
        { status: 403 }
      );
    }

    // 2. RAG: Search for context (Reduced from 5 to 3 for efficiency)
    const searchResults = await searchService.semanticSearch(lastMessage, userId, 3);

    // Fetch content & titles for attribution links
    const contextParts = await Promise.all(
      searchResults.map(async (res) => {
        let title = "Sem Título";
        let url = "";
        const id = res.sourceId;

        if (res.sourceType === "note") {
          const doc = await adminDb.collection("notes").doc(id).get();
          const data = doc.data();
          title = data?.title || "Nota Sem Título";
          url = `/hub/notes/${id}`;
        } else if (res.sourceType === "publication") {
          const [symbol, chapter] = id.split("-");
          // Extract the first line which contains "Publication Title - Chapter Title"
          title = res.content.split("\n")[0] || `Publicação ${symbol}`;
          url = `/hub/personal-study/${symbol}?c=${chapter}`;
        } else if (res.sourceType === "video") {
          const doc = await adminDb.collection("videos").doc(id).get();
          const data = doc.data();
          title = data?.title || "Vídeo Sem Título";
          url = `/hub/personal-study/video/${id}`;
        }

        return `### FONTE: ${title}\nURL: ${url}\nCONTEÚDO PARA REFERÊNCIA:\n"""\n${res.content.substring(0, 4000)}${res.content.length > 4000 ? '... [Conteúdo truncado para economia de créditos]' : ''}\n"""`;
      })
    );

    const context = contextParts.join("\n\n---\n\n");

    // 3. Prepare AI Prompt
    const systemInstruction = `Você é um assistente pessoal inteligente. Seu objetivo é ajudar o usuário com base exclusivamente em suas próprias notas, vídeos e publicações.

DIRETRIZES DE RESPOSTA:
1. **POLIDEZ**: Você pode ser amigável e responder saudações de forma natural.
2. **FONTE DE VERDADE**: Para qualquer pergunta, use APENAS o [CONTEXTO DO USUÁRIO] fornecido abaixo.
3. **MENSAGEM DE ERRO**: Se não encontrar a informação, responda exatamente: "Desculpe, não encontrei informações sobre isso nas suas notas ou biblioteca por enquanto."
4. **CITAÇÕES E TRECHOS**: Para cada informação retirada do contexto:
   - Cite a fonte usando um link Markdown no formato: [Título da Fonte](URL_DA_FONTE_COM_H).
   - Use exatamente a 'URL' fornecida no contexto e anexe o parâmetro 'h' ao final.
   - Como anexar 'h': Se a URL já tiver '?', use '&h=texto'. Se não tiver, use '?h=texto'.
   - O valor de 'h' deve ser de 3 a 7 palavras extraídas LITERALMENTE do documento (sem mudar nada).
   - Logo após a citação, inclua o trecho que justifica sua resposta usando um blockquote (>).
5. **ESTILO**: Responda em Português do Brasil de forma clara e organizada.

[CONTEXTO DO USUÁRIO]:
${context}

Lembre-se: Se não houver nada relevante no contexto, admita que não encontrou nada.`;

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

    // Save user message to database
    await adminDb.collection("chats").doc(chatId).collection("messages").add({
      role: "user",
      content: lastMessage,
      createdAt: new Date(),
    });

    interface ChatMessage {
      role: string;
      content: string;
    }

    // 5. Generate Streaming Response with AI SDK
    // Calculate accuracy (average of all 3 results)
    const avgDistance = searchResults.length > 0
      ? searchResults.reduce((acc, res) => acc + res.score, 0) / searchResults.length
      : 1; // Default to 1 (0% similarity) if no results
    const accuracy = Math.max(0, Math.round((1 - avgDistance) * 100));

    const result = streamText({
      model: google("gemini-flash-latest"),
      system: systemInstruction,
      messages: messages.slice(-10).map((m: ChatMessage) => ({
        role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
        content: m.content,
      })),
      onFinish: async ({ text, usage }) => {
        // Save the AI message to the database when it finishes streaming
        if (chatId) {
          await adminDb.collection("chats").doc(chatId).collection("messages").add({
            role: "model",
            content: text,
            createdAt: new Date(),
            accuracy // Save accuracy to message history
          });

          await adminDb.collection("chats").doc(chatId).update({
            updatedAt: new Date(),
          });
        }

        // Deduct credits based on tokens used
        if (usage) {
          const { promptTokens = 0, completionTokens = 0, totalTokens = (promptTokens + completionTokens) } = usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number };
          const creditsToDeduct = Math.ceil(totalTokens / 1000);

          await creditService.deductCredits(userId, creditsToDeduct);
          await creditService.logTransaction({
            userId,
            amount: creditsToDeduct,
            type: "chat",
            details: {
              promptTokens,
              completionTokens,
              totalTokens,
              chatId
            }
          });
        }
      },
    });

    // Return the stream response with accuracy in headers
    return result.toTextStreamResponse({
      headers: {
        "X-Chat-Id": chatId,
        "X-Search-Accuracy": accuracy.toString(),
      },
    });

  } catch (error: unknown) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
