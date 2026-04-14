"use client";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
}

export function DeleteConfirmationDrawer({
  open,
  onOpenChange,
  onConfirm,
  title = "esta carta",
}: DeleteConfirmationDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md p-6">
          <DrawerHeader className="text-center flex flex-col items-center">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <DrawerTitle className="text-2xl font-bold">Confirmar Exclusão</DrawerTitle>
            <DrawerDescription className="text-base mt-2">
              Você tem certeza que deseja excluir permanentemente <span className="font-semibold text-foreground">{title}</span>? 
              <br />Esta ação não pode ser desfeita.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="gap-3 mt-6">
            <Button
              variant="destructive"
              className="w-full h-12 text-base font-semibold rounded-xl"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-5 w-5" />
              Sim, Excluir Agora
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full h-12 text-base rounded-xl">
                Não, Voltar
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
