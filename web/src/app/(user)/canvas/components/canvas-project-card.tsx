"use client";

import { useEffect, useState } from "react";
import { Check, Download, Pencil, Trash2, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input } from "antd";

import { resolveMediaUrl } from "@/services/file-storage";
import { resolveImageUrl } from "@/services/image-storage";

import { useCanvasStore, type CanvasProject } from "../stores/use-canvas-store";
import { useCanvasUiStore } from "../stores/use-canvas-ui-store";
import { exportCanvasProjects } from "../utils/canvas-export";

function collectMediaSources(obj: unknown, sources: Array<{ storageKey?: string; url?: string }> = [], visited = new Set<unknown>()) {
    if (!obj || typeof obj !== "object" || visited.has(obj)) return sources;
    visited.add(obj);

    if (Array.isArray(obj)) {
        for (const item of obj) {
            collectMediaSources(item, sources, visited);
        }
        return sources;
    }

    const record = obj as Record<string, unknown>;

    const storageKey =
        typeof record.storageKey === "string" && record.storageKey.includes(":")
            ? record.storageKey
            : typeof record.imageStorageKey === "string" && record.imageStorageKey.includes(":")
            ? record.imageStorageKey
            : undefined;

    const urlCandidates = [record.imageUrl, record.content, record.coverUrl, record.dataUrl, record.url, record.src];
    let foundUrl: string | undefined;
    for (const cand of urlCandidates) {
        if (typeof cand === "string" && cand.trim()) {
            foundUrl = cand.trim();
            break;
        }
    }

    if (storageKey || foundUrl) {
        sources.push({ storageKey, url: foundUrl });
    }

    for (const key of Object.keys(record)) {
        if (key === "viewport" || key === "connections") continue;
        const val = record[key];
        if (val && typeof val === "object") {
            collectMediaSources(val, sources, visited);
        }
    }

    return sources;
}

async function resolveProjectPreviewImages(project: CanvasProject): Promise<string[]> {
    const rawSources = collectMediaSources(project.nodes);
    const resolvedUrls: string[] = [];

    for (const source of rawSources) {
        if (resolvedUrls.length >= 8) break;

        let url = "";
        if (source.storageKey) {
            if (source.storageKey.startsWith("image:")) {
                url = await resolveImageUrl(source.storageKey, source.url || "");
            } else {
                url = await resolveMediaUrl(source.storageKey, source.url || "");
            }
        } else if (source.url) {
            url = source.url;
        }

        if (url && typeof url === "string" && !resolvedUrls.includes(url)) {
            resolvedUrls.push(url);
        }
    }

    return resolvedUrls;
}

function PreviewGrid({ urls }: { urls: string[] }) {
    const [validUrls, setValidUrls] = useState<string[]>(urls);

    useEffect(() => {
        setValidUrls(urls);
    }, [urls]);

    const handleImageError = (failedUrl: string) => {
        setValidUrls((prev) => prev.filter((u) => u !== failedUrl));
    };

    const displayUrls = validUrls.slice(0, 3);
    const count = displayUrls.length;

    if (count === 0) {
        return <div className="size-full bg-[radial-gradient(circle_at_2px_2px,rgba(37,99,235,.12)_1px,transparent_0)] bg-[size:14px_14px]" />;
    }

    const gridColsClass = count === 1 ? "grid-cols-1" : count === 2 ? "grid-cols-2" : "grid-cols-3";

    return (
        <div className={`grid h-36 gap-1 p-2 ${gridColsClass}`}>
            {displayUrls.map((url, i) => (
                <img
                    key={url + i}
                    src={url}
                    alt=""
                    className="h-full w-full object-cover rounded-md border border-border/30"
                    onError={() => handleImageError(url)}
                />
            ))}
        </div>
    );
}

function ListAvatarImage({ urls }: { urls: string[] }) {
    const [index, setIndex] = useState(0);
    const [failed, setFailed] = useState(false);

    const currentUrl = urls[index];

    if (failed || !currentUrl) {
        return <div className="size-full bg-[radial-gradient(circle_at_1px_1px,rgba(37,99,235,.15)_1px,transparent_0)] bg-[size:10px_10px]" />;
    }

    return (
        <img
            src={currentUrl}
            alt=""
            className="size-full object-cover transition-transform group-hover:scale-105"
            onError={() => {
                if (index + 1 < urls.length) {
                    setIndex(index + 1);
                } else {
                    setFailed(true);
                }
            }}
        />
    );
}

