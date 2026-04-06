"use client"

import { useRef, useState, useMemo, useEffect } from "react"
import { EditorContent, EditorContext, useEditor, type Content, Editor, JSONContent } from "@tiptap/react"
import { generateHTML } from "@tiptap/html"
import { Node, Mark } from "@tiptap/pm/model"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"
import { ReferenceExtension } from "@/components/tiptap-extension/reference-extension"
import { SearchHighlight } from "@/components/tiptap-extension/search-highlight-extension"
import { NoteLinkExtension } from "@/components/tiptap-extension/note-link-extension"
import { HashtagExtension } from "@/components/tiptap-extension/hashtag-extension"
import { createSuggestionRender } from "@/components/tiptap-extension/suggestion-factory"
import { publicationSuggestion } from "@/components/tiptap-extension/publication-suggestion"
import { useReaderStore, type ReferenceInstance } from "@/store/readerStore"
import { useNotes } from "@/hooks/use-notes"
import { useTags } from "@/hooks/use-tags"
import { parseBibleReference } from "@/lib/bible/bible-utils"
import { jwpubReference } from "@/lib/jwpub/jwpub-reference"
import throttle from "lodash.throttle"
import { useRouter } from "next/navigation"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import { toast } from "sonner"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"
import { PanelRightOpen, PanelRightClose, PencilIcon } from "lucide-react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-editor/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/notes/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-editor/simple-editor.scss"

