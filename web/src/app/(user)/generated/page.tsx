"use client";

import { App, Button, Empty, Input, Segmented } from "antd";
import localforage from "localforage";
import { Heart, Image as ImageIcon, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { CanvasNodeType } from "@/app/(user)/canvas/types";
import { useCanvasStore, type CanvasProject } from "@/app/(user)/canvas/stores/use-canvas-store";
import { ImagePreviewModal } from "@/components/image-preview-modal";
import { resolveImageUrl } from "@/services/image-storage";
import { useGalleryStore } from "@/stores/use-gallery-store";

type GeneratedSource = "workbench" | "canvas";
type GeneratedImageItem = {
    id: string;
    title: string;
    prompt: string;
    url: string;
    storageKey: string | undefined;
    width: number;
    height: number;
    bytes: number;
    mimeType: string;
    model: string;
    source: GeneratedSource;
    sourceLabel: string;
    createdAt: number;
};
type StoredImage = { id?: string; dataUrl?: string; storageKey?: string; width?: number; height?: number; bytes?: number; mimeType?: string };
type StoredGenerationLog = { id?: string; createdAt?: number; title?: string; prompt?: string; model?: string; images?: StoredImage[] };

const imageLogStore = localforage.createInstance({ name: "infinite-canvas", storeName: "image_generation_logs" });

export default function GeneratedPage() {
    const { message } = App.useApp();
    const projects = useCanvasStore((state) => state.projects);
    const canvasHydrated = useCanvasStore((state) => state.hydrated);
    const galleryItems = useGalleryStore((state) => state.items);
    const galleryHydrated = useGalleryStore((state) => state.hydrated);
    const addGalleryItem = useGalleryStore((state) => state.addItem);
    const [items, setItems] = useState<GeneratedImageItem[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [source, setSource] = useState<"all" | GeneratedSource>("all");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    useEffect(() => {
        if (!canvasHydrated) return;
        let cancelled = false;
        setLoaded(false);
        void readGeneratedImages(projects).then((next) => {
            if (cancelled) return;
            setItems(next);
            setLoaded(true);
        });
        return () => {
            cancelled = true;
        };
    }, [canvasHydrated, projects]);

    const filtered = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        return items.filter((item) => (source === "all" || item.source === source) && (!q || `${item.title} ${item.prompt} ${item.model} ${item.sourceLabel}`.toLowerCase().includes(q)));
    }, [items, keyword, source]);
    const galleryKeys = useMemo(() => new Set(galleryItems.map((item) => item.storageKey || item.url)), [galleryItems]);
    const previewItem = previewOpen ? filtered[previewIndex] : null;
    const handlePrev = useCallback(() => setPreviewIndex((value) => (value - 1 + filtered.length) % filtered.length), [filtered.length]);
    const handleNext = useCallback(() => setPreviewIndex((value) => (value + 1) % filtered.length), [filtered.length]);

    const saveToGallery = async (item: GeneratedImageItem) => {
        if (!galleryHydrated) return message.warning("画廊数据仍在加载，请稍后再试");
        const key = item.storageKey || item.url;
        if (galleryKeys.has(key)) return message.info("这张图片已经在画廊中");
        try {
            await addGalleryItem({ title: item.title, url: item.url, storageKey: item.storageKey, width: item.width, height: item.height, bytes: item.bytes, mimeType: item.mimeType, source: item.sourceLabel, note: item.prompt });
            message.success("已加入画廊");
        } catch (error) {
            message.error(error instanceof Error ? error.message : "加入画廊失败");
        }
    };

    return (
        <main className="h-full overflow-auto bg-background text-foreground">
            <div className="mx-auto flex min-h-full max-w-[1800px] flex-col px-4 py-6 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[13px] font-medium tracking-[0.08em] text-muted-foreground">GENERATED</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">生成图库</h1>
                        <p className="mt-2 text-sm text-muted-foreground">自动汇总生图工作台和画布中的生成图片；加入画廊后才会成为收藏。</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Segmented
                            value={source}
                            options={[{ label: "全部", value: "all" }, { label: "生图工作台", value: "workbench" }, { label: "画布", value: "canvas" }]}
                            onChange={(value) => setSource(value as typeof source)}
                        />
                        <Input allowClear prefix={<Search className="size-3.5 text-muted-foreground" />} placeholder="搜索提示词或模型" value={keyword} onChange={(event) => setKeyword(event.target.value)} className="w-full sm:w-64" />
                    </div>
                </header>

                <div className="mt-3 text-xs text-muted-foreground">{loaded ? `${filtered.length} 张` : "正在读取本地生成记录..."}</div>

                {!loaded ? null : filtered.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-24">
                        <Empty image={<ImageIcon className="mx-auto size-12 text-muted-foreground/50" />} description={<span className="text-muted-foreground">{items.length ? "没有符合筛选条件的图片" : "还没有生成图片"}</span>}>
                            {!items.length ? <Link to="/image"><Button type="primary">去生图工作台</Button></Link> : null}
                        </Empty>
                    </div>
                ) : (
                    <div className="content-fade-in mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {filtered.map((item, index) => {
                            const collected = galleryKeys.has(item.storageKey || item.url);
                            return (
                                <article key={item.id} className="hover-float-card group relative overflow-hidden rounded-2xl bg-card ring-1 ring-border/40 hover:ring-border">
                                    <button type="button" className="block w-full text-left" onClick={() => { setPreviewIndex(index); setPreviewOpen(true); }}>
                                        <img src={item.url} alt={item.title} className="block aspect-[4/3] w-full object-cover" loading="lazy" decoding="async" />
                                        <span className="pointer-events-none absolute inset-x-0 top-0 truncate bg-gradient-to-b from-black/55 to-transparent px-3 pb-8 pt-3 text-xs font-medium text-white">{item.sourceLabel}</span>
                                    </button>
                                    <div className="flex h-[58px] items-center justify-between gap-3 px-3">
                                        <div className="min-w-0"><div className="truncate text-sm font-medium">{item.title}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.model || "未记录模型"} · {formatImageDate(item.createdAt)}</div></div>
                                        <button type="button" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-primary/10 hover:text-primary disabled:text-primary" disabled={!galleryHydrated || collected} onClick={() => void saveToGallery(item)} aria-label={collected ? "已在画廊" : "加入画廊"} title={!galleryHydrated ? "画廊加载中" : collected ? "已在画廊" : "加入画廊"}>
                                            <Heart className={`size-4 ${collected ? "fill-current" : ""}`} />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            <ImagePreviewModal open={Boolean(previewItem)} src={previewItem?.url} title={previewItem?.title} onClose={() => setPreviewOpen(false)} onPrev={filtered.length > 1 ? handlePrev : undefined} onNext={filtered.length > 1 ? handleNext : undefined} counter={filtered.length > 1 ? `${previewIndex + 1}/${filtered.length}` : undefined} />
        </main>
    );
}

async function readGeneratedImages(projects: CanvasProject[]) {
    const [workbench, canvas] = await Promise.all([readWorkbenchImages().catch(() => []), readCanvasImages(projects).catch(() => [])]);
    const seen = new Set<string>();
    return [...workbench, ...canvas]
        .filter((item) => {
            const key = item.storageKey || item.url;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .sort((a, b) => b.createdAt - a.createdAt);
}

async function readWorkbenchImages(): Promise<GeneratedImageItem[]> {
    const logs: StoredGenerationLog[] = [];
    await imageLogStore.iterate<StoredGenerationLog, void>((log) => {
        logs.push(log);
    });
    const items = await Promise.all(logs.flatMap((log) => (log.images || []).map(async (image, index): Promise<GeneratedImageItem | null> => {
        const url = await resolveImageUrl(image.storageKey, image.dataUrl || "");
        if (!url) return null;
        const prompt = log.prompt || log.title || "生成图片";
        return { id: `workbench:${log.id || log.createdAt || 0}:${image.id || index}`, title: prompt.slice(0, 32), prompt, url, storageKey: image.storageKey, width: image.width || 0, height: image.height || 0, bytes: image.bytes || 0, mimeType: image.mimeType || "image/png", model: log.model || "", source: "workbench" as const, sourceLabel: "生图工作台", createdAt: log.createdAt || 0 };
    })));
    return items.filter((item): item is GeneratedImageItem => Boolean(item));
}

async function readCanvasImages(projects: CanvasProject[]): Promise<GeneratedImageItem[]> {
    const items = await Promise.all(projects.flatMap((project) => project.nodes.filter((node) => node.type === CanvasNodeType.Image && node.metadata?.content && (node.metadata.generationType || node.metadata.model)).map(async (node): Promise<GeneratedImageItem | null> => {
        const url = await resolveImageUrl(node.metadata?.storageKey, node.metadata?.content || "");
        if (!url) return null;
        const prompt = node.metadata?.prompt || node.title || "画布生成图片";
        return { id: `canvas:${project.id}:${node.id}`, title: prompt.slice(0, 32), prompt, url, storageKey: node.metadata?.storageKey, width: node.metadata?.naturalWidth || node.width, height: node.metadata?.naturalHeight || node.height, bytes: node.metadata?.bytes || 0, mimeType: node.metadata?.mimeType || "image/png", model: node.metadata?.model || "", source: "canvas" as const, sourceLabel: `画布 · ${project.title}`, createdAt: Date.parse(project.updatedAt) || 0 };
    })));
    return items.filter((item): item is GeneratedImageItem => Boolean(item));
}

function formatImageDate(value: number) {
    if (!value) return "时间未知";
    return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
}
