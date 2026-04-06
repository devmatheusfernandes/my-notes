import 'dotenv/config';
import { adminDb } from '@/lib/firebase/firebase-admin';
import * as admin from "firebase-admin";
import crypto from "crypto"
import { fileURLToPath } from "url"
import { crawlCategory } from '@/lib/video/video-crawler';
import { formatVttToText } from '@/lib/video/video-utils';
import { VIDEOS_COLLECTION } from '@/lib/firebase/collections-name';
import { ROOT_CATEGORY } from '@/lib/video/categories';
import { tokenize } from '@/lib/video/tokenize';

function hash(text: string) {
    return crypto.createHash("sha1").update(text).digest("hex")
}

export async function importAllVideos() {
    console.log("🔍 Iniciando rastreamento de vídeos...");
    const videos = await crawlCategory(ROOT_CATEGORY)
    console.log(`📽 Encontrados ${videos.length} vídeos. Verificando novos itens...`);

    let importedCount = 0;

    for (const video of videos) {
        const docRef = adminDb.collection(VIDEOS_COLLECTION).doc(video.id);
        const snap = await docRef.get();

        if (snap.exists) continue

        try {
            const res = await fetch(video.subtitlesUrl!)
            if (!res.ok) throw new Error(`Status ${res.status}`);

            const vtt = await res.text()
            const contentText = formatVttToText(vtt)

            const cleanVideo = Object.fromEntries(
                Object.entries(video).filter(([v]) => v !== undefined)
            );

            await docRef.set({
                ...cleanVideo,
                contentText,
                tokens: tokenize(contentText),
                subtitlesHash: hash(contentText),
                tokenVersion: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            })

            console.log("✔ importado:", video.title)
            importedCount++;
        } catch (err) {
            console.error(`❌ Erro ao importar "${video.title}":`, err instanceof Error ? err.message : err);
        }
    }

    console.log(`✅ Importação finalizada. ${importedCount} novos vídeos adicionados.`);
    // npx tsx --env-file=.env.local scripts/importAllVideos.ts
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    importAllVideos().catch(console.error);
}
