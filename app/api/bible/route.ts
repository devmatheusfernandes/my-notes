import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import { BIBLE_BOOKS_PT } from "@/data/constants/bible-books-pt";
import { PT_TO_NWT } from "@/data/constants/bible-books";

export const runtime = "nodejs";

const dbInstances: Record<string, Database.Database|null> = {};

function getBibleDb(version: string) {
    const versionUpper = version.toUpperCase();
    if (dbInstances[versionUpper]) return dbInstances[versionUpper];

    const dbPath = path.join(process.cwd(), "data", "bibles", `${versionUpper}.sqlite`);
    if (!fs.existsSync(dbPath)) return null;

    try {
        const db = new Database(dbPath, { readonly: true });
        dbInstances[versionUpper] = db;
        return db;
    } catch (e) {
        console.error(`Failed to open DB for version ${versionUpper}:`, e);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const version = url.searchParams.get("v") || "NWT";
        const bookName = url.searchParams.get("b");
        const chapter = url.searchParams.get("c");

        if (!bookName || !chapter) {
            return NextResponse.json({ error: "Parâmetros 'b' (book) e 'c' (chapter) são obrigatórios" }, { status: 400 });
        }

        const db = getBibleDb(version);
        if (!db) {
            return NextResponse.json({ error: `Tradução '${version}' não encontrada` }, { status: 404 });
        }

        const isNWT = version.toUpperCase() === "NWT";

        if (isNWT) {
            const normalizedBook = PT_TO_NWT[bookName] || bookName;
            const verses = db.prepare(`
                SELECT verse, text 
                FROM verses 
                WHERE book = ? AND chapter = ? 
                ORDER BY verse ASC
            `).all(normalizedBook, parseInt(chapter, 10)) as { verse: number, text: string }[];

            return NextResponse.json({
                version,
                book: bookName,
                chapter: parseInt(chapter, 10),
                verses
            });
        }

        // Find book ID for other versions
        let bookRow = db.prepare("SELECT id FROM book WHERE name = ? COLLATE NOCASE").get(bookName) as { id: number } | undefined;
        
        if (!bookRow) {
            // Try to find by index if name doesn't match directly
            const index = (BIBLE_BOOKS_PT as readonly string[]).indexOf(bookName as string);
            if (index === -1) {
                return NextResponse.json({ error: "Livro não encontrado" }, { status: 404 });
            }
            const retryRow = db.prepare("SELECT id FROM book WHERE name = ? COLLATE NOCASE").get(BIBLE_BOOKS_PT[index]) as { id: number } | undefined;
            if (!retryRow) return NextResponse.json({ error: "Livro não encontrado no banco de dados" }, { status: 404 });
            bookRow = retryRow;
        }

        const verses = db.prepare(`
            SELECT verse, text 
            FROM verse 
            WHERE book_id = ? AND chapter = ? 
            ORDER BY verse ASC
        `).all(bookRow.id, parseInt(chapter, 10)) as { verse: number, text: string }[];

        return NextResponse.json({
            version,
            book: bookName,
            chapter: parseInt(chapter, 10),
            verses
        });

    } catch (e) {
        console.error("Erro na API Bible:", e);
        return NextResponse.json({ error: "Falha ao buscar versos da Bíblia" }, { status: 500 });
    }
}
