"use client";

import { useAuthStore } from "@/store/authStore";
import { useLetters } from "@/hooks/use-letters";
import { LetterCreationDrawer } from "@/components/letters/letter-creation-drawer";
import { LetterDetailDrawer } from "@/components/letters/letter-detail-drawer";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Mail,
  Calendar,
  Trash2,
  Clock,
  Inbox,
  AlertTriangle
} from "lucide-react";
import Header from "@/components/hub/hub-header";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import { Letter } from "@/schemas/letterSchema";
import { DeleteConfirmationDrawer } from "@/components/letters/delete-confirmation-drawer";

export default function LettersPage() {
  const { user } = useAuthStore();
  const { letters, isLoading, deleteLetter } = useLetters(user?.uid);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [highlightTerm, setHighlightTerm] = useState<string | undefined>(undefined);
  const [letterToDelete, setLetterToDelete] = useState<Letter | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle Deep Linking from Chat
  useEffect(() => {
    const id = searchParams.get("id");
    const h = searchParams.get("h");

    if (id && letters.length > 0) {
      const letter = letters.find(l => l.id === id);
      if (letter) {
        // Wrap in setTimeout to avoid synchronous setState in effect (React 18 lint rule)
        const timer = setTimeout(() => {
          setSelectedLetter(letter);
          if (h) setHighlightTerm(h);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, letters]);

  const closeDrawer = () => {
    setSelectedLetter(null);
    setHighlightTerm(undefined);
    // Remove params from URL without refreshing
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    params.delete("h");
    router.replace(`/hub/letters${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const filteredLetters = letters.filter(letter =>
    letter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    letter.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header
        scrollSearch
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
      />

      <div className="flex flex-col h-full w-full overflow-hidden bg-background px-6 pt-6">
        <div className="flex items-center justify-end mb-8">
          <LetterCreationDrawer>
            <Button className="rounded-full px-6 bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              Nova Carta
            </Button>
          </LetterCreationDrawer>
        </div>

        <main className="flex-1 overflow-y-auto pb-20">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
              ))}
            </div>
          ) : filteredLetters.length > 0 ? (
            <div className="flex flex-col gap-3">
              {filteredLetters.map((letter) => {
                const expired = isPast(new Date(letter.expiresAt));
                return (
                  <div
                    key={letter.id}
                    onClick={() => setSelectedLetter(letter)}
                    className={`group relative flex items-center justify-between rounded-2xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20 cursor-pointer text-left ${expired ? 'opacity-70 bg-muted/20' : ''}`}
                  >
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${expired ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                        <Mail className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold text-lg text-foreground truncate ${expired ? 'line-through decoration-destructive/30' : ''}`}>
                            {letter.title}
                          </h3>
                          {expired && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] uppercase font-bold tracking-wider">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Expirada
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Criada em: {format(new Date(letter.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 font-medium ${expired ? 'text-destructive' : 'text-amber-600 dark:text-amber-500'}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            <span>Expira em: {format(new Date(letter.expiresAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
                          </div>
                        </div>
                        {/* Preview do conteúdo */}
                        <p className={`mt-2 text-sm text-muted-foreground line-clamp-2 italic ${expired ? 'opacity-50' : ''}`}>
                          {letter.content.substring(0, 150)}...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-full text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLetterToDelete(letter);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-4">
                <Inbox className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-medium text-foreground">Nenhuma carta encontrada</h3>
              <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
                {searchTerm ? "Tente buscar por termos diferentes." : "Suas cartas temporárias aparecerão aqui."}
              </p>
            </div>
          )}
        </main>

        {selectedLetter && (
          <LetterDetailDrawer
            letter={selectedLetter}
            onDelete={(id) => {
              deleteLetter(id);
              closeDrawer();
            }}
            open={!!selectedLetter}
            onOpenChange={(open) => {
              if (!open) closeDrawer();
            }}
            highlightTerm={highlightTerm}
          />
        )}

        {showDeleteConfirm && (
          <DeleteConfirmationDrawer
            open={showDeleteConfirm}
            onOpenChange={setShowDeleteConfirm}
            onConfirm={() => {
              if (letterToDelete) {
                deleteLetter(letterToDelete.id);
                setLetterToDelete(null);
              }
            }}
            title={letterToDelete ? `a carta "${letterToDelete.title}"` : "esta carta"}
          />
        )}
      </div>
    </>
  );
}
