import { BIBLE_BOOKS_PT } from "@/lib/bible/bible-books-pt";

export interface TranscriptSegment {
    startTime: number;
    startTimeFormatted: string;
    text: string;
}

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

export function formatSecondsToTimestamp(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function parseVttToSegments(vtt: string): TranscriptSegment[] {
    const lines = vtt.split(/\r?\n/);
    const segments: TranscriptSegment[] = [];
    let currentStartTime: number | null = null;
    let currentBuffer = "";

    const timestampRegex = /(\d{2}:\d{2}:\d{2}.\d{3}) --> (\d{2}:\d{2}:\d{2}.\d{3})/;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line === "WEBVTT") continue;

        const tsMatch = line.match(timestampRegex);
        if (tsMatch) {
            const startStr = tsMatch[1];
            const parts = startStr.split(":");
            const h = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10);
            const s = parseFloat(parts[2]);
            const seconds = h * 3600 + m * 60 + s;

            if (currentStartTime === null) {
                currentStartTime = seconds;
            }
            continue;
        }

        if (/^\d+$/.test(line)) continue;

        // It's text
        const cleanText = line.replace(/<[^>]+>/g, "").trim();
        if (!cleanText) continue;

        if (currentBuffer) {
            currentBuffer += " " + cleanText;
        } else {
            currentBuffer = cleanText;
        }

        // If it ends a sentence, push the segment
        if (/[.!?…]$/.test(cleanText)) {
            if (currentStartTime !== null) {
                segments.push({
                    startTime: currentStartTime,
                    startTimeFormatted: formatSecondsToTimestamp(currentStartTime),
                    text: currentBuffer.trim()
                });
                currentStartTime = null;
                currentBuffer = "";
            }
        }
    }

    // Push remaining buffer
    if (currentBuffer && currentStartTime !== null) {
        segments.push({
            startTime: currentStartTime,
            startTimeFormatted: formatSecondsToTimestamp(currentStartTime),
            text: currentBuffer.trim()
        });
    }

    return segments;
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
