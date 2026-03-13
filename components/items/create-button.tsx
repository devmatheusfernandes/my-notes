"use client";

import { FilePlus2, FolderPlus, Loader2, LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFolders } from "@/hooks/use-folders";
import { useNotes } from "@/hooks/use-notes";
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
import { Input } from "@/components/ui/input";
import { useFolderId } from "@/utils/searchParams";

interface MenuItem {
  icon: LucideIcon;
  label: string;
  action: () => Promise<void> | void;
  offsetY: number;
  openDelay: string;
  closeDelay: string;
}

interface CreateButtonProps {
  isLoading?: boolean;
  handleCreateNewNote: () => Promise<void>;
  handleCreateNewFolder: (title: string) => Promise<void>;
}

function GooFilter() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="fab-goo" x="-50%" y="-150%" width="200%" height="400%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 22 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  );
}

function PlusIcon({ open }: { open: boolean }) {
  const base: React.CSSProperties = {
    position: "absolute",
    background: "#fff",
    borderRadius: 3,
  };

  return (
    <div
      style={{
        position: "relative",
        width: 22,
        height: 22,
        transform: open ? "rotate(45deg)" : "rotate(0deg)",
        transition: "transform 0.42s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <span
        style={{
          ...base,
          width: "100%",
          height: 2.5,
          top: "50%",
          left: 0,
          transform: "translateY(-50%)",
        }}
      />
      <span
        style={{
          ...base,
          height: "100%",
          width: 2.5,
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
        }}
      />
    </div>
  );
}

interface FloatingItemProps {
  item: MenuItem;
  open: boolean;
  isLoading: boolean;
  onSelect: () => void;
}

function FloatingItem({ item, open, isLoading, onSelect }: FloatingItemProps) {
  const { icon: Icon, label, offsetY, openDelay, closeDelay } = item;
  const delay = open ? openDelay : closeDelay;

  return (
    <button
      aria-label={label}
      disabled={isLoading}
      onClick={onSelect}
      style={{
        position: "absolute",
        bottom: 0,
        left: "50%",
        width: 54,
        height: 54,
        marginLeft: -27,
        borderRadius: "50%",
        background: "#111",
        border: "none",
        cursor: isLoading ? "default" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: open ? "auto" : "none",
        transform: open
          ? `translateY(-${offsetY}px) scale(1)`
          : "translateY(0px) scale(0.05)",
        opacity: open ? 1 : 0,
        transition: [
          `transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}`,
          `opacity 0.38s ease ${delay}`,
        ].join(", "),
        willChange: "transform, opacity",
      }}
    >
      <Icon size={20} color="#fff" strokeWidth={1.8} />
    </button>
  );
}

export default function CreateButton({
  isLoading = false,
  handleCreateNewNote,
  handleCreateNewFolder,
}: CreateButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        open &&
        wrapRef.current &&
        !wrapRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const menuItems: MenuItem[] = [
    {
      icon: FolderPlus,
      label: "Criar pasta",
      action: () => {
        setIsDrawerOpen(true);
      },
      offsetY: 82,
      openDelay: "0ms",
      closeDelay: "50ms",
    },
    {
      icon: FilePlus2,
      label: "Criar nota",
      action: handleCreateNewNote,
      offsetY: 152,
      openDelay: "60ms",
      closeDelay: "0ms",
    },
  ];

  function handleItemSelect(item: MenuItem) {
    void item.action();
    setOpen(false); 
  }

  const onSubmitFolder = async () => {
    if (!folderName.trim()) return;

    setIsSubmittingFolder(true);
    try {
      await handleCreateNewFolder(folderName);
      setIsDrawerOpen(false);
      setFolderName("");
    } catch {
    } finally {
      setIsSubmittingFolder(false);
    }
  };

  return (
    <>
      <GooFilter />
      <div
        ref={wrapRef}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 68,
          height: 68,
          filter: "url(#fab-goo)",
        }}
      >
        {menuItems.map((item) => (
          <FloatingItem
            key={item.label}
            item={item}
            open={open}
            isLoading={isLoading}
            onSelect={() => handleItemSelect(item)}
          />
        ))}

        <button
          aria-label="Criar"
          aria-expanded={open}
          disabled={isLoading}
          onClick={() => !isLoading && setOpen((prev) => !prev)}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 68,
            height: 68,
            borderRadius: "50%",
            background: "#111",
            border: "none",
            cursor: isLoading ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isLoading ? (
            <Loader2
              size={24}
              color="#fff"
              strokeWidth={2}
              style={{ animation: "fab-spin 1s linear infinite" }}
            />
          ) : (
            <PlusIcon open={open} />
          )}
        </button>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Nova Pasta</DrawerTitle>
              <DrawerDescription>
                Dê um nome para organizar seus estudos.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pb-0">
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Ex: Estudos em Gênesis"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && folderName.trim()) {
                    onSubmitFolder();
                  }
                }}
              />
            </div>
            <DrawerFooter>
              <Button
                onClick={onSubmitFolder}
                disabled={!folderName.trim() || isSubmittingFolder}
                className="bg-[#111] text-white hover:bg-black"
              >
                {isSubmittingFolder ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Criar pasta"
                )}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      <style>{`
        @keyframes fab-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export function SmartCreateButton({
  userId = "user_teste_123",
}: {
  userId?: string;
}) {
  const router = useRouter();
  const { createNote, isLoading: isNotesLoading } = useNotes();
  const { createFolder, isLoading: isFoldersLoading } = useFolders();
  const activeFolderId = useFolderId();
  const isLoading = isNotesLoading || isFoldersLoading;

  const handleCreateFolder = async (folderName: string) => {
    try {
      await createFolder(userId, {
        title: folderName,
        parentId: activeFolderId ?? undefined,
      });
      toast.success("Pasta criada!");
    } catch (error) {
      console.log("Erro ao criar pasta:", error);
      toast.error("Erro ao criar pasta!");
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote(userId, {
        title: "Nota nova",
        content: "",
        folderId: activeFolderId ?? undefined,
      });
      toast.success("Nota criada!");
      router.push(`/hub/notes/${newNote.id}`);
    } catch (error) {
      console.log("Erro ao criar nota:", error);
      toast.error("Erro ao criar sua nota!");
    }
  };

  return (
    <CreateButton
      isLoading={isLoading}
      handleCreateNewNote={handleCreateNote}
      handleCreateNewFolder={handleCreateFolder}
    />
  );
}
