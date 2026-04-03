"use client"

import React, { useState } from "react"
import { useReaderStore, ReferenceInstance } from "@/store/readerStore"
import { transformDocIdLinks } from "@/lib/jwpub-utils"
import { Button } from "@/components/ui/button"
import { Info, X, BookOpen, Clock, FileText, Trash2, ChevronRight, Loader2 } from "lucide-react"
import * as Tabs from "@radix-ui/react-tabs"
import * as Accordion from "@radix-ui/react-accordion"
import { parseBibleReference } from "@/lib/bible-utils"
import { jwpubReference } from "@/lib/jwpub-reference"

export function ReferenceSidebar() {
  const {
    activeReferences,
    lastReference,
    docReferences,
    removeReference,
    clearReferences
  } = useReaderStore()

  const [activeTab, setActiveTab] = useState("individual")

  const [prevLastReference, setPrevLastReference] = useState(lastReference)

  if (lastReference !== prevLastReference) {
    if (lastReference) {
      setActiveTab("individual")
    }
    setPrevLastReference(lastReference)
  }

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
      <Tabs.List className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl mb-6">
        <Tabs.Trigger
          value="individual"
          className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-zinc-500"
        >
          <Info className="w-3 h-3" />
          Ref
        </Tabs.Trigger>
        <Tabs.Trigger
          value="history"
          className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-zinc-500"
        >
          <Clock className="w-3 h-3" />
          Pilha
        </Tabs.Trigger>
        <Tabs.Trigger
          value="document"
          className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-amber-600 data-[state=active]:shadow-sm text-zinc-500"
        >
          <FileText className="w-3 h-3" />
          Doc
        </Tabs.Trigger>
      </Tabs.List>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Tabs.Content value="individual" className="animate-in fade-in slide-in-from-right-4 duration-300">
          {lastReference ? (
            <ReferenceCard reference={lastReference} onRemove={() => removeReference(lastReference.id)} />
          ) : (
            <EmptyState message="Clique em uma referência para visualizar aqui." />
          )}
        </Tabs.Content>

        <Tabs.Content value="history" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Histórico ({activeReferences.length})
              </span>
              {activeReferences.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearReferences}
                  className="h-7 px-2 text-[9px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  LIMPAR TUDO
                </Button>
              )}
            </div>
            {activeReferences.length > 0 ? (
              activeReferences.map((ref) => (
                <ReferenceCard key={ref.id} reference={ref} onRemove={() => removeReference(ref.id)} />
              ))
            ) : (
              <EmptyState message="Nenhuma referência no histórico." />
            )}
          </div>
        </Tabs.Content>

        <Tabs.Content value="document" className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="px-2 mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Detectadas no Documento ({docReferences.length})
              </span>
            </div>
            {docReferences.length > 0 ? (
              <Accordion.Root type="single" collapsible className="space-y-2">
                {docReferences.map((ref) => (
                  <DocumentReferenceItem key={ref.id} reference={ref} />
                ))}
              </Accordion.Root>
            ) : (
              <EmptyState message="Nenhuma referência detectada no texto." />
            )}
          </div>
        </Tabs.Content>
      </div>
    </Tabs.Root>
  )
}

function ReferenceCard({ reference, onRemove }: { reference: ReferenceInstance; onRemove: () => void }) {
  return (
    <div className="group relative bg-zinc-50/50 dark:bg-zinc-800/20 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-white dark:hover:bg-zinc-800 mb-4">
      <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <Info className="w-3 px-0 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            {reference.label}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X className="w-3 h-3 text-zinc-400" />
        </Button>
      </div>
      <div className="jwpub-content text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {reference.type === "bible" ? (
          <div dangerouslySetInnerHTML={{ __html: reference.content }} />
        ) : (
          <div dangerouslySetInnerHTML={{ __html: transformDocIdLinks(reference.content) }} />
        )}
      </div>
    </div>
  )
}

function DocumentReferenceItem({ reference }: { reference: ReferenceInstance }) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchContent = async () => {
    if (content || loading) return

    setLoading(true)
    try {
      if (reference.type === "bible") {
        const parsed = parseBibleReference(reference.label)
        if (parsed) {
          const res = await fetch(`/api/bible?v=NWT&b=${encodeURIComponent(parsed.book)}&c=${parsed.chapter}`)
          if (res.ok) {
            const data = await res.json()
            const versesText = parsed.verses
              .map((vNum) => {
                const found = data.verses.find((v: { verse: number; text: string }) => v.verse === vNum)
                return found ? `${found.text} ` : ""
              })
              .join("")
            setContent(versesText)
          }
        }
      } else if (reference.type === "publication") {
        const paragraphs = await jwpubReference.getReferencedContent(reference.label)
        if (paragraphs) {
          setContent(paragraphs.map((p) => p.html).join(""))
        }
      }
    } catch (e) {
      console.error("Failed to lazy load content:", e)
      setContent("Erro ao carregar conteúdo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Accordion.Item value={reference.id} className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/50">
      <Accordion.Header className="flex">
        <Accordion.Trigger
          onClick={fetchContent}
          className="flex flex-1 items-center justify-between px-4 py-3 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {reference.label}
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-300 group-data-[state=open]:rotate-90 transition-transform" />
        </Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
        <div className="pt-2 border-t border-zinc-50 dark:border-zinc-800/50 jwpub-content text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {loading ? (
            <div className="flex items-center gap-2 py-2 italic text-zinc-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Carregando...
            </div>
          ) : content ? (
            <div dangerouslySetInnerHTML={{ __html: transformDocIdLinks(content) }} />
          ) : (
            <div className="py-2 italic text-zinc-400">Não foi possível carregar o conteúdo.</div>
          )}
        </div>
      </Accordion.Content>
    </Accordion.Item>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center text-center px-6">
      <BookOpen className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mb-3" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
        Notas & Referências
      </p>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-1 uppercase tracking-tight">
        {message}
      </p>
    </div>
  )
}
