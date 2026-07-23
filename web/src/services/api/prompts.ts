import localforage from "localforage";

export type PromptVariant = { content: string; contributor?: string; notes?: string; images?: string[] };
export type PromptItem = {
    id: string;
    title: string;
    content: string;
    createdAt?: number;
    tags?: string[];
    contributor?: string;
    notes?: string;
    images?: string[];
    refs?: string[];
    similar?: PromptVariant[];
};
export type PromptSection = { id: string; title: string; isRestricted?: boolean; prompts: PromptItem[] };
export type PromptData = { sections: PromptSection[]; commonTags?: string[]; siteNotes?: string; lastUpdated?: string };
export type LibraryPrompt = PromptItem & { sectionId: string; sectionTitle: string; isRestricted?: boolean };

export const DEFAULT_PROMPT_SOURCE = "https://raw.githubusercontent.com/unknowlei/nanobanana-website/refs/heads/main/public/data.json";
export const PROMPT_MANAGER_SOURCE = "/api/prompt-manager";
export const PROMPT_SOURCES = [
    { label: "nanobanana-website", value: DEFAULT_PROMPT_SOURCE },
    { label: "Prompt-Manager", value: PROMPT_MANAGER_SOURCE },
] as const;

const cache = localforage.createInstance({ name: "infinite-canvas", storeName: "prompt_cache" });
const cacheTtlMs = 60 * 60 * 1000;

export async function fetchPromptData(sourceUrl: string, signal?: AbortSignal) {
    const key = `source:${sourceUrl}`;
    const cached = await cache.getItem<{ data: PromptData; fetchedAt: number }>(key);
    if (cached?.data?.sections?.length && Date.now() - cached.fetchedAt < cacheTtlMs) return cached.data;
    try {
        const response = await fetch(sourceUrl, { signal, cache: "no-store" });
        if (!response.ok) throw new Error(`提示词数据读取失败（${response.status}）`);
        const data = normalizePromptData(await response.json());
        await cache.setItem(key, { data, fetchedAt: Date.now() });
        return data;
    } catch (error) {
        if (cached?.data?.sections?.length) return cached.data;
        throw error;
    }
}

export async function clearPromptCache(sourceUrl: string) {
    await cache.removeItem(`source:${sourceUrl}`);
}

export function flattenPrompts(data?: PromptData | null): LibraryPrompt[] {
    return (data?.sections || []).flatMap((section) => section.prompts.map((prompt) => ({ ...prompt, sectionId: section.id, sectionTitle: section.title, isRestricted: section.isRestricted })));
}

export function promptTimestamp(prompt: Pick<PromptItem, "id" | "createdAt" | "images">) {
    const timestamps = (prompt.images || []).map(parseTimestamp).filter((value): value is number => Boolean(value));
    if (timestamps.length) return Math.max(...timestamps);
    if (typeof prompt.createdAt === "number" && Number.isFinite(prompt.createdAt)) return prompt.createdAt < 1e12 ? prompt.createdAt * 1000 : prompt.createdAt;
    return parseTimestamp(prompt.id) || 0;
}

export function isNewPrompt(prompt: Pick<PromptItem, "id" | "createdAt" | "images">) {
    const time = promptTimestamp(prompt);
    return time > 0 && Date.now() - time >= 0 && Date.now() - time <= 48 * 60 * 60 * 1000;
}

export function formatPromptTime(prompt: Pick<PromptItem, "id" | "createdAt" | "images">) {
    const time = promptTimestamp(prompt);
    return time ? new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(time) : "";
}

export function isRestrictedPrompt(prompt: LibraryPrompt) {
    const text = [prompt.sectionTitle, ...(prompt.tags || [])].join(" ");
    return Boolean(prompt.isRestricted || /猎奇|恐怖/i.test(text));
}

function normalizePromptData(payload: unknown): PromptData {
    if (payload && typeof payload === "object" && Array.isArray((payload as PromptData).sections)) return payload as PromptData;
    const records = payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data) ? (payload as { data: Record<string, unknown>[] }).data : [];
    if (!records.length) throw new Error("提示词数据格式不受支持");
    return { sections: [{ id: "prompt-manager", title: "Prompt-Manager", prompts: records.map(normalizePromptManagerItem) }] };
}

function normalizePromptManagerItem(item: Record<string, unknown>, index: number): PromptItem {
    const createdAt = normalizeTimestamp(typeof item.created_at === "string" ? item.created_at : "");
    const image = stringValue(item.file_path) || stringValue(item.thumbnail_path);
    return {
        id: createdAt ? `imported-${createdAt}-${stringValue(item.id) || index}` : `pm-${stringValue(item.id) || index}`,
        title: stringValue(item.title) || `未命名-${index + 1}`,
        content: stringValue(item.prompt),
        createdAt: createdAt || undefined,
        tags: stringArray(item.tags),
        contributor: stringValue(item.author) || undefined,
        notes: sanitizeNotes(stringValue(item.description)) || undefined,
        images: image ? [image] : undefined,
        refs: normalizeRefs(item.refs),
    };
}

function normalizeRefs(value: unknown) {
    if (!Array.isArray(value)) return undefined;
    const refs = value.map((item) => {
        if (!item || typeof item !== "object") return null;
        const record = item as Record<string, unknown>;
        const url = stringValue(record.file_path);
        if (!url || record.is_placeholder === true || url.includes("{{")) return null;
        return { url, position: typeof record.position === "number" ? record.position : Number.MAX_SAFE_INTEGER };
    }).filter((item): item is { url: string; position: number } => Boolean(item)).sort((a, b) => a.position - b.position).map((item) => item.url);
    return refs.length ? refs : undefined;
}

function normalizeTimestamp(value: string) {
    if (!value) return 0;
    const normalized = value.replace(/\.(\d{3})\d+/, ".$1");
    const time = Date.parse(/Z|[+-]\d{2}:\d{2}$/.test(normalized) ? normalized : `${normalized}Z`);
    return Number.isNaN(time) ? 0 : time;
}

function parseTimestamp(value: string) {
    const raw = /(?:^|[\s/_\-=])(\d{13}|\d{10})(?=[\s/_\-.?&]|$)/.exec(value)?.[1];
    if (!raw) return 0;
    const time = Number(raw);
    return raw.length === 10 ? time * 1000 : time;
}

function stringValue(value: unknown) {
    return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function stringArray(value: unknown) {
    const items = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim()) : [];
    return items.length ? items : undefined;
}

function sanitizeNotes(value: string) {
    return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).filter((line) => !/labnana|aff=|邀请链接|分享给你试试|通过我的邀请链接/i.test(line)).join("\n");
}
