"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { clearPromptCache, fetchPromptData, flattenPrompts } from "@/services/api/prompts";
import { usePromptStore } from "@/stores/use-prompt-store";

export function usePromptLibrary(enabled = true) {
    const sourceUrl = usePromptStore((state) => state.sourceUrl);
    const query = useQuery({ queryKey: ["prompt-library", sourceUrl], queryFn: ({ signal }) => fetchPromptData(sourceUrl, signal), enabled: enabled && Boolean(sourceUrl) });
    return {
        sourceUrl,
        query,
        data: query.data,
        prompts: useMemo(() => flattenPrompts(query.data), [query.data]),
        refresh: async () => {
            await clearPromptCache(sourceUrl);
            await query.refetch();
        },
    };
}
