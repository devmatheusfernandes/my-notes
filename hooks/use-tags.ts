import { useCallback, useMemo } from "react";
import useSWR, { useSWRConfig } from "swr";
import { tagService } from "@/services/tagService";
import { CreateTagDTO, Tag } from "@/schemas/tagSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useTagStore } from "@/store/tagStore";
import { Note } from "@/schemas/noteSchema";

export function useTags(userId?: string) {
    const { mutate } = useSWRConfig();
    const cacheKey = useMemo(() => (userId ? ["tags", userId] : null), [userId]);

    const { data: tags = [], error: swrError, isLoading: swrLoading } = useSWR<Tag[]>(
        cacheKey,
        () => tagService.getTagsByUser(userId!)
    );

    const { error: storeError, isLoading: storeLoading, setError, setLoading } = useTagStore();

    const isLoading = swrLoading || storeLoading;
    const error = swrError ? getErrorMessage(swrError) : storeError;

    const fetchTags = useCallback(async () => {
        if (!cacheKey) return;
        await mutate(cacheKey);
    }, [cacheKey, mutate]);

    const createTag = useCallback(
        async (tagUserId: string, data: CreateTagDTO) => {
            if (!cacheKey) return;
            setLoading(true);
            setError(null);

            const optimisticTag: Tag = {
                title: data.title,
                color: data.color,
                id: "temp-" + Date.now(),
                userId: tagUserId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            try {
                await mutate(
                    cacheKey,
                    async () => {
                        const newTag = await tagService.createTag(tagUserId, data);
                        return [newTag, ...tags];
                    },
                    {
                        optimisticData: [optimisticTag, ...tags],
                        rollbackOnError: true,
                        populateCache: true,
                        revalidate: false,
                    }
                );
            } catch (error) {
                const secureMessage = getErrorMessage(error);
                setError(secureMessage);
                throw new Error(secureMessage);
            } finally {
                setLoading(false);
            }
        },
        [cacheKey, mutate, tags, setError, setLoading]
    );

    const editTag = useCallback(
        async (tagUserId: string, tagId: string, data: { title: string; color?: string }) => {
            if (!cacheKey) return;
            setLoading(true);
            setError(null);

            try {
                await mutate(
                    cacheKey,
                    async () => {
                        const updatedTag = await tagService.updateTag(tagUserId, tagId, data);
                        return tags.map((t) => (t.id === tagId ? updatedTag : t));
                    },
                    {
                        optimisticData: tags.map((t) => (t.id === tagId ? { ...t, ...data } : t)),
                        rollbackOnError: true,
                        populateCache: true,
                        revalidate: false,
                    }
                );
            } catch (error) {
                const secureMessage = getErrorMessage(error);
                setError(secureMessage);
                throw new Error(secureMessage);
            } finally {
                setLoading(false);
            }
        },
        [cacheKey, mutate, tags, setError, setLoading]
    );

    const deleteTag = useCallback(
        async (tagId: string) => {
            if (!cacheKey) return;
            setLoading(true);
            setError(null);

            try {
                await mutate(
                    cacheKey,
                    async () => {
                        await tagService.deleteTag(tagId);
                        return tags.filter((t) => t.id !== tagId);
                    },
                    {
                        optimisticData: tags.filter((t) => t.id !== tagId),
                        rollbackOnError: true,
                        populateCache: true,
                        revalidate: false,
                    }
                );
            } catch (error) {
                const secureMessage = getErrorMessage(error);
                setError(secureMessage);
                throw new Error(secureMessage);
            } finally {
                setLoading(false);
            }
        },
        [cacheKey, mutate, tags, setError, setLoading]
    );

    const applyTagToNote = useCallback(
        async (noteId: string, tagId: string) => {
            const notesCacheKey = userId ? ["notes", userId] : null;
            setLoading(true);
            setError(null);

            try {
                await tagService.applyTagToNote(noteId, tagId);
                if (notesCacheKey) {
                    mutate(
                        notesCacheKey,
                        (currentNotes: Note[] | undefined) => {
                            return currentNotes?.map((n) =>
                                n.id === noteId ? { ...n, tagIds: [...(n.tagIds || []), tagId] } : n
                            );
                        },
                        false
                    );
                }
            } catch (error) {
                setError(getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        },
        [mutate, userId, setError, setLoading]
    );

    const removeTagFromNote = useCallback(
        async (noteId: string, tagId: string) => {
            const notesCacheKey = userId ? ["notes", userId] : null;
            setLoading(true);
            setError(null);

            try {
                await tagService.removeTagFromNote(noteId, tagId);
                if (notesCacheKey) {
                    mutate(
                        notesCacheKey,
                        (currentNotes: Note[] | undefined) => {
                            return currentNotes?.map((n) =>
                                n.id === noteId ? { ...n, tagIds: n.tagIds?.filter((id) => id !== tagId) || [] } : n
                            );
                        },
                        false
                    );
                }
            } catch (error) {
                setError(getErrorMessage(error));
            } finally {
                setLoading(false);
            }
        },
        [mutate, userId, setError, setLoading]
    );

    return {
        tags,
        isLoading,
        error,
        fetchTags,
        createTag,
        editTag,
        deleteTag,
        applyTagToNote,
        removeTagFromNote,
    };
}
