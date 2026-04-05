"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Chat, chatService, Message } from "@/services/chatService"; // Certifique-se que isso exporta os métodos corretos
import { Button } from "@/components/ui/button";
import {
  SendIcon,
  PlusIcon,
  MessageSquareIcon,
  BotIcon,
  UserIcon,
  MenuIcon,
  XIcon,
  SquareTerminal,
  Archive,
  Trash2,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { useSidebar } from "@/components/ui/sidebar";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";



// Utilitário para converter datas do Firebase ou Strings para Date nativo
const parseDate = (date: any): Date => {
  if (!date) return new Date();
  if (date.toDate && typeof date.toDate === 'function') return date.toDate();
  if (date instanceof Date) return date;
  return new Date(date);
};

export default function ChatPage() {
  const { user } = useAuthStore();
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // States
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Gerenciamento de Resize da Sidebar
  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Carregamento Inicial
  useEffect(() => {
    if (user) {
      loadChats();
      // Load chat from URL if ID exists
      const chatIdFromUrl = searchParams.get("id");
      if (chatIdFromUrl) {
        setCurrentChatId(chatIdFromUrl);
        loadMessages(chatIdFromUrl);
      }
    }
  }, [user]);

  // Sync currentChatId with URL
  useEffect(() => {
    const currentIdInUrl = searchParams.get("id");
    if (currentChatId !== currentIdInUrl) {
      const params = new URLSearchParams(searchParams.toString());
      if (currentChatId) {
        params.set("id", currentChatId);
      } else {
        params.delete("id");
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    }
  }, [currentChatId, pathname, router, searchParams]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  // API Calls
  const loadChats = async () => {
    if (!user) return;
    try {
      const userChats = await chatService.getChats(user.uid);
      setChats(userChats || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };

  const loadMessages = async (chatId: string) => {
    setIsLoading(true);
    try {
      const chatMessages = await chatService.getMessages(chatId);
      setMessages(chatMessages || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Envio e Streaming Refatorada
  const handleSend = async () => {
    if (!input.trim() || !user || isLoading) return;

    const userMessageText = input.trim();
    setInput("");

    // Volta o foco pro input e reseta a altura
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }

    const newUserMessage: Message = {
      role: "user",
      content: userMessageText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content
          })), // Envia apenas dados limpos para a API
          chatId: currentChatId,
          userId: user.uid
        }),
      });

      if (!response.ok) throw new Error("Falha na requisição da API");

      // Atualiza a lista de chats se for um chat novo
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && newChatId !== currentChatId) {
        setCurrentChatId(newChatId);
        loadChats();
      }

      // Prepara estado inicial da mensagem da IA
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "", createdAt: new Date() },
      ]);

      // Lógica de Stream Segura
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Nenhum stream retornado");

      let aiText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;

        // Atualização funcional do React garantindo integridade do array
        setMessages((prev) => {
          const updatedMessages = [...prev];
          const lastIndex = updatedMessages.length - 1;

          if (updatedMessages[lastIndex].role === "model") {
            updatedMessages[lastIndex] = {
              ...updatedMessages[lastIndex],
              content: aiText
            };
          }
          return updatedMessages;
        });
      }
    } catch (error) {
      console.error("Erro no chat:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.", createdAt: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers de UI
  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; // Auto-resize até 120px
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleArchiveChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await chatService.archiveChat(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao arquivar chat:", error);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta conversa permanentemente?")) return;

    try {
      await chatService.deleteChat(chatId);
      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao deletar chat:", error);
    }
  };

  const ChatHistoryList = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
      {chats.length === 0 ? (
        <p className="text-xs text-neutral-500 text-center py-6">Sem conversas anteriores.</p>
      ) : (
        chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => {
              setCurrentChatId(chat.id ?? null);
              if (onSelect) onSelect();
            }}
            className={cn(
              "w-full text-left p-3 rounded-lg text-sm transition-colors flex flex-col gap-1 group relative cursor-pointer",
              currentChatId === chat.id
                ? "bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-700 font-medium"
                : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400"
            )}
          >
            <div className="flex items-center gap-2 truncate w-full pr-12">
              <MessageSquareIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="truncate">{chat.title || "Nova Conversa"}</span>
            </div>
            <span className="text-[10px] text-neutral-400 pl-5">
              {format(parseDate(chat.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
            </span>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                onClick={(e) => handleArchiveChat(e, chat.id!)}
                title="Arquivar"
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-neutral-400 hover:text-red-600"
                onClick={(e) => handleDeleteChat(e, chat.id!)}
                title="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="flex h-[100dvh] w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans">

      {/* Drawer Mobile */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="left">
        <DrawerContent className="h-full w-72 rounded-none border-r">
          <DrawerHeader className="border-b text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
                <SquareTerminal className="w-5 h-5 text-neutral-500" />
                Histórico
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>
          <ChatHistoryList onSelect={() => setIsDrawerOpen(false)} />
        </DrawerContent>
      </Drawer>

      {/* Sidebar Desktop */}
      <aside
        className={cn(
          "hidden md:flex flex-col bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 w-72 shrink-0 transition-all",
          !isSidebarOpen && "w-0 border-none overflow-hidden"
        )}
      >
        <div className="h-16 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="rounded-full hover:bg-muted/50 transition-colors"
              size="icon"
              onClick={toggleSidebar}
            >
              <Menu className="w-5 h-5 text-foreground/80" />
            </Button>
            <h2 className="font-semibold text-sm">Histórico</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8">
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
        <ChatHistoryList />
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121] relative h-full">

        {/* Header */}
        <header className="h-16 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center px-4 justify-between bg-white/80 dark:bg-[#212121]/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 -ml-2" onClick={() => setIsDrawerOpen(true)}>
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm md:text-base text-neutral-800 dark:text-neutral-100">Assistente IA</h1>
              <p className="text-[11px] md:text-xs text-neutral-500">Pronto para te ajudar nos estudos</p>
            </div>
          </div>
        </header>

        {/* Mensagens - Usando div nativa com overflow para controle preciso de scroll */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth custom-scrollbar">
          <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-4">

            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center pt-24 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                  <BotIcon className="w-8 h-8 text-neutral-600 dark:text-neutral-300" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Como posso ajudar hoje?</h2>
                <p className="text-sm text-neutral-500 max-w-md mx-auto mb-8">
                  Faça perguntas sobre suas notas, peça resumos ou crie planos de estudo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {["Resuma meu último estudo", "Me explique o conceito de Quilha", "Crie um questionário sobre Gênesis"].map((suggestion) => (
                    <button
                      key={suggestion}
                      className="p-3 text-sm text-left border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      onClick={() => {
                        setInput(suggestion);
                        if (textareaRef.current) textareaRef.current.focus();
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, i) => (
                <div key={i} className={cn("flex gap-4 w-full", message.role === "user" ? "justify-end" : "justify-start")}>

                  {/* Avatar IA */}
                  {message.role === "model" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 mt-1">
                      <BotIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}

                  <div className={cn("flex flex-col gap-1 min-w-0", message.role === "user" ? "items-end max-w-[85%] md:max-w-[75%]" : "w-full")}>

                    {message.role === "user" ? (
                      <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-5 py-3 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    ) : (
                      <div className="prose prose-sm md:prose-base prose-neutral dark:prose-invert max-w-none break-words text-[15px] leading-relaxed">
                        {/* Se a mensagem estiver vazia, estamos aguardando o stream começar */}
                        {message.content === "" && isLoading && i === messages.length - 1 ? (
                          <span className="inline-block w-2 h-4 bg-neutral-400 animate-pulse ml-1 align-middle" />
                        ) : (
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
          </div>
        </div>

        {/* Área de Input - Fixa na base */}
        <div className="px-4 pb-4 md:pb-6 pt-2 bg-white dark:bg-[#212121] shrink-0">
          <div className="max-w-3xl mx-auto relative">
            <div className="bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700/50 focus-within:ring-2 focus-within:ring-neutral-300 dark:focus-within:ring-neutral-600 transition-all flex items-end p-2 gap-2 shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem para Assistente..."
                className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-[120px] min-h-[40px] px-3 py-2 text-[15px] outline-none custom-scrollbar"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className={cn(
                  "h-10 w-10 shrink-0 rounded-xl transition-all mb-0.5",
                  input.trim()
                    ? "bg-black dark:bg-white text-white dark:text-black hover:scale-105"
                    : "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500"
                )}
              >
                <SendIcon className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-neutral-400 font-medium">A IA pode cometer erros. Revise o conteúdo.</span>
            </div>
          </div>
        </div>
      </main>

      {/* Estilos Globais Injetados para Scrollbar (Opcional, mas melhora a UI) */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d4d4d8; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #52525b; }
      `}} />
    </div>
  );
}