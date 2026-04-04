import { BIBLE_BOOKS_PT } from "@/lib/bible/bible-books-pt";

export function extractBook(title: string): string | undefined {
    const lower = title.toLowerCase()
    for (const b of BIBLE_BOOKS_PT) {
        if (lower.includes(b.toLowerCase())) return b
    }
    return undefined
}

export function formatVttToText(vtt: string): string {
    const lines = vtt.split("\n")
    const paragraphs: string[] = []
    let buffer = ""
    for (const raw of lines) {
        let line = raw.trim()
        if (!line) continue
        if (line.startsWith("WEBVTT")) continue
        if (line.includes("-->")) continue
        if (/^[0-9]+$/.test(line)) continue
        line = line.replace(/<[^>]+>/g, "").trim()
        if (buffer.length > 0) {
            buffer += " " + line
        } else {
            buffer = line
        }
        if (/[.!?…]$/.test(line)) {
            paragraphs.push(buffer.trim())
            buffer = ""
        }
    }
    if (buffer) paragraphs.push(buffer.trim())
    return paragraphs.join("\n\n")
}

interface VideoFile {
    mimetype?: string;
    frameHeight?: number;
    bitRate?: number;
    progressiveDownloadURL?: string;
}

export function selectBestVideoUrl(files: VideoFile[] = []): string | undefined {
    const mp4s = files.filter((f) => String(f?.mimetype || "").includes("mp4"))
    if (mp4s.length === 0) return undefined
    mp4s.sort((a, b) => {
        const ah = Number(a?.frameHeight || 0)
        const bh = Number(b?.frameHeight || 0)
        const ar = Number(a?.bitRate || 0)
        const br = Number(b?.bitRate || 0)
        if (bh !== ah) return bh - ah
        return br - ar
    })
    return mp4s[mp4s.length - 1]?.progressiveDownloadURL
}