export function CanvasProjectCard({
    project,
    viewMode = "grid",
}: {
    project: CanvasProject;
    viewMode?: "grid" | "list";
}) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const renameProject = useCanvasStore((state) => state.renameProject);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const editingId = useCanvasUiStore((state) => state.editingProjectId);
    const editingTitle = useCanvasUiStore((state) => state.editingProjectTitle);
    const startEditing = useCanvasUiStore((state) => state.startEditingProject);
    const setEditingTitle = useCanvasUiStore((state) => state.setEditingProjectTitle);
    const stopEditing = useCanvasUiStore((state) => state.stopEditingProject);
    const toggleSelected = useCanvasUiStore((state) => state.toggleSelectedProjectId);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);

    const [previewImages, setPreviewImages] = useState<string[]>([]);

    useEffect(() => {
        let active = true;
        resolveProjectPreviewImages(project).then((urls) => {
            if (active) setPreviewImages(urls);
        });
        return () => {
            active = false;
        };
    }, [project]);

    const editing = editingId === project.id;
    const selected = selectedIds.includes(project.id);

    const open = () => navigate(`/canvas/${project.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`);
    const saveTitle = () => {
        renameProject(project.id, editingTitle);
        stopEditing();
    };

    if (viewMode === "list") {
        return (
            <article
                className="group relative flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md"
                onClick={() => !editing && open()}
            >
                <div className="flex min-w-0 items-center gap-4">
                    <input
                        type="checkbox"
                        checked={selected}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => toggleSelected(project.id, event.target.checked)}
                        className="size-4 accent-primary"
                        aria-label={`选择 ${project.title}`}
                    />
                    <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/60 border border-border/50">
                        <ListAvatarImage urls={previewImages} />
                    </div>

                    <div className="min-w-0 flex-1">
                        {editing ? (
                            <Input
                                size="small"
                                className="max-w-xs"
                                value={editingTitle}
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) => setEditingTitle(event.target.value)}
                                onKeyDown={(event) => !event.nativeEvent.isComposing && event.key === "Enter" && saveTitle()}
                                autoFocus
                            />
                        ) : (
                            <h2 className="truncate text-base font-semibold tracking-tight group-hover:text-primary transition-colors">{project.title}</h2>
                        )}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {project.nodes.length} 个节点 · {project.connections.length} 条连线 · 更新于 {new Date(project.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(event) => event.stopPropagation()}>
                    {editing ? (
                        <>
                            <Button type="text" size="small" shape="circle" icon={<Check className="size-4 text-emerald-600" />} onClick={saveTitle} aria-label="保存" />
                            <Button type="text" size="small" shape="circle" icon={<X className="size-4" />} onClick={stopEditing} aria-label="取消" />
                        </>
                    ) : (
                        <>
                            <Button type="text" size="small" shape="circle" icon={<Download className="size-4" />} onClick={() => void exportCanvasProjects([project], project.title || "无限画布")} aria-label="导出" />
                            <Button type="text" size="small" shape="circle" icon={<Pencil className="size-4" />} onClick={() => startEditing(project.id, project.title)} aria-label="重命名" />
                            <Button type="text" size="small" shape="circle" icon={<Trash2 className="size-4 text-destructive/80" />} onClick={() => setDeleteIds([project.id])} aria-label="删除" />
                        </>
                    )}
                </div>
            </article>
        );
    }

    return (
        <article
            className="group relative flex min-h-[220px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
            onClick={() => !editing && open()}
        >
            {/* Background preview grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20 transition-opacity duration-300 group-hover:opacity-30">
                <PreviewGrid urls={previewImages} />
            </div>

            <div className="relative z-10 flex items-start justify-between gap-3">
                <input
                    type="checkbox"
                    checked={selected}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => toggleSelected(project.id, event.target.checked)}
                    className="mt-1 size-4 accent-primary"
                    aria-label={`选择 ${project.title}`}
                />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(event) => event.stopPropagation()}>
                    {editing ? (
                        <>
                            <Button type="text" size="small" shape="circle" icon={<Check className="size-4 text-emerald-600" />} onClick={saveTitle} aria-label="保存" />
                            <Button type="text" size="small" shape="circle" icon={<X className="size-4" />} onClick={stopEditing} aria-label="取消" />
                        </>
                    ) : (
                        <>
                            <Button type="text" size="small" shape="circle" icon={<Download className="size-4" />} onClick={() => void exportCanvasProjects([project], project.title || "无限画布")} aria-label="导出" />
                            <Button type="text" size="small" shape="circle" icon={<Pencil className="size-4" />} onClick={() => startEditing(project.id, project.title)} aria-label="重命名" />
                            <Button type="text" size="small" shape="circle" icon={<Trash2 className="size-4 text-destructive/80" />} onClick={() => setDeleteIds([project.id])} aria-label="删除" />
                        </>
                    )}
                </div>
            </div>

            <div className="relative z-10 mt-10">
                {editing ? (
                    <Input
                        value={editingTitle}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        onKeyDown={(event) => !event.nativeEvent.isComposing && event.key === "Enter" && saveTitle()}
                        autoFocus
                    />
                ) : (
                    <button
                        type="button"
                        className="min-w-0 cursor-pointer text-left w-full group/btn"
                        onClick={(event) => {
                            event.stopPropagation();
                            open();
                        }}
                    >
                        <h2 className="truncate text-xl font-semibold tracking-tight group-hover/btn:text-primary transition-colors">{project.title}</h2>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {project.nodes.length} 个节点 · {project.connections.length} 条连线
                        </p>
                    </button>
                )}
            </div>

            <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <span>更新于 {new Date(project.updatedAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
            </div>
        </article>
    );
}