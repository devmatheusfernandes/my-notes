import { useCallback } from "react";
import { useTagStore } from "@/store/tagStore";
import { tagService } from "@/services/tagService";
import { CreateTagDTO } from "@/schemas/tagSchema";
import { getErrorMessage } from "@/utils/getErrorMessage";

export function useTags() {
    const { tags, isLoading, error, setTags, addTag, updateTag, removeTag, setLoading, setError } = useTagStore();

    const fetchTags = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const tags = await tagService.getTagsByUser(userId);
            setTags(tags);
        } catch (error) {
            setError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [setTags, setError, setLoading]);

    const createTag = useCallback(async (userId: string, data: CreateTagDTO) => {
        setLoading(true);
        setError(null);
        try {
            const newTag = await tagService.createTag(userId, data);
            addTag(newTag);
            return newTag;
        } catch (error) {
            const secureMessage = getErrorMessage(error);
            setError(secureMessage);
            throw new Error(secureMessage);
        } finally {
            setLoading(false);
        }
    }, [addTag, setError, setLoading]);

    const editTag = useCallback(async (
        userId: string,
        tagId: string,
        data: { title: string; color?: string },
    ) => {
        setLoading(true);
        setError(null);
        try {
            const updatedTag = await tagService.updateTag(userId, tagId, data);
            updateTag(updatedTag);
            return updatedTag;
        } catch (error) {
            const secureMessage = getErrorMessage(error);
            setError(secureMessage);
            throw new Error(secureMessage);
        } finally {
            setLoading(false);
        }
    }, [setError, setLoading, updateTag]);

    const deleteTag = useCallback(async (tagId: string) => {
        setLoading(true);
        setError(null);
        try {
            await tagService.deleteTag(tagId);
            removeTag(tagId);
        } catch (error) {
            const secureMessage = getErrorMessage(error);
            setError(secureMessage);
            throw new Error(secureMessage);
        } finally {
            setLoading(false);
        }
    }, [removeTag, setError, setLoading]);

    const applyTagToNote = useCallback(async (noteId: string, tagId: string) => {
        setLoading(true);
        setError(null);
        try {
            await tagService.applyTagToNote(noteId, tagId);
        } catch (error) {
            const secureMessage = getErrorMessage(error);
            setError(secureMessage);
            throw new Error(secureMessage);
        } finally {
            setLoading(false);
        }
    }, [setError, setLoading]);

    const removeTagFromNote = useCallback(async (noteId: string, tagId: string) => {
        setLoading(true);
        setError(null);
        try {
            await tagService.removeTagFromNote(noteId, tagId);
        } catch (error) {
            const secureMessage = getErrorMessage(error);
            setError(secureMessage);
            throw new Error(secureMessage);
        } finally {
            setLoading(false);
        }
    }, [setError, setLoading]);

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
