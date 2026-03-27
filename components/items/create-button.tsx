"use client";

import {
  FilePlus2,
  FileText,
  FolderPlus,
  Loader2,
  LucideIcon,
  Pencil,
  Tag,
  Trash2,
} from "lucide-react";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFolders } from "@/hooks/use-folders";
import { useNotes } from "@/hooks/use-notes";
import { useTags } from "@/hooks/use-tags";
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
import { tagColors } from "@/lib/tag-colors";
import { useFolderId } from "@/utils/searchParams";
import type { Tag as TagModel } from "@/schemas/tagSchema";
import { useAuthStore } from "@/store/authStore";
import { storageService } from "@/services/storageService";

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
  handleUploadPdf?: (file: File) => Promise<void>;
  tags?: TagModel[];
  handleCreateNewTag?: (title: string, color?: string) => Promise<void>;
  handleEditTag?: (
    tagId: string,
    title: string,
    color?: string,
  ) => Promise<void>;
  handleDeleteTag?: (tagId: string) => Promise<void>;
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
  handleUploadPdf,
  tags = [],
  handleCreateNewTag,
  handleEditTag,
  handleDeleteTag,
}: CreateButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);

  const [isTagDrawerOpen, setIsTagDrawerOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState<string>(tagColors[0]);
  const [isSubmittingTag, setIsSubmittingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagTitle, setEditingTagTitle] = useState("");
  const [editingTagColor, setEditingTagColor] = useState<string>(tagColors[0]);
  const [isSavingTag, setIsSavingTag] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

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

  const onPdfSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file || !handleUploadPdf) return;
    await handleUploadPdf(file);
  };

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
    ...(handleCreateNewTag
      ? ([
          {
            icon: Tag,
            label: "Criar tag",
            action: () => {
              setIsTagDrawerOpen(true);
            },
            offsetY: 152,
            openDelay: "60ms",
            closeDelay: "0ms",
          },
        ] satisfies MenuItem[])
      : []),
    {
      icon: FilePlus2,
      label: "Criar nota",
      action: handleCreateNewNote,
      offsetY: handleCreateNewTag ? 222 : 152,
      openDelay: handleCreateNewTag ? "120ms" : "60ms",
      closeDelay: "0ms",
    },
    ...(handleUploadPdf
      ? ([
          {
            icon: FileText,
            label: "Enviar PDF",
            action: () => {
              pdfInputRef.current?.click();
            },
            offsetY: handleCreateNewTag ? 292 : 222,
            openDelay: handleCreateNewTag ? "180ms" : "120ms",
            closeDelay: "0ms",
          },
        ] satisfies MenuItem[])
      : []),
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

  const onSubmitTag = async () => {
    if (!handleCreateNewTag) return;
    if (!tagName.trim()) return;

    setIsSubmittingTag(true);
    try {
      await handleCreateNewTag(tagName, tagColor);
      setTagName("");
      setTagColor(tagColors[0]);
    } catch {
    } finally {
      setIsSubmittingTag(false);
    }
  };

  const onStartEditTag = (tag: TagModel) => {
    setEditingTagId(tag.id);
    setEditingTagTitle(tag.title);
    setEditingTagColor(tag.color ?? tagColors[0]);
  };

  const onCancelEditTag = () => {
    setEditingTagId(null);
    setEditingTagTitle("");
    setEditingTagColor(tagColors[0]);
  };

  const onSaveTag = async () => {
    if (!handleEditTag) return;
    if (!editingTagId) return;
    if (!editingTagTitle.trim()) return;

    setIsSavingTag(true);
    try {
      await handleEditTag(editingTagId, editingTagTitle, editingTagColor);
      setEditingTagId(null);
      setEditingTagTitle("");
      setEditingTagColor(tagColors[0]);
    } catch {
    } finally {
      setIsSavingTag(false);
    }
  };

  const onDeleteTag = async (tagId: string) => {
    if (!handleDeleteTag) return;
    setDeletingTagId(tagId);
    try {
      await handleDeleteTag(tagId);
      if (editingTagId === tagId) {
        setEditingTagId(null);
        setEditingTagTitle("");
      }
    } catch {
    } finally {
      setDeletingTagId(null);
    }
  };

  return (
    <>
      <GooFilter />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onPdfSelected}
        style={{ display: "none" }}
        disabled={isLoading}
      />
      <div
        ref={wrapRef}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 68,
          height: 68,
          zIndex: 50,
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

      <Drawer
        open={isTagDrawerOpen}
        onOpenChange={(value) => {
          setIsTagDrawerOpen(value);
          if (!value) {
            setTagName("");
            setTagColor(tagColors[0]);
            setEditingTagId(null);
            setEditingTagTitle("");
            setEditingTagColor(tagColors[0]);
          }
        }}
      >
        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Tags</DrawerTitle>
              <DrawerDescription>
                Crie, edite e delete tags para organizar suas notas.
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-4 pb-0">
              <div className="flex items-center gap-2">
                <Input
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Ex: Teologia"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && tagName.trim()) {
                      onSubmitTag();
                    }
                  }}
                />
                <Button
                  onClick={onSubmitTag}
                  disabled={!tagName.trim() || isSubmittingTag}
                  className="bg-[#111] text-white hover:bg-black"
                >
                  {isSubmittingTag ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Adicionar"
                  )}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {tagColors.map((color) => {
                  const selected = color === tagColor;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setTagColor(color)}
                      className={[
                        "size-7 rounded-full border",
                        color,
                        selected
                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                          : "border-border",
                      ].join(" ")}
                      aria-label={`Cor ${color}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="p-4">
              <div className="flex flex-col gap-2">
                {tags.length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Nenhuma tag criada ainda.
                  </div>
                ) : (
                  tags.map((tag) => {
                    const isEditing = editingTagId === tag.id;
                    return (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          {isEditing ? (
                            <div className="flex w-full flex-col gap-2">
                              <Input
                                value={editingTagTitle}
                                onChange={(e) =>
                                  setEditingTagTitle(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "Enter" &&
                                    editingTagTitle.trim()
                                  ) {
                                    onSaveTag();
                                  }
                                  if (e.key === "Escape") {
                                    onCancelEditTag();
                                  }
                                }}
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                {tagColors.map((color) => {
                                  const selected = color === editingTagColor;
                                  return (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setEditingTagColor(color)}
                                      className={[
                                        "size-6 rounded-full border",
                                        color,
                                        selected
                                          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                                          : "border-border",
                                      ].join(" ")}
                                      aria-label={`Cor ${color}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <>
                              <span
                                className={[
                                  "size-2 shrink-0 rounded-full",
                                  tag.color ?? "bg-muted",
                                ].join(" ")}
                              />
                              <div className="truncate text-sm font-medium">
                                {tag.title}
                              </div>
                            </>
                          )}
                        </div>

                        {isEditing ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={onCancelEditTag}
                              disabled={isSavingTag}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={onSaveTag}
                              disabled={!editingTagTitle.trim() || isSavingTag}
                              className="bg-[#111] text-white hover:bg-black"
                            >
                              {isSavingTag ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                "Salvar"
                              )}
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onStartEditTag(tag)}
                              aria-label={`Editar ${tag.title}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => onDeleteTag(tag.id)}
                              disabled={deletingTagId === tag.id}
                              aria-label={`Deletar ${tag.title}`}
                            >
                              {deletingTagId === tag.id ? (
                                <Loader2 className="size-4 animate-spin" />
                              ) : (
                                <Trash2 className="size-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

export function SmartCreateButton() {
  const { user } = useAuthStore();
  const userId = user?.uid || "";
  const router = useRouter();
  const {
    createNote,
    updateNote,
    deleteNote,
    isLoading: isNotesLoading,
  } = useNotes();
  const { createFolder, isLoading: isFoldersLoading } = useFolders();
  const {
    tags,
    fetchTags,
    createTag,
    editTag,
    deleteTag,
    isLoading: isTagsLoading,
  } = useTags();
  const activeFolderId = useFolderId();
  const isLoading = isNotesLoading || isFoldersLoading || isTagsLoading;

  useEffect(() => {
    fetchTags(userId);
  }, [fetchTags, userId]);

  const handleCreateFolder = async (folderName: string) => {
    try {
      await createFolder(userId, {
        title: folderName,
        parentId: activeFolderId ?? "",
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
        folderId: activeFolderId ?? "Raiz",
      });
      toast.success("Nota criada!");
      router.push(`/hub/notes/${newNote.id}`);
    } catch (error) {
      console.log("Erro ao criar nota:", error);
      toast.error("Erro ao criar sua nota!");
    }
  };

  const handleUploadPdf = async (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Envie um arquivo PDF.");
      return;
    }

    const MAX_SINGLE_UPLOAD_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SINGLE_UPLOAD_BYTES) {
      toast.error("O PDF precisa ter no máximo 10 MB.");
      return;
    }

    const rawTitle = file.name.replace(/\.pdf$/i, "").trim();
    const title = (rawTitle || "PDF").slice(0, 20);

    let createdNoteId: string | null = null;
    try {
      const newNote = await createNote(userId, {
        title,
        content: null,
        folderId: activeFolderId ?? "Raiz",
        type: "pdf",
      });
      createdNoteId = newNote.id;

      const url = await storageService.uploadFile(
        userId,
        `pdf/${newNote.id}.pdf`,
        file,
      );
      await updateNote(newNote.id, { fileUrl: url });

      toast.success("PDF enviado!");
      router.push(`/hub/notes/${newNote.id}`);
    } catch (error) {
      if (createdNoteId) {
        await deleteNote(createdNoteId).catch(() => {});
      }
      console.log("Erro ao enviar PDF:", error);
      toast.error("Erro ao enviar PDF!");
    }
  };

  const handleCreateTag = async (title: string, color?: string) => {
    try {
      await createTag(userId, {
        title: title.trim(),
        ...(color ? { color } : {}),
      });
      toast.success("Tag criada!");
    } catch (error) {
      console.log("Erro ao criar tag:", error);
      toast.error("Erro ao criar tag!");
    }
  };

  const handleEditTag = async (
    tagId: string,
    title: string,
    color?: string,
  ) => {
    try {
      await editTag(userId, tagId, {
        title: title.trim(),
        ...(color ? { color } : {}),
      });
      toast.success("Tag editada!");
    } catch (error) {
      console.log("Erro ao editar tag:", error);
      toast.error("Erro ao editar tag!");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag(tagId);
      toast.success("Tag deletada!");
    } catch (error) {
      console.log("Erro ao deletar tag:", error);
      toast.error("Erro ao deletar tag!");
    }
  };

  return (
    <CreateButton
      isLoading={isLoading}
      handleCreateNewNote={handleCreateNote}
      handleCreateNewFolder={handleCreateFolder}
      handleUploadPdf={handleUploadPdf}
      tags={tags}
      handleCreateNewTag={handleCreateTag}
      handleEditTag={handleEditTag}
      handleDeleteTag={handleDeleteTag}
    />
  );
}
