import { useState, useEffect } from "react";
import { VideoData } from "@/schemas/videos";
import { JwpubMetadata } from "@/schemas/jwpubSchema";
import { parseSearchQuery, checkMatch, SearchTerm, splitIntoParagraphs, splitIntoSentences } from "@/lib/search/search-utils";
import { db } from "@/lib/firebase/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { tokenize } from "@/lib/video/tokenize";
import { useJwpub } from "./use-jwpub";
import { useDebounce } from "./use-debounce";

export type SearchScope = "title" | "text" | "paragraph" | "sentence";

export interface PublicationSearchMatch {
    text: string;
    chapterIndex: number;
}

export interface UnifiedSearchResults {
    videos: VideoData[];
    publications: (JwpubMetadata & { matches: PublicationSearchMatch[] })[];
    isSearching: boolean;
}

export function useUnifiedSearch(queryText: string, scope: SearchScope = "text") {
    const [videos, setVideos] = useState<VideoData[]>([]);
    const [publicationsResults, setPublicationsResults] = useState<(JwpubMetadata & { matches: PublicationSearchMatch[] })[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { publications: allPubsMetadata, getPublication } = useJwpub();

    const debouncedQuery = useDebounce(queryText, 300);

    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery.trim()) {
                setVideos([]);
                setPublicationsResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            const parsedTerms = parseSearchQuery(debouncedQuery);

            if (parsedTerms.length === 0) {
                setVideos([]);
                setPublicationsResults([]);
                setIsSearching(false);
                return;
            }

            try {
                // 1. Search Videos
                const videoCandidates = await searchVideoCandidates(parsedTerms);
                const filteredVideos = videoCandidates.filter(video => {
                    const content = video.contentText || "";
                    const title = video.title || "";

                    if (scope === "title") {
                        return parsedTerms.every(t => checkMatch(title, t));
                    }

                    const fullText = `${title} ${content}`;
                    if (scope === "text") {
                        return parsedTerms.every(t => checkMatch(fullText, t));
                    }

                    if (scope === "paragraph") {
                        const paragraphs = splitIntoParagraphs(content);
                        return paragraphs.some(para => parsedTerms.every(t => checkMatch(para, t))) ||
                            parsedTerms.every(t => checkMatch(title, t));
                    }

                    if (scope === "sentence") {
                        const sentences = splitIntoSentences(content);
                        return sentences.some(sent => parsedTerms.every(t => checkMatch(sent, t))) ||
                            parsedTerms.every(t => checkMatch(title, t));
                    }
                    return true;
                });
                setVideos(filteredVideos);

                // 2. Search Publications
                if (allPubsMetadata) {
                    const pubResults: (JwpubMetadata & { matches: PublicationSearchMatch[] })[] = [];
                    let totalMatches = 0;
                    const GLOBAL_MATCH_LIMIT = 500;

                    for (const meta of allPubsMetadata) {
                        if (totalMatches >= GLOBAL_MATCH_LIMIT) break;

                        const matches: PublicationSearchMatch[] = [];

                        // 2.1 Fast Title Match
                        const titleMatch = parsedTerms.every(t => checkMatch(`${meta.title} ${meta.symbol}`, t));

                        if (titleMatch && scope === "title") {
                            pubResults.push({ ...meta, matches: [] });
                            continue;
                        }

                        // 2.2 Token-based early exit (Optimization)
                        if (meta.tokens && meta.tokens.length > 0) {
                            const tokenMatch = parsedTerms.every(t =>
                                meta.tokens?.some(token => token.includes(t.term))
                            );
                            if (!tokenMatch && !titleMatch) continue;
                        }

                        // 2.3 Deep Content Search (Only if needed)
                        if (scope !== "title") {
                            const fullPub = await getPublication(meta.symbol);
                            if (!fullPub) continue;

                            let foundInContent = false;

                            // Search in chapters/paragraphs
                            searchLoop: for (let cIdx = 0; cIdx < fullPub.chapters.length; cIdx++) {
                                const chapter = fullPub.chapters[cIdx];
                                for (const para of chapter.paragraphs) {
                                    if (parsedTerms.every(t => checkMatch(para.content, t))) {
                                        foundInContent = true;
                                        matches.push({
                                            text: para.content,
                                            chapterIndex: cIdx
                                        });
                                        totalMatches++;

                                        if (totalMatches >= GLOBAL_MATCH_LIMIT) {
                                            break searchLoop;
                                        }
                                    }
                                }
                            }

                            if (titleMatch || foundInContent) {
                                pubResults.push({ ...meta, matches });
                            }
                        } else if (titleMatch) {
                            pubResults.push({ ...meta, matches: [] });
                        }
                    }
                    setPublicationsResults(pubResults);
                }

            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsSearching(false);
            }
        };

        performSearch();
    }, [debouncedQuery, scope, allPubsMetadata, getPublication]);

    return { videos, publications: publicationsResults, isSearching };
}

async function searchVideoCandidates(terms: SearchTerm[]): Promise<VideoData[]> {
    const tokens = terms.flatMap(t => tokenize(t.original));
    if (tokens.length === 0) return [];

    const videosRef = collection(db, "videos");
    const tokensToQuery = tokens.slice(0, 5); // Limit queries

    const promises = tokensToQuery.map(token => {
        const q = query(
            videosRef,
            where("tokens", "array-contains", token),
            limit(100)
        );
        return getDocs(q);
    });

    const snapshots = await Promise.all(promises);
    const videoMap = new Map<string, VideoData>();

    snapshots.forEach(snap => {
        snap.docs.forEach(doc => {
            if (!videoMap.has(doc.id)) {
                videoMap.set(doc.id, { id: doc.id, ...doc.data() } as VideoData);
            }
        });
    });

    return Array.from(videoMap.values());
}