interface SimpleEditorProps {
  content: Content
  title?: string
  userId: string
  onChange?: (data: { json: Content; text: string }) => void
  onTitleChange?: (newTitle: string) => void
  highlightTerm?: string
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  isSidebarOpen,
  onToggleSidebar,
  title,
  onTitleChange,
  onBack,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  title: string
  onTitleChange: (v: string) => void
  onBack: () => void
}) => {
  return (
    <div className="flex items-center w-full min-w-0">
      {/* LEFT: Back + Title */}
      <ToolbarGroup className="flex-shrink-0">
        <Button
          variant="ghost"
          size="small"
          onClick={onBack}
          className="tiptap-toolbar-button h-8 w-8 text-zinc-500 hover:text-amber-500"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>

        {!isMobile ? (
          <div className="w-[200px] transition-all duration-200">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Título da nota..."
              className="h-8 border-none bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-amber-500/30 text-sm font-semibold transition-colors"
            />
          </div>
        ) : (
        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              size="small"
              className="tiptap-toolbar-button h-8 w-8 text-zinc-500 hover:text-amber-500"
            >
              <PencilIcon className="w-4 h-4" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-2xl px-6 pb-12">
            <DrawerHeader className="mb-6">
              <DrawerTitle>Editar Título</DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="mobile-title"
                  className="text-xs font-semibold uppercase tracking-wider text-zinc-500"
                >
                  Título
                </Label>
                <Input
                  id="mobile-title"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Digite o título..."
                  autoFocus
                  className="h-12 text-base rounded-xl border-zinc-200 dark:border-zinc-800"
                />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
        )}
      </ToolbarGroup>

      <ToolbarSeparator />

      <Spacer />

      {/* CENTER: Editor Tools */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
        <ToolbarGroup>
          <UndoRedoButton action="undo" />
          <UndoRedoButton action="redo" />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
          <ListDropdownMenu
            modal={false}
            types={["bulletList", "orderedList", "taskList"]}
          />
          <BlockquoteButton />
          <CodeBlockButton />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <MarkButton type="bold" />
          <MarkButton type="italic" />
          <MarkButton type="strike" />
          <MarkButton type="code" />
          <MarkButton type="underline" />
          {!isMobile ? (
            <ColorHighlightPopover />
          ) : (
            <ColorHighlightPopoverButton onClick={onHighlighterClick} />
          )}
          {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <MarkButton type="superscript" />
          <MarkButton type="subscript" />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <TextAlignButton align="left" />
          <TextAlignButton align="center" />
          <TextAlignButton align="right" />
          <TextAlignButton align="justify" />
        </ToolbarGroup>

        <ToolbarSeparator />

        <ToolbarGroup>
          <ImageUploadButton text="Add" />
        </ToolbarGroup>
      </div>

      <Spacer />

      <ToolbarSeparator />

      {/* RIGHT: System Tools */}
      <ToolbarGroup className="flex-shrink-0">
        <ThemeToggle />
        <Button
          variant="ghost"
          size="small"
          onClick={onToggleSidebar}
          className="tiptap-toolbar-button h-8 w-8 text-zinc-500 hover:text-amber-500"
        >
          {isSidebarOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </Button>
      </ToolbarGroup>
    </div>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({
  content,
  title,
  userId,
  onChange,
  onTitleChange,
  highlightTerm,
}: SimpleEditorProps) {
  const [localTitle, setLocalTitle] = useState(title ?? "")
  const [prevTitle, setPrevTitle] = useState(title)

  if (title !== prevTitle) {
    setLocalTitle(title ?? "")
    setPrevTitle(title)
  }

  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const router = useRouter()
  const toolbarRef = useRef<HTMLDivElement>(null)
  const { addReference, setDocReferences, isSidebarOpen, setIsSidebarOpen } = useReaderStore()
  
  // Sync local title with prop when it changing externally (e.g. from parent)
  // Moved to render-time sync to avoid cascading renders in useEffect


  const { notes } = useNotes(userId)
  const { tags } = useTags(userId)

  // Scan document for all references
  const scanReferences = useMemo(() => throttle((editor: Editor) => {
    if (!editor) return
    const refs: ReferenceInstance[] = []

    editor.state.doc.descendants((node: Node) => {
      const mark = node.marks.find((m: Mark) => m.type.name === 'reference')
      if (mark) {
        const { reference, type } = mark.attrs
        // Avoid duplicates by label and type
        if (!refs.find(r => r.label === reference && r.type === type)) {
          refs.push({
            id: `doc-${reference}-${type}`,
            label: reference,
            type,
            content: '', // Content will be lazy-loaded in the sidebar
          })
        }
      }
    })

    setDocReferences(refs)
  }, 2000), [setDocReferences])

  const handleReferenceClick = async (reference: string, type: "bible" | "publication") => {
    if (type === "bible") {
      const parsed = parseBibleReference(reference)
      if (!parsed) return

      try {
        const res = await fetch(`/api/bible?v=NWT&b=${encodeURIComponent(parsed.book)}&c=${parsed.chapter}`)
        if (res.ok) {
          const data = await res.json()
          const versesText = parsed.verses
            .map((vNum) => {
              const found = data.verses.find((v: { verse: number; text: string }) => v.verse === vNum)
              return found
                ? `${found.text} `
                : ""
            })
            .join("")

          if (versesText) {
            addReference({
              label: reference,
              content: versesText,
              type: "bible",
            })
          }
        }
      } catch (e) {
        console.error("Failed to fetch bible reference:", e)
      }
    } else if (type === "publication") {
      try {
        const paragraphs = await jwpubReference.getReferencedContent(reference)
        if (paragraphs && paragraphs.length > 0) {
          const content = paragraphs.map((p) => p.html).join("")
          addReference({
            label: reference,
            content: content,
            type: "publication",
          })
        }
      } catch (e) {
        console.error("Failed to fetch publication reference:", e)
      }
    }
  }

  const noteSuggestion = useMemo(() => ({
    items: ({ query }: { query: string }) => {
      return notes
        .filter(n => n.title.toLowerCase().includes(query.toLowerCase()))
        .map(n => ({ id: n.id, label: n.title, type: 'note' }))
        .slice(0, 10)
    },
    render: createSuggestionRender()
  }), [notes])

  const tagSuggestion = useMemo(() => ({
    items: ({ query }: { query: string }) => {
      return tags
        .filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
        .map(t => ({ id: t.id, label: `#${t.title}`, type: 'tag' }))
        .slice(0, 10)
    },
    render: createSuggestionRender()
  }), [tags])

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
      handleClick: (view, pos) => {
        const { state } = view
        
        // Find marks at this position
        const $pos = state.doc.resolve(pos)
        const marks = $pos.marks()
        
        const noteLinkMark = marks.find(m => m.type.name === 'noteLink')
        if (noteLinkMark) {
          const { id } = noteLinkMark.attrs
          const foundNote = notes.find(n => n.id === id)
          
          if (foundNote && foundNote.content) {
            // Define exactly the same extensions as used in the editor
            const extensions = [
              StarterKit,
              HorizontalRule,
              TextAlign.configure({ types: ["heading", "paragraph"] }),
              TaskList,
              TaskItem,
              Highlight,
              Image,
              Typography,
              Superscript,
              Subscript,
              Selection,
              NoteLinkExtension,
              HashtagExtension,
            ]
            
            try {
              const html = generateHTML(foundNote.content as JSONContent, extensions)
              addReference({
                label: foundNote.title,
                content: html,
                type: "note",
                noteId: id,
              })
            } catch (error) {
              console.error("Error generating HTML for note preview:", error)
              // Fallback to direct navigation if preview fails
              router.push(`/hub/notes/${id}`)
            }
          } else {
            router.push(`/hub/notes/${id}`)
          }
          return true
        }

        const hashtagMark = marks.find(m => m.type.name === 'hashtag')
        if (hashtagMark) {
          const { id } = hashtagMark.attrs
          router.push(`/hub/items?tagIds=${id}`)
          return true
        }

        return false
      }
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: (file) => handleImageUpload(file, userId),
        onError: (error) => toast.error(`Falha no upload: ${error}`),
      }),
      ReferenceExtension.configure({
        onReferenceClick: handleReferenceClick,
        suggestion: publicationSuggestion,
      }),
      SearchHighlight.configure({
        searchTerm: highlightTerm || "",
      }),
      NoteLinkExtension.configure({
        suggestion: noteSuggestion,
      }),
      HashtagExtension.configure({
        suggestion: tagSuggestion,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      scanReferences(editor)
      onChange?.({
        json: editor.getJSON(),
        text: editor.getText(),
      })
    },
    onCreate: ({ editor }) => {
      scanReferences(editor)
    }
  }, [userId])

  // Handle highlighting update and scrolling
  useEffect(() => {
    if (!editor || editor.isDestroyed) return

    if (highlightTerm) {
      // @ts-expect-error - Tiptap setOptions signature can vary or not be perfectly typed in all versions
      editor.setOptions('searchHighlight', { searchTerm: highlightTerm })
      
      // Small timeout to allow decorations to render
      const timer = setTimeout(() => {
        const firstHighlight = document.querySelector(".search-highlight")
        if (firstHighlight) {
          firstHighlight.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 500)
      return () => clearTimeout(timer)
    } else {
      // @ts-expect-error - Tiptap setOptions signature can vary or not be perfectly typed in all versions
      editor.setOptions('searchHighlight', { searchTerm: '' })
    }
  }, [editor, highlightTerm])

  const rect = useCursorVisibility({
    editor,
    overlayRef: toolbarRef,
  })

  if (!isMobile && mobileView !== "main") {
    setMobileView("main")
  }

  return (
    <div className="simple-editor-wrapper">
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                bottom: `calc(100% - ${height - rect.y}px)`,
              }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              title={localTitle}
              onTitleChange={(v) => {
                setLocalTitle(v)
                onTitleChange?.(v)
              }}
              onBack={() => router.push("/hub/items")}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
