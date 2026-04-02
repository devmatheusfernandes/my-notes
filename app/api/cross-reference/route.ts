import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { CrossReferenceRow, TargetReference } from "@/data/scheme/cross-reference";
import { BIBLE_BOOKS_PT } from "@/data/constants/bible-books-pt";

export const runtime = "nodejs";

const BOOK_MAP: Record<string, string> = {
    "Cânticos": "Cântico de Salomão",
    "Cantares": "Cântico de Salomão",
    "Revelação": "Apocalipse",
    "Atos dos Apóstolos": "Atos",
    "Salmo": "Salmos",
    "Filêmon": "Filemom"
};

function getBookId(bookName: string): number | null {
    const normalized = BOOK_MAP[bookName] || bookName;
    const index = (BIBLE_BOOKS_PT as readonly string[]).indexOf(normalized);
    if (index === -1) return null;
    return index;
}

function getBookName(id: number): string {
    return BIBLE_BOOKS_PT[id] || "";
}

function parseVerseId(id: number) {
    const b = Math.floor(id / 1000000);
    const c = Math.floor((id % 1000000) / 1000);
    const v = id % 1000;
    return { bookId: b, chapter: c, verse: v };
}

let refDbInstance: Database.Database | null = null;

function getRefDb() {
    if (refDbInstance) return refDbInstance;

    if (process.env.NODE_ENV === "development") {
        const globalWithDb = globalThis as typeof globalThis & { __refDb?: Database.Database };
        if (!globalWithDb.__refDb) {
            const dbPath = path.join(process.cwd(), 'data', 'cross-references', 'cross_references.sqlite');
            if (!fs.existsSync(dbPath)) return null;
            globalWithDb.__refDb = new Database(dbPath, { readonly: true });
        }
        refDbInstance = globalWithDb.__refDb;
    } else {
        const dbPath = path.join(process.cwd(), 'data', 'cross-references', 'cross_references.sqlite');
        if (!fs.existsSync(dbPath)) return null;
        refDbInstance = new Database(dbPath, { readonly: true });
    }

    return refDbInstance;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const book = url.searchParams.get("book");
        const chapter = url.searchParams.get("chapter");

        if (!book || !chapter) {
            return NextResponse.json({ error: "Book and Chapter are required" }, { status: 400 });
        }

        const bookId = getBookId(book);
        if (bookId === null) {
            return NextResponse.json({ error: "Book not found" }, { status: 404 });
        }

        const chapterNum = Number(chapter);
        const startVid = bookId * 1000000 + chapterNum * 1000;
        const endVid = startVid + 999;

        const refDb = getRefDb();
        if (!refDb) {
            return NextResponse.json({ error: "Reference DB not found" }, { status: 500 });
        }

        const refs = refDb.prepare(`
      SELECT vid, sv, ev 
      FROM cross_reference 
      WHERE vid >= ? AND vid <= ? 
      ORDER BY vid, r
    `).all(startVid, endVid) as CrossReferenceRow[];

        const grouped: Record<number, TargetReference[]> = {};

        for (const r of refs) {
            const src = parseVerseId(r.vid);
            if (!grouped[src.verse]) {
                grouped[src.verse] = [];
            }

            const target = parseVerseId(r.sv);

            grouped[src.verse].push({
                book: getBookName(target.bookId),
                chapter: target.chapter,
                verse: target.verse,
                vid: r.sv
            });
        }

        return NextResponse.json({ references: grouped });

    } catch (e) {
        console.error("Erro na API de referências:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}