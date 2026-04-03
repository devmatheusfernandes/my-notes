"use client"

import { useRef, useState } from "react"
import { EditorContent, EditorContext, useEditor, type Content, Editor } from "@tiptap/react"
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
import { publicationSuggestion } from "@/components/tiptap-extension/publication-suggestion"
import { useReaderStore, type ReferenceInstance } from "@/store/readerStore"
import { parseBibleReference } from "@/lib/bible-utils"
import { jwpubReference } from "@/lib/jwpub-reference"
import throttle from "lodash.throttle"
import { useMemo } from "react"

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
import { PanelRightOpen, PanelRightClose } from "lucide-react"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

interface SimpleEditorProps {
  content: Content
  userId: string
  onChange?: (data: { json: Content; text: string }) => void
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  isSidebarOpen,
  onToggleSidebar,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}) => {
  return (
    <>
      <Spacer />

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

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
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
    </>
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

export function SimpleEditor({ content, userId, onChange }: SimpleEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const { addReference, setDocReferences, isSidebarOpen, setIsSidebarOpen } = useReaderStore()

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
