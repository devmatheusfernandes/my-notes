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

    // 1. Fetch all existing IDs in bulk to avoid thousands of individual reads
    console.log("📥 Buscando IDs de vídeos existentes no Firestore...");
    const existingIdsSnap = await adminDb.collection(VIDEOS_COLLECTION).select().get();
    const existingIds = new Set(existingIdsSnap.docs.map(doc => doc.id));
    console.log(`✅ ${existingIds.size} vídeos já estão no banco de dados.`);

    // 2. Filter only the videos that need importing
    const newVideos = videos.filter(video => !existingIds.has(video.id));
    console.log(`🆕 ${newVideos.length} novos vídeos identificados para importação.`);

    if (newVideos.length === 0) {
        console.log("✨ Tudo atualizado! Nenhum vídeo novo para importar.");
        return;
    }

    let importedCount = 0;
    const CONCURRENCY_LIMIT = 20; // 20 simultaneous imports

    // 3. Process new videos in parallel chunks
    for (let i = 0; i < newVideos.length; i += CONCURRENCY_LIMIT) {
        const batch = newVideos.slice(i, i + CONCURRENCY_LIMIT);
        
        await Promise.all(batch.map(async (video) => {
            const docRef = adminDb.collection(VIDEOS_COLLECTION).doc(video.id);

            try {
                const res = await fetch(video.subtitlesUrl!)
                if (!res.ok) throw new Error(`Status ${res.status}`);

                const vtt = await res.text()
                const contentText = formatVttToText(vtt)

                const cleanVideo = Object.fromEntries(
                    Object.entries(video).filter(([, v]) => v !== undefined)
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

                console.log(`✔ [${importedCount + 1}/${newVideos.length}] importado:`, video.title)
                importedCount++;
            } catch (err) {
                console.error(`❌ Erro ao importar "${video.title}":`, err instanceof Error ? err.message : err);
            }
        }));
    }

    console.log(`✅ Importação finalizada. ${importedCount} novos vídeos adicionados.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    importAllVideos().catch(console.error);
}
