"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

import { localForageStorage } from "@/lib/localforage-storage";
import { DEFAULT_PROMPT_SOURCE } from "@/services/api/prompts";

type PromptStore = {
    sourceUrl: string;
    favorites: string[];
    setSourceUrl: (sourceUrl: string) => void;
    toggleFavorite: (key: string) => void;
};

const storage: PersistStorage<PromptStore> = {
    getItem: async (name) => {
        const value = await localForageStorage.getItem(name);
        return value ? JSON.parse(value) as StorageValue<PromptStore> : null;
    },
    setItem: (name, value) => localForageStorage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => localForageStorage.removeItem(name),
};

export const usePromptStore = create<PromptStore>()(
    persist(
        (set) => ({
            sourceUrl: DEFAULT_PROMPT_SOURCE,
            favorites: [],
            setSourceUrl: (sourceUrl) => set({ sourceUrl: sourceUrl.trim() || DEFAULT_PROMPT_SOURCE }),
            toggleFavorite: (key) => set((state) => ({ favorites: state.favorites.includes(key) ? state.favorites.filter((item) => item !== key) : [...state.favorites, key] })),
        }),
        { name: "infinite-canvas:prompt_store", storage },
    ),
);

export function promptFavoriteKey(sourceUrl: string, promptId: string) {
    return `${sourceUrl}::${promptId}`;
}
