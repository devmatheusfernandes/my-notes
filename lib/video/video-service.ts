import { db } from "@/lib/firebase/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    setDoc,
    deleteField,
    query,
    limit,
    orderBy
} from "firebase/firestore";
import { VideoData } from "@/schemas/videos";
import { selectBestVideoUrl } from "./video-utils";
import { USERS_COLLECTION, VIDEOS_COLLECTION } from "../firebase/collections-name";
import { findVideoInCache } from "./video-crawler";

export const videoService = {
    // Subscribe to local state (imported notes, etc.)
    subscribeUserVideos(userId: string, onData: (items: VideoData[]) => void) {
        const ref = collection(db, USERS_COLLECTION, userId, "all_videos")
        return onSnapshot(ref, (snap) => {
            const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoData, "id">) })) as VideoData[]
            onData(items)
        })
    },

    async setVideoNoteLink(userId: string, id: string, noteId: string) {
        const ref = doc(db, USERS_COLLECTION, userId, "all_videos", id)
        const now = new Date().toISOString()
        await setDoc(ref, { importedAsNote: true, noteId, updatedAt: now }, { merge: true })
    },

    async clearVideoNoteLink(userId: string, id: string) {
        const ref = doc(db, USERS_COLLECTION, userId, "all_videos", id)
        const now = new Date().toISOString()
        await setDoc(ref, { importedAsNote: false, noteId: deleteField(), updatedAt: now }, { merge: true })
    },

    async saveVideoContent(userId: string, video: VideoData, contentText: string) {
        const ref = doc(db, USERS_COLLECTION, userId, "all_videos", video.id)
        const now = new Date().toISOString()
        const payload = {
            ...video,
            contentText,
            updatedAt: now
        }
        await setDoc(ref, payload, { merge: true })
    },

    async getVideoById(id: string): Promise<VideoData | null> {
        console.log(`[videoService] Fetching video for ID: ${id}`);

        // 0. Try Cache first (most reliable for recently listed videos)
        const cached = findVideoInCache(id);
        if (cached) {
            console.log(`[videoService] Found video in crawler cache`);
            return cached;
        }

        // 1. Try Firestore first
        const ref = doc(db, VIDEOS_COLLECTION, id)
        const snap = await getDoc(ref)
        if (snap.exists()) {
            console.log(`[videoService] Found video in Firestore`);
            return { id: snap.id, ...snap.data() } as VideoData
        }

        // 2. Fallback to API
        console.log(`[videoService] Falling back to API...`);
        const isPub = id.startsWith("pub-")
        const prefixes = isPub ? ["PT", "T"] : ["T", "PT"]

        for (const prefix of prefixes) {
            try {
                const url = `https://b.jw-cdn.org/apis/mediator/v1/media-items/${prefix}/${id}?clientType=www`
                console.log(`[videoService] Trying URL: ${url}`);
                const res = await fetch(url)
                if (!res.ok) {
                    console.warn(`[videoService] Failed with prefix ${prefix} (status: ${res.status})`);
                    continue
                }

                const data = await res.json()
                const video = data?.media?.[0]

                if (!video) {
                    console.warn(`[videoService] No media found in response for prefix ${prefix}`);
                    continue
                }

                console.log(`[videoService] Successfully found video via API (${prefix})`);
                let subtitlesUrl: string | undefined
                for (const f of video.files || []) {
                    if (f?.subtitles?.url) {
                        subtitlesUrl = f.subtitles.url
                        break
                    }
                }

                const title: string = video.title || ""
                const primaryCategory = video.primaryCategory || "VideoOnDemand"
                const durationFormatted = video.durationFormattedMinSec || ""
                const coverImage: string | undefined = video.images?.wss?.lg || video.images?.pnr?.lg || video.images?.sqr?.lg || undefined
                const videoUrl = selectBestVideoUrl(video.files || [])

                return {
                    id: video.naturalKey,
                    title,
                    categoryKey: video.primaryCategory || "VideoOnDemand",
                    primaryCategory,
                    durationFormatted,
                    coverImage,
                    subtitlesUrl,
                    videoUrl
                }
            } catch (err) {
                console.warn(`Failed to fetch video with prefix ${prefix}:`, err)
            }
        }

        return null
    },

    async getUserVideoState(userId: string, videoId: string): Promise<Partial<VideoData> | null> {
        const ref = doc(db, USERS_COLLECTION, userId, "all_videos", videoId)
        const snap = await getDoc(ref)
        if (snap.exists()) {
            return snap.data() as Partial<VideoData>
        }
        return null
    },

    async getLastUpdated(): Promise<Date | null> {
        const q = query(
            collection(db, VIDEOS_COLLECTION),
            orderBy("updatedAt", "desc"),
            limit(1)
        )
        const snap = await getDocs(q)
        if (snap.empty) return null
        const data = snap.docs[0].data()

        const val = data.updatedAt;
        if (!val) return null;
        if (typeof val.toDate === "function") return val.toDate();
        return new Date(val);
    }
}
