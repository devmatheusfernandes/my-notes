"use client";

import { useState } from "react";
import { useJwpub } from "@/hooks/use-jwpub";
import { JwpubMetadata } from "@/schemas/jwpubSchema";
import {
  Plus,
  BookOpen,
  Trash2,
  ChevronRight,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerDescription
} from "@/components/ui/drawer";
import { JwpubUploader } from "@/components/jwpub/JwpubUploader";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/hub/hub-header";
import { Loading } from "@/components/ui/loading";

export default function PersonalStudyPage() {
  const { publications, isLoading, deletePublication } = useJwpub();
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isDeleteDrawerOpen, setIsDeleteDrawerOpen] = useState(false);
  const [pubToDelete, setPubToDelete] = useState<JwpubMetadata | null>(null);

  const filteredPubs = publications?.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.symbol.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleDeleteClick = (pub: JwpubMetadata, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPubToDelete(pub);
    setIsDeleteDrawerOpen(true);
  };

  const confirmDelete = () => {
    if (pubToDelete) {
      deletePublication(pubToDelete.symbol);
      setIsDeleteDrawerOpen(false);
      setPubToDelete(null);
    }
  };

  return (
    <div className="container-page">
      <Header
        scrollSearch
        searchQuery={search}
        setSearchQuery={setSearch}
        showSearch={true}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="page-title">Biblioteca</h2>
              <p className="page-description">Suas publicações importadas localmente.</p>
            </div>

            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <Button className="gap-2 shrink-0 rounded-full shadow-sm px-6">
                  <Plus className="w-4 h-4" />
                  Importar JWPUB
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="mx-auto w-full max-w-lg p-6">
                  <DrawerHeader>
                    <DrawerTitle>Importar Publicação</DrawerTitle>
                    <DrawerDescription>
                      Selecione um arquivo .jwpub para processar e salvar no seu navegador.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="pt-4">
                    <JwpubUploader />
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <Loading />
            ) : filteredPubs.length > 0 ? (
              <div className="border rounded-xl divide-y bg-card overflow-hidden shadow-xs">
                {filteredPubs.map((pub) => (
                  <div key={pub.symbol} className="group flex items-center p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <Link
                      href={`/hub/personal-study/${pub.symbol}`}
                      className="flex-1 flex items-center gap-4 overflow-hidden"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-foreground">{pub.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded uppercase text-[10px] font-bold">{pub.symbol}</span>
                          <span>•</span>
                          <span>Acessado {formatDistanceToNow(new Date(pub.lastAccessed), { addSuffix: true, locale: ptBR })}</span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => handleDeleteClick(pub, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-2xl gap-4 bg-muted/20">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="font-semibold text-lg text-foreground">Nenhuma publicação encontrada</h3>
                  <p className="text-sm text-muted-foreground max-w-[300px]">
                    {search ? "Tente outro termo de busca ou importe uma nova publicação." : "Sua biblioteca está vazia. Importe um arquivo .jwpub para começar."}
                  </p>
                </div>
                {!search && (
                  <Button onClick={() => setIsDrawerOpen(true)} variant="outline" className="mt-2 text-foreground">
                    Importar agora
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer open={isDeleteDrawerOpen} onOpenChange={setIsDeleteDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-lg p-6">
            <DrawerHeader className="px-0">
              <div className="self-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <DrawerTitle className="text-xl">Remover publicação?</DrawerTitle>
              <DrawerDescription className="text-base pt-2">
                Tem certeza que deseja remover <strong>&quot;{pubToDelete?.title}&quot;</strong>?
                Esta ação não poderá ser desfeita e os dados locais serão excluídos.
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-col gap-3 py-6">
              <Button
                variant="destructive"
                className="w-full h-12 text-base font-semibold rounded-xl"
                onClick={confirmDelete}
              >
                Sim, Remover
              </Button>
              <Button
                variant="ghost"
                className="w-full h-12 text-base rounded-xl"
                onClick={() => setIsDeleteDrawerOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}