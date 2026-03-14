'use client'
import { useNoteId } from "@/utils/searchParams"

export default function NotePage(){
    const noteId = useNoteId();
    return (
        <div>
            <h1>Note Page ID:{noteId}</h1>
        </div>
    )
}