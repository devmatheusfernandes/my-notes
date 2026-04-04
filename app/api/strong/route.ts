import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import type { StrongResult } from "@/schemas/strong";

interface GreekRow {
    id: string;
    lemma: string;
    transliteration: string;
    pronunciation: string;
    definition: string;
    kjv_def: string;
    derivation: string;
}

interface HebrewRow {
    id: string;
    lemma: string;
    transliteration: string;
    pronunciation: string;
    exegesis: string;
    translation: string;
}

export const runtime = "nodejs";

let dbInstance: Database.Database | null = null;

function getDb() {
    if (dbInstance) return dbInstance;
    if (process.env.NODE_ENV === "development") {
        const globalWithDb = (globalThis as unknown) as { __strongDb?: Database.Database };
        if (!globalWithDb.__strongDb) {
            const dbPath = path.join(process.cwd(), 'data', 'strongs', 'strongs.db');
            if (!fs.existsSync(dbPath)) return null;
            globalWithDb.__strongDb = new Database(dbPath, { readonly: true });
        }
        dbInstance = globalWithDb.__strongDb;
    } else {
        const dbPath = path.join(process.cwd(), "data", "strongs", "strongs.db");
        if (!fs.existsSync(dbPath)) return null;
        dbInstance = new Database(dbPath, { readonly: true });
    }

    return dbInstance;
}

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const q = url.searchParams.get("q");

        if (!q || q.trim().length === 0) {
            return NextResponse.json({ error: "Parâmetro 'q' é obrigatório" }, { status: 400 });
        }

        const db = getDb();
        if (!db) {
            return NextResponse.json({ error: "Banco de dados Strongs não encontrado" }, { status: 500 });
        }

        const query = q.trim();
        const results: StrongResult[] = [];

        const strongMatch = query.match(/^([GH])(\d+)$/i);

        if (strongMatch) {
            const type = strongMatch[1].toUpperCase();
            const num = parseInt(strongMatch[2], 10);

            if (type === 'G') {
                const idStr = num.toString().padStart(5, '0');
                const row = db.prepare("SELECT * FROM greek WHERE id = ?").get(idStr) as GreekRow | undefined;
                if (row) {
                    results.push({
                        id: `G${parseInt(row.id, 10)}`,
                        originalId: row.id,
                        lemma: row.lemma,
                        transliteration: row.transliteration,
                        pronunciation: row.pronunciation,
                        definition: row.definition,
                        usage: row.kjv_def,
                        derivation: row.derivation,
                        type: 'greek'
                    });
                }
            } else {
                const idStr = num.toString();
                const row = db.prepare("SELECT * FROM hebrew WHERE id = ?").get(idStr) as HebrewRow | undefined;
                if (row) {
                    results.push({
                        id: `H${row.id}`,
                        originalId: row.id,
                        lemma: row.lemma,
                        transliteration: row.transliteration,
                        pronunciation: row.pronunciation,
                        definition: row.exegesis,
                        usage: row.translation,
                        type: 'hebrew'
                    });
                }
            }
        } else {
            // Busca geral
            const greekRows = db.prepare(`
        SELECT * FROM greek 
        WHERE lemma LIKE ? OR transliteration LIKE ? OR definition LIKE ? 
        LIMIT 20
      `).all(`%${query}%`, `%${query}%`, `%${query}%`) as GreekRow[];

            for (const row of greekRows) {
                results.push({
                    id: `G${parseInt(row.id, 10)}`,
                    originalId: row.id,
                    lemma: row.lemma,
                    transliteration: row.transliteration,
                    pronunciation: row.pronunciation,
                    definition: row.definition,
                    usage: row.kjv_def,
                    derivation: row.derivation,
                    type: 'greek'
                });
            }

            const hebrewRows = db.prepare(`
        SELECT * FROM hebrew 
        WHERE lemma LIKE ? OR transliteration LIKE ? OR exegesis LIKE ? 
        LIMIT 20
      `).all(`%${query}%`, `%${query}%`, `%${query}%`) as HebrewRow[];

            for (const row of hebrewRows) {
                results.push({
                    id: `H${row.id}`,
                    originalId: row.id,
                    lemma: row.lemma,
                    transliteration: row.transliteration,
                    pronunciation: row.pronunciation,
                    definition: row.exegesis,
                    usage: row.translation,
                    type: 'hebrew'
                });
            }
        }

        return NextResponse.json({ results });

    } catch (e) {
        console.error("Erro na API Strongs:", e);
        return NextResponse.json({ error: "Falha ao buscar no dicionário Strongs" }, { status: 500 });
    }
}
