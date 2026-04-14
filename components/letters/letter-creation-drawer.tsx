"use client";

import { useState, useRef } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractTextFromPdf } from "@/lib/pdf/pdf-utils";
import { useLetters } from "@/hooks/use-letters";
import { useAuthStore } from "@/store/authStore";

interface LetterCreationDrawerProps {
  children: React.ReactNode;
}

export function LetterCreationDrawer({ children }: LetterCreationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [creationDate, setCreationDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { createLetter } = useLetters(user?.uid);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(".pdf", ""));
      }
    } else if (selectedFile) {
      toast.error("Por favor, selecione um arquivo PDF.");
    }
  };

  const handleCreate = async () => {
    if (!user?.uid || !file || !title || !expiryDate) {
      toast.error("Preencha todos os campos e selecione um PDF.");
      return;
    }

    setIsProcessing(true);
    try {
      // Extrai o texto do PDF no cliente
      const extractedText = await extractTextFromPdf(file);

      if (!extractedText.trim()) {
        throw new Error("Não foi possível extrair texto deste PDF.");
      }

      // Salva no Firestore
      await createLetter(user.uid, {
        title,
        content: extractedText,
        // Adicionamos o horário para evitar que o fuso horário (UTC) mude o dia ao salvar
        createdAt: new Date(`${creationDate}T00:00:00`).toISOString(),
        expiresAt: new Date(`${expiryDate}T23:59:59`).toISOString(),
      });

      toast.success("Carta criada com sucesso!");
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar PDF.";
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setExpiryDate("");
    setCreationDate(format(new Date(), "yyyy-MM-dd"));
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-lg p-6">
          <DrawerHeader>
            <DrawerTitle>Nova Carta Temporária</DrawerTitle>
            <DrawerDescription>
              O texto será extraído do PDF e guardado até a data de expiração. O arquivo original não será salvo.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título da Carta</Label>
              <Input
                id="title"
                placeholder="Ex: Contrato de Aluguel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="created">Data de Criação</Label>
              <Input
                id="created"
                type="date"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiry">Data de Expiração</Label>
              <div className="relative">
                <Input
                  id="expiry"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Arquivo PDF</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 py-8 transition-colors hover:bg-muted/50"
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center px-4">
                  {file ? file.name : "Clique para selecionar ou arraste o PDF aqui"}
                </span>
                {file && (
                  <span className="mt-1 text-xs text-primary font-medium">
                    Arquivo selecionado
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleCreate} disabled={isProcessing} className="w-full">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando PDF...
                </>
              ) : (
                "Criar Carta"
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancelar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
