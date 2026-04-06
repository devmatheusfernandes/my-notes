import { adminDb } from "@/lib/firebase/firebase-admin";
import { searchService } from "@/services/searchService";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { getUserFromSession } from "@/utils/auth-server";
import { NextResponse } from "next/server";

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

        return `### FONTE: ${title}\nURL: ${url}\nCONTEÚDO PARA REFERÊNCIA:\n"""\n${res.content}\n"""`;
      })
    );

    const context = contextParts.join("\n\n---\n\n");

    // 3. Prepare AI Prompt
    const systemInstruction = `Você é um assistente pessoal inteligente. Seu objetivo é ajudar o usuário com base exclusivamente em suas próprias notas, vídeos e publicações.

DIRETRIZES DE RESPOSTA:
1. **POLIDEZ**: Você pode ser amigável e responder saudações (ex: "Olá", "Tudo bem?") de forma natural.
2. **FONTE DE VERDADE**: Para qualquer pergunta sobre temas específicos, fatos ou informações, use **APENAS** o [CONTEXTO DO USUÁRIO] fornecido abaixo.
3. **MENSAGEM DE ERRO**: Se a informação solicitada não estiver presente no contexto, responda exatamente: "Desculpe, não encontrei informações sobre isso nas suas notas ou biblioteca por enquanto." 
   *Não tente inventar respostas, usar seu conhecimento de treinamento para fatos ou sugerir coisas que não estão nas notas do usuário.*
4. **CITAÇÕES E TRECHOS**: Para cada informação que você retirar do contexto:
   - Cite a fonte usando um link Markdown que inclua obrigatoriamente um parâmetro de destaque na URL, por exemplo: [Título da Fonte](URL?h=frase+exata+literal). 
   - **REGRA DE OURO PARA "h"**: O valor de 'h' deve ser uma sequência de palavras extraída **LITERALMENTE** do Contexto do Usuário. Escolha de 3 a 7 palavras que apareçam exatamente no documento.
   - **PROIBIDO**: Não mude nada (nem acentuação, nem maiúsculas/minúsculas). Deve ser uma cópia IDÊNTICA. Se o texto diz "conselho de maneira amorosa", a URL deve ter '?h=conselho+de+maneira+amorosa'. Não resuma e não parafraseie no parâmetro 'h'.
   - **OBRIGATÓRIO**: Logo após a citação, inclua o trecho específico do texto que justifica sua resposta usando um blockquote de Markdown (>).
5. **ESTILO**: Responda em Português do Brasil de forma clara, organizada e objetiva.

[CONTEXTO DO USUÁRIO]:
${context}

Lembre-se: Se não houver nada relevante no contexto acima para a pergunta feita, você deve admitir que não encontrou nada.`;

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
    const result = streamText({
      model: google("gemini-flash-latest"),
      system: systemInstruction,
      messages: messages.map((m: ChatMessage) => ({
        role: (m.role === "model" ? "assistant" : m.role) as "user" | "assistant",
        content: m.content,
      })),
      onFinish: async ({ text }) => {
        // Save the AI message to the database when it finishes streaming
        if (chatId) {
          await adminDb.collection("chats").doc(chatId).collection("messages").add({
            role: "model", // consistent with existing schema "model" instead of "assistant"
            content: text,
            createdAt: new Date(),
          });

          await adminDb.collection("chats").doc(chatId).update({
            updatedAt: new Date(),
          });
        }
      },
    });

    // Return the stream response with the Chat-Id header
    return result.toTextStreamResponse({
      headers: {
        "X-Chat-Id": chatId,
      },
    });

  } catch (error: unknown) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
