"use client";

import { useState } from "react";
import { Check, Download, LayoutGrid, ListFilter, Pencil, Search, Trash2, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Input, Segmented } from "antd";

import { useCanvasStore, type CanvasProject } from "../stores/use-canvas-store";
import { useCanvasUiStore } from "../stores/use-canvas-ui-store";
import { exportCanvasProjects } from "../utils/canvas-export";

function getProjectPreviewImages(project: CanvasProject): string[] {
    const images: string[] = [];
    for (const node of project.nodes) {
        if (node.type === "image") {
            const url = node.metadata?.imageUrl || node.metadata?.content;
            if (url && typeof url === "string" && !images.includes(url)) {
                images.push(url);
                if (images.length >= 3) break;
            }
        }
    }
    return images;
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

    const editing = editingId === project.id;
    const selected = selectedIds.includes(project.id);
    const previewImages = getProjectPreviewImages(project);

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
                        {previewImages[0] ? (
                            <img src={previewImages[0]} alt="" className="size-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                            <div className="size-full bg-[radial-gradient(circle_at_1px_1px,rgba(37,99,235,.15)_1px,transparent_0)] bg-[size:10px_10px]" />
                        )}
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
                {previewImages.length > 0 ? (
                    <div className="grid h-36 grid-cols-3 gap-1 p-2">
                        {previewImages.map((url, i) => (
                            <img key={i} src={url} alt="" className="h-full w-full object-cover rounded-md border border-border/30" />
                        ))}
                    </div>
                ) : (
                    <div className="size-full bg-[radial-gradient(circle_at_2px_2px,rgba(37,99,235,.12)_1px,transparent_0)] bg-[size:14px_14px]" />
                )}
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
