"use client";

import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";
import { nanoid } from "nanoid";

import { localForageStorage } from "@/lib/localforage-storage";
import { resolveImageUrl, uploadImage } from "@/services/image-storage";

export type GalleryItem = {
    id: string;
    title: string;
    url: string;
    storageKey?: string;
    width: number;
    height: number;
    bytes: number;
    mimeType: string;
    source?: string;
    note?: string;
    createdAt: string;
};

export type GalleryImageInput = {
    title?: string;
    url: string;
    storageKey?: string;
    width?: number;
    height?: number;
    bytes?: number;
    mimeType?: string;
    source?: string;
    note?: string;
};

type GalleryStore = {
    hydrated: boolean;
    items: GalleryItem[];
    addItem: (input: GalleryImageInput) => Promise<string>;
    removeItem: (id: string) => void;
    updateItem: (id: string, patch: Partial<Pick<GalleryItem, "title" | "note">>) => void;
};

const GALLERY_STORE_KEY = "infinite-canvas:gallery_store";

const galleryStorage: PersistStorage<GalleryStore> = {
    getItem: async (name) => {
        const value = await localForageStorage.getItem(name);
        if (!value) return null;
        const parsed = JSON.parse(value) as StorageValue<GalleryStore>;
        parsed.state.items = await Promise.all(
            (parsed.state.items || []).map(async (item) => {
                if (!item.storageKey) return item;
                return { ...item, url: await resolveImageUrl(item.storageKey, item.url) };
            }),
        );
        return parsed;
    },
    setItem: (name, value) => localForageStorage.setItem(name, JSON.stringify(value)),
    removeItem: (name) => localForageStorage.removeItem(name),
};

export const useGalleryStore = create<GalleryStore>()(
    persist(
        (set, get) => ({
            hydrated: false,
            items: [],
            addItem: async (input) => {
                const existing = input.storageKey ? get().items.find((item) => item.storageKey === input.storageKey) : undefined;
                if (existing) return existing.id;

                const stored = input.storageKey
                    ? {
                          url: await resolveImageUrl(input.storageKey, input.url),
                          storageKey: input.storageKey,
                          width: input.width || 0,
                          height: input.height || 0,
                          bytes: input.bytes || 0,
                          mimeType: input.mimeType || "image/png",
                      }
                    : await uploadImage(input.url);

                const id = nanoid();
                const item: GalleryItem = {
                    id,
                    title: input.title?.trim() || "画廊图片",
                    url: stored.url,
                    storageKey: stored.storageKey,
                    width: stored.width || input.width || 0,
                    height: stored.height || input.height || 0,
                    bytes: stored.bytes || input.bytes || 0,
                    mimeType: stored.mimeType || input.mimeType || "image/png",
                    source: input.source,
                    note: input.note,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({ items: [item, ...state.items] }));
                return id;
            },
            removeItem: (id) => {
                set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
                void import("@/stores/use-asset-store").then(({ useAssetStore }) => useAssetStore.getState().cleanupImages());
            },
            updateItem: (id, patch) =>
                set((state) => ({
                    items: state.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
                })),
        }),
        {
            name: GALLERY_STORE_KEY,
            storage: galleryStorage,
            partialize: (state) => ({ items: state.items }) as StorageValue<GalleryStore>["state"],
            onRehydrateStorage: () => () => {
                useGalleryStore.setState({ hydrated: true });
            },
        },
    ),
);