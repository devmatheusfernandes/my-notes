"use client";

import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isPast } from "date-fns";
import { Calendar, Clock, Mail, Trash2, AlertTriangle } from "lucide-react";
import { Letter } from "@/schemas/letterSchema";
import { useState } from "react";
import { DeleteConfirmationDrawer } from "./delete-confirmation-drawer";

interface LetterDetailDrawerProps {
  letter: Letter;
  children?: React.ReactNode;
  onDelete: (id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  highlightTerm?: string;
}

const HighlightText = ({ text, highlight }: { text: string; highlight?: string }) => {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/50 text-foreground px-0.5 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export function LetterDetailDrawer({ letter, children, onDelete, open, onOpenChange, highlightTerm }: LetterDetailDrawerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const expired = isPast(new Date(letter.expiresAt));

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
        <DrawerContent className="max-h-[90vh]">
          <div className="mx-auto w-full max-w-2xl flex flex-col h-full overflow-hidden">
            <DrawerHeader className="border-b">
              <div className="flex items-center gap-4 mb-2">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${expired ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <DrawerTitle className={`text-xl font-bold truncate ${expired ? 'text-muted-foreground line-through decoration-destructive/30' : ''}`}>
                      {letter.title}
                    </DrawerTitle>
                    {expired && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] uppercase font-bold tracking-wider">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Expirada
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Criada em: {format(new Date(letter.createdAt), "dd/MM/yyyy")}</span>
                    </div>
                    <div className={`flex items-center gap-1 font-medium ${expired ? 'text-destructive' : 'text-amber-600'}`}>
                      <Calendar className="h-3 w-3" />
                      <span>Expira em: {format(new Date(letter.expiresAt), "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DrawerHeader>

            <div className={`flex-1 overflow-hidden p-6 ${expired ? 'bg-muted/10 opacity-70' : 'bg-muted/30'}`}>
              <ScrollArea className="h-full pr-4">
                <div className="prose prose-sm dark:prose-invert max-w-none text-left">
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground select-text">
                    <HighlightText text={letter.content} highlight={highlightTerm} />
                  </p>
                </div>
              </ScrollArea>
            </div>

            <DrawerFooter className="border-t flex-row gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Definitivamente
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <DeleteConfirmationDrawer
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => onDelete(letter.id)}
        title={`a carta "${letter.title}"`}
      />
    </>
  );
}
