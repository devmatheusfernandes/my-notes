'use client'

import { useEditor, EditorContent, type Content } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface TiptapProps {
    content: Content
    onChange?: (data: { json: Content; text: string }) => void
}

const Tiptap = ({ content, onChange }: TiptapProps) => {
    const editor = useEditor({
        extensions: [StarterKit],
        content: content,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-screen min-w-screen pt-4 pb-20',
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.({
                json: editor.getJSON(),
                text: editor.getText(),
            })
        },
    })

    return (
        <EditorContent editor={editor} />
    )
}

export default Tiptap