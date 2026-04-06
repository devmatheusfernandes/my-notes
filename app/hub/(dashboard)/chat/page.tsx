"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { Chat, chatService, Message } from "@/services/chatService";
import { Button } from "@/components/ui/button";
import {
  SendIcon,
  PlusIcon,
  MessageSquareIcon,
  BotIcon,
  MenuIcon,
  Archive,
  Trash2,
  Menu,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { motion, AnimatePresence } from "framer-motion";
import { pageContainerVariants, itemFadeInUpVariants } from "@/lib/animations";

const parseDate = (date: unknown): Date => {
  if (!date) return new Date();
  if (typeof date === 'object' && date !== null && 'toDate' in date && typeof (date as { toDate: unknown }).toDate === 'function') {
    return (date as { toDate: () => Date }).toDate();
  }
  if (date instanceof Date) return date;
  if (typeof date === 'string' || typeof date === 'number') return new Date(date);
  return new Date();
};

interface ChatHistoryListProps {
  chats: Chat[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  handleArchiveChat: (e: React.MouseEvent, chatId: string) => Promise<void>;
  handleUnarchiveChat: (e: React.MouseEvent, chatId: string) => Promise<void>;
  handleDeleteChat: (e: React.MouseEvent, chatId: string) => void;
  viewMode: "active" | "archived";
  onSelect?: () => void;
}

const ChatHistoryList = ({
  chats,
  currentChatId,
  setCurrentChatId,
  handleArchiveChat,
  handleUnarchiveChat,
  handleDeleteChat,
  viewMode,
  onSelect
}: ChatHistoryListProps) => {
  const filteredChats = chats.filter(chat =>
    viewMode === "archived" ? chat.status === "archived" : chat.status !== "archived"
  );

  return (
    <motion.div
      className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar"
      variants={pageContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {filteredChats.length === 0 ? (
        <motion.p variants={itemFadeInUpVariants} className="text-xs text-neutral-500 text-center py-6">
          {viewMode === "archived" ? "Nenhuma conversa arquivada." : "Sem conversas anteriores."}
        </motion.p>
      ) : (
        filteredChats.map((chat) => (
          <motion.div
            key={chat.id}
            variants={itemFadeInUpVariants}
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
              {viewMode === "active" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  onClick={(e) => handleArchiveChat(e, chat.id!)}
                  title="Arquivar"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md hover:bg-green-100 dark:hover:bg-green-900/30 text-neutral-400 hover:text-green-600"
                  onClick={(e) => handleUnarchiveChat(e, chat.id!)}
                  title="Desarquivar"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              )}
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
          </motion.div>
        ))
      )}
    </motion.div>
  );
};

export default function ChatPage() {
  const { user } = useAuthStore();
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"active" | "archived">("active");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    scrollToBottom(isLoading ? "auto" : "smooth");
  }, [messages, isLoading]);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadChats = React.useCallback(async () => {
    if (!user) return;
    try {
      const userChats = await chatService.getChats(user.uid);
      setChats(userChats || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  }, [user]);

  const loadMessages = React.useCallback(async (chatId: string) => {
    setIsLoading(true);
    try {
      const chatMessages = await chatService.getMessages(chatId);
      setMessages(chatMessages || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadChats();
      const chatIdFromUrl = searchParams.get("id");
      if (chatIdFromUrl) {
        setCurrentChatId(chatIdFromUrl);
        loadMessages(chatIdFromUrl);
      }
    }
  }, [user, loadChats, loadMessages, searchParams]);

  useEffect(() => {
    const currentIdInUrl = searchParams.get("id");
    if (currentChatId !== currentIdInUrl) {
      const params = new URLSearchParams(searchParams.toString());
      if (currentChatId) {
        params.set("id", currentChatId);
      } else {
        params.delete("id");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [currentChatId, router, pathname, searchParams]);

  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId, loadMessages]);

  const handleSend = async () => {
    if (!input.trim() || !user || isLoading) return;

    const userMessageText = input.trim();
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }

    const newUserMessage: Message = {
      role: "user",
      content: userMessageText,
      createdAt: new Date(),
    };

    // 1. Pre-add user message and AI placeholder immediately for instant feedback
    setMessages((prev) => [...prev, newUserMessage, { role: "model", content: "", createdAt: new Date() }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          chatId: currentChatId,
          userId: user.uid
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const data = await response.json();
          toast.error(data.error || "Limite de créditos atingido.");
          setMessages((prev) => prev.slice(0, -2)); // Remove user message and placeholder
          setIsLoading(false);
          return;
        }
        throw new Error("Falha na requisição da API");
      }

      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && newChatId !== currentChatId) {
        setCurrentChatId(newChatId);
        loadChats();
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Nenhum stream retornado");

      let aiText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;

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

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
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
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: "archived" } : c));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error("Erro ao arquivar chat:", error);
    }
  };

  const handleUnarchiveChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    try {
      await chatService.unarchiveChat(chatId);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, status: "active" } : c));
    } catch (error) {
      console.error("Erro ao desarquivar chat:", error);
    }
  };

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChatToDeleteId(chatId);
    setIsDeleteDrawerOpen(true);
  };

  const confirmDelete = async () => {
    if (!chatToDeleteId) return;
    try {
      await chatService.deleteChat(chatToDeleteId);
      setChats(prev => prev.filter(c => c.id !== chatToDeleteId));
      if (currentChatId === chatToDeleteId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      setIsDeleteDrawerOpen(false);
      setChatToDeleteId(null);
    } catch (error) {
      console.error("Erro ao deletar chat:", error);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 overflow-hidden font-sans">

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="left">
        <DrawerContent className="h-full w-72 rounded-none border-r">
          <DrawerHeader className="border-b text-left">
            <div className="flex items-center justify-between">
              <DrawerTitle className="text-sm font-semibold flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full hover:bg-muted/50 transition-colors"
                  size="icon"
                  onClick={toggleSidebar}
                >
                  <Menu className="w-5 h-5 text-foreground/80" />
                </Button>
                Histórico
              </DrawerTitle>
              <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg mt-4">
              <button
                onClick={() => setViewMode("active")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === "active" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"
                )}
              >
                Ativos
              </button>
              <button
                onClick={() => setViewMode("archived")}
                className={cn(
                  "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === "archived" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"
                )}
              >
                Arquivados
              </button>
            </div>
          </DrawerHeader>
          <ChatHistoryList
            chats={chats}
            currentChatId={currentChatId}
            setCurrentChatId={setCurrentChatId}
            handleArchiveChat={handleArchiveChat}
            handleUnarchiveChat={handleUnarchiveChat}
            handleDeleteChat={handleDeleteChat}
            viewMode={viewMode}
            onSelect={() => setIsDrawerOpen(false)}
          />
        </DrawerContent>
      </Drawer>

      <Drawer open={isDeleteDrawerOpen} onOpenChange={setIsDeleteDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader className="px-0 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DrawerTitle className="text-xl">Excluir Conversa?</DrawerTitle>
              <DrawerDescription className="text-base pt-2">
                Esta ação não pode ser desfeita. Todo o histórico desta conversa será removido permanentemente.
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex flex-col gap-3 py-6">
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-semibold rounded-xl transition-all"
                onClick={confirmDelete}
              >
                Sim, excluir permanentemente
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="ghost"
                  className="w-full h-12 text-base rounded-xl transition-all"
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

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
        <div className="px-4 py-3">
          <div className="flex bg-neutral-200/50 dark:bg-neutral-800/50 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("active")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "active" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"
              )}
            >
              Ativos
            </button>
            <button
              onClick={() => setViewMode("archived")}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "archived" ? "bg-white dark:bg-neutral-700 shadow-sm" : "text-neutral-500"
              )}
            >
              Arquivados
            </button>
          </div>
        </div>
        <ChatHistoryList
          chats={chats}
          currentChatId={currentChatId}
          setCurrentChatId={setCurrentChatId}
          handleArchiveChat={handleArchiveChat}
          handleUnarchiveChat={handleUnarchiveChat}
          handleDeleteChat={handleDeleteChat}
          viewMode={viewMode}
        />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#212121] relative h-full">
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-16 border-b border-neutral-100 dark:border-neutral-800/50 flex items-center px-4 justify-between bg-white/80 dark:bg-[#212121]/80 backdrop-blur-sm sticky top-0 z-10 shrink-0"
        >
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 -ml-2" onClick={() => setIsDrawerOpen(true)}>
              <MenuIcon className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm md:text-base text-neutral-800 dark:text-neutral-100">Assistente IA</h1>
              <p className="text-[11px] md:text-xs text-neutral-500">Pronto para te ajudar nos estudos</p>
            </div>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 scroll-smooth custom-scrollbar">
          <motion.div
            className="max-w-3xl mx-auto flex flex-col gap-8 pb-4"
            variants={pageContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {messages.length === 0 && !isLoading ? (
              <motion.div variants={itemFadeInUpVariants} className="flex flex-col items-center justify-center pt-24 text-center">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-6">
                  <BotIcon className="w-8 h-8 text-neutral-600 dark:text-neutral-300" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Como posso ajudar hoje?</h2>
                <p className="text-sm text-neutral-500 max-w-md mx-auto mb-8">
                  Faça perguntas sobre suas notas, peça resumos ou crie planos de estudo.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                  {["Resuma meu último estudo", "Me explique o conceito de Quilha", "Crie um questionário sobre Gênesis"].map((suggestion) => (
                    <motion.button
                      key={suggestion}
                      variants={itemFadeInUpVariants}
                      className="p-3 text-sm text-left border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      onClick={() => {
                        setInput(suggestion);
                        if (textareaRef.current) textareaRef.current.focus();
                      }}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((message, i) => (
                  <motion.div
                    key={i}
                    variants={itemFadeInUpVariants}
                    className={cn("flex gap-4 w-full", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "model" && (
                      <div className={cn(
                        "w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0 mt-1",
                        message.content === "" && isLoading && i === messages.length - 1 && "animate-pulse"
                      )}>
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
                          {message.content === "" && isLoading && i === messages.length - 1 ? (
                            <div className="flex gap-1.5 items-center py-2">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                            </div>
                          ) : (
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          )}
                          {message.role === "model" && isLoading && i === messages.length - 1 && message.content !== "" && (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                              className="inline-block w-2.5 h-5 bg-blue-500 dark:bg-blue-400 ml-1 align-middle rounded-sm"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            <div ref={messagesEndRef} className="h-4 w-full shrink-0" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 pb-4 md:pb-6 pt-2 bg-white dark:bg-[#212121] shrink-0"
        >
          <div className="max-w-3xl mx-auto relative">
            <div className="bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl border border-neutral-200 dark:border-neutral-700/50 focus-within:ring-2 focus-within:ring-neutral-300 dark:focus-within:ring-neutral-600 transition-all flex items-end p-2 gap-2 shadow-sm">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Mensagem..."
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
          </div>
        </motion.div>
      </main>

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