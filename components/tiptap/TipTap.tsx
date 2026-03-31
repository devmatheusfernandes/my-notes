'use client'

import { useEditor, EditorContent, type Content } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface TiptapProps {
    content: Content
    onChange?: (content: Content) => void
}

const Tiptap = ({ content, onChange }: TiptapProps) => {
    const editor = useEditor({
        extensions: [StarterKit],
        content: content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-screen min-w-screen',
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getJSON())
        },
    })

    return (
        <EditorContent editor={editor} />
    )
}

export default Tiptap