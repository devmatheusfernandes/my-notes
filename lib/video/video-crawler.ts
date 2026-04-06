import { CATEGORY_NAMES, ROOT_CATEGORY } from "@/lib/video/categories";
import { CategoryGroup, VideoData } from "@/schemas/videos";
import { extractBook, selectBestVideoUrl } from "./video-utils";

let cachedVideos: VideoData[] = [];

export function findVideoInCache(id: string): VideoData | undefined {
    return cachedVideos.find(v => v.id === id);
}

interface VideoApiItem {
    naturalKey: string;
    title?: string;
    primaryCategory?: string;
    durationFormattedMinSec?: string;
    images?: {
        wss?: { lg?: string };
        pnr?: { lg?: string };
        sqr?: { lg?: string };
    };
    files?: {
        subtitles?: { url?: string };
        mimetype?: string;
        frameHeight?: number;
        bitRate?: number;
        progressiveDownloadURL?: string;
    }[];
}

interface ApiResponse {
    category?: {
        key: string;
        name?: string;
        media?: VideoApiItem[];
        subcategories?: { key: string }[];
    };
}

async function fetchCategory(key: string): Promise<ApiResponse> {
    const url = `https://b.jw-cdn.org/apis/mediator/v1/categories/T/${key}?detailed=1&mediaLimit=0&clientType=www`
    const res = await fetch(url)
    return res.json()
}

export async function crawlCategory(key: string, rootKey?: string, visited = new Set<string>()): Promise<VideoData[]> {
    if (visited.has(key)) return []
    visited.add(key)

    const currentIsMain = !!CATEGORY_NAMES[key] && key !== ROOT_CATEGORY;
    const activeRoot = currentIsMain ? key : rootKey;

    try {
        const data = await fetchCategory(key)
        const category = data?.category
        if (!category) return []

        const mediaList = Array.isArray(category.media) ? category.media : []
        const validVideos: VideoData[] = []

        for (const video of mediaList) {
            let subtitlesUrl: string | undefined
            for (const f of video.files || []) {
                if (f?.subtitles?.url) {
                    subtitlesUrl = f.subtitles.url
                    break
                }
            }

            if (!subtitlesUrl) continue

            const id: string = video.naturalKey
            const title: string = video.title || ""
            const primaryCategory = video.primaryCategory || key
            const durationFormatted = video.durationFormattedMinSec || ""
            const coverImage: string | undefined = video.images?.wss?.lg || video.images?.pnr?.lg || video.images?.sqr?.lg || undefined
            const videoUrl = selectBestVideoUrl(video.files || [])

            validVideos.push({
                id,
                title,
                categoryKey: key,
                rootCategoryKey: activeRoot,
                primaryCategory,
                durationFormatted,
                coverImage,
                subtitlesUrl,
                videoUrl,
                book: extractBook(title)
            })
        }

        const subResults: VideoData[][] = []
        const subcategories = Array.isArray(category.subcategories) ? category.subcategories : []

        if (subcategories.length > 0) {
            subResults.push(...await Promise.all(
                subcategories.map((sub) => crawlCategory(sub.key, activeRoot, visited))
            ))
        }

        return [...validVideos, ...subResults.flat()]

    } catch (err) {
        console.error(`Error crawling category ${key}:`, err)
        return []
    }
}

export async function getAllVideosGrouped(): Promise<CategoryGroup[]> {
    const allVideos = await crawlCategory(ROOT_CATEGORY)
    cachedVideos = allVideos;

    const groupMap = new Map<string, VideoData[]>()

    for (const v of allVideos) {
        const rKey = v.rootCategoryKey || "Other"
        if (!groupMap.has(rKey)) groupMap.set(rKey, [])
        groupMap.get(rKey)!.push(v)
    }

    const groups: CategoryGroup[] = []
    groupMap.forEach((videos, key) => {
        if (key === "Other") return

        groups.push({
            key,
            title: CATEGORY_NAMES[key] || key,
            videos
        })
    })

    const order = Object.keys(CATEGORY_NAMES)
    return groups.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
}

export async function getAllVideos(): Promise<VideoData[]> {
    const groups = await getAllVideosGrouped()
    return groups.flatMap(g => g.videos)
}
