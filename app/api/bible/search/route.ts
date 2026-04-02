import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

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
        console.error(`Failed to open DB for search version ${versionUpper}:`, e);
        return null;
    }
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const query = url.searchParams.get("q");
        const version = url.searchParams.get("v") || "NWT";

        if (!query || query.trim().length === 0) {
            return NextResponse.json({ error: "Parâmetro 'q' (search term) é obrigatório" }, { status: 400 });
        }

        const db = getBibleDb(version);
        if (!db) {
            return NextResponse.json({ error: `Tradução '${version}' não encontrada` }, { status: 404 });
        }

        const searchTerm = `%${query}%`;
        const isNWT = version.toUpperCase() === "NWT";
        
        const results = isNWT 
            ? db.prepare(`
                SELECT book, chapter, verse, text
                FROM verses
                WHERE text LIKE ?
                LIMIT 100
            `).all(searchTerm) as { book: string, chapter: number, verse: number, text: string }[]
            : db.prepare(`
                SELECT b.name as book, v.chapter, v.verse, v.text
                FROM verse v
                JOIN book b ON v.book_id = b.id
                WHERE v.text LIKE ?
                LIMIT 100
            `).all(searchTerm) as { book: string, chapter: number, verse: number, text: string }[];

        return NextResponse.json({
            q: query,
            results
        });

    } catch (e) {
        console.error("Erro na API Search Bible:", e);
        return NextResponse.json({ error: "Falha ao pesquisar na Bíblia" }, { status: 500 });
    }
}
