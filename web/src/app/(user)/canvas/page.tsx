"use client";

import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { App, Button, Input, Select } from "antd";
import { Download, FileUp, LayoutGrid, List, Plus, Search, Trash2 } from "lucide-react";

import { readZip } from "@/lib/zip";
import { setMediaBlob } from "@/services/file-storage";
import { setImageBlob } from "@/services/image-storage";
import { CanvasDeleteProjectsDialog } from "./components/canvas-delete-projects-dialog";
import { CanvasProjectCard } from "./components/canvas-project-card";
import type { CanvasExportFile } from "./export-types";
import { useCanvasStore } from "./stores/use-canvas-store";
import { useCanvasUiStore } from "./stores/use-canvas-ui-store";
import { exportCanvasProjects } from "./utils/canvas-export";

type SortOption = "updated-desc" | "updated-asc" | "title-asc" | "nodes-desc";

export default function CanvasPage() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const hydrated = useCanvasStore((state) => state.hydrated);
    const projects = useCanvasStore((state) => state.projects);
    const createProject = useCanvasStore((state) => state.createProject);
    const importProject = useCanvasStore((state) => state.importProject);
    const selectedIds = useCanvasUiStore((state) => state.selectedProjectIds);
    const setDeleteIds = useCanvasUiStore((state) => state.setDeleteProjectIds);

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("updated-desc");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const enterProject = (id: string) => {
        navigate(`/canvas/${id}`);
    };
    const createAndEnter = () => enterProject(createProject(`无限画布 ${projects.length + 1}`));

    const filteredProjects = useMemo(() => {
        let result = [...projects];
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter((p) => p.title.toLowerCase().includes(query));
        }
        result.sort((a, b) => {
            if (sortBy === "updated-desc") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            if (sortBy === "updated-asc") return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
            if (sortBy === "title-asc") return a.title.localeCompare(b.title, "zh-CN");
            if (sortBy === "nodes-desc") return b.nodes.length - a.nodes.length;
            return 0;
        });
        return result;
    }, [projects, searchQuery, sortBy]);

    const importCanvas = async (file?: File) => {
        if (!file) return;
        try {
            const zip = await readZip(file);
            const projectFile = zip.get("projects.json");
            if (!projectFile) throw new Error("missing projects.json");
            const data = JSON.parse(await projectFile.text()) as CanvasExportFile;
            await Promise.all(
                data.projects.flatMap((project) =>
                    project.files.map(async (item) => {
                        const blob = zip.get(item.path);
                        if (!blob) return;
                        const typedBlob = blob.type ? blob : blob.slice(0, blob.size, item.mimeType);
                        await (item.storageKey.startsWith("image:") ? setImageBlob(item.storageKey, typedBlob) : setMediaBlob(item.storageKey, typedBlob));
                    }),
                ),
            );
            data.projects.forEach((item) => importProject(item.project));
            message.success(`已导入 ${data.projects.length} 个画布`);
        } catch {
            message.error("导入失败，请选择有效的画布压缩包");
        } finally {
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <main className="app-page">
            <div className="app-page-container flex flex-col gap-6">
                <header className="flex flex-wrap items-end justify-between gap-5 py-2">
                    <div>
                        <p className="page-eyebrow">画布项目</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">无限画布</h1>
                        <p className="mt-2 text-sm text-muted-foreground">{projects.length ? `${projects.length} 个本地项目，继续你的创作。` : "从一个空白画布开始创作。"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.length ? (
                            <>
                                <Button disabled={!hydrated} icon={<Download className="size-4" />} onClick={() => void exportCanvasProjects(projects.filter((project) => selectedIds.includes(project.id)), `无限画布-${selectedIds.length}个项目`)}>
                                    导出选中 ({selectedIds.length})
                                </Button>
                                <Button disabled={!hydrated} dangerously={true} icon={<Trash2 className="size-4" />} onClick={() => setDeleteIds(selectedIds)}>
                                    删除选中 ({selectedIds.length})
                                </Button>
                            </>
                        ) : null}
                        <Button disabled={!hydrated} icon={<FileUp className="size-4" />} onClick={() => inputRef.current?.click()}>
                            导入画布
                        </Button>
                        <Button disabled={!hydrated} type="primary" icon={<Plus className="size-4" />} onClick={createAndEnter}>
                            新建画布
                        </Button>
                    </div>
                </header>

                {projects.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3 backdrop-blur-md shadow-sm">
                        <div className="flex min-w-[240px] flex-1 items-center gap-2">
                            <Input
                                placeholder="搜索画布名称..."
                                prefix={<Search className="size-4 text-muted-foreground" />}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                allowClear
                                className="max-w-md rounded-xl"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                value={sortBy}
                                onChange={(val) => setSortBy(val)}
                                options={[
                                    { label: "最近更新", value: "updated-desc" },
                                    { label: "最早更新", value: "updated-asc" },
                                    { label: "按名称", value: "title-asc" },
                                    { label: "节点数量", value: "nodes-desc" },
                                ]}
                                className="w-32"
                            />
                            <div className="flex items-center rounded-lg border border-border/70 p-0.5 bg-background">
                                <button
                                    type="button"
                                    onClick={() => setViewMode("grid")}
                                    className={`rounded-md p-1.5 transition-colors ${viewMode === "grid" ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                    aria-label="网格视图"
                                >
                                    <LayoutGrid className="size-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode("list")}
                                    className={`rounded-md p-1.5 transition-colors ${viewMode === "list" ? "bg-muted text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                    aria-label="列表视图"
                                >
                                    <List className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}

                {!hydrated ? (
                    <section className="workspace-panel flex min-h-[360px] items-center justify-center text-sm text-muted-foreground">正在加载画布...</section>
                ) : filteredProjects.length ? (
                    <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-3"}>
                        {filteredProjects.map((project) => (
                            <CanvasProjectCard key={project.id} project={project} viewMode={viewMode} />
                        ))}
                    </div>
                ) : projects.length ? (
                    <section className="workspace-panel flex min-h-[260px] flex-col items-center justify-center text-center">
                        <p className="text-base text-muted-foreground">没有找到匹配「{searchQuery}」的画布</p>
                        <Button className="mt-4" onClick={() => setSearchQuery("")}>清空搜索</Button>
                    </section>
                ) : (
                    <section className="workspace-panel flex min-h-[420px] flex-col items-center justify-center text-center">
                        <h2 className="text-xl font-medium">还没有画布</h2>
                        <p className="mt-3 text-sm text-muted-foreground">新建一个画布后，就可以独立保存节点、连线和画布外观。</p>
                        <Button type="primary" className="mt-6" icon={<Plus className="size-4" />} onClick={createAndEnter}>
                            新建画布
                        </Button>
                    </section>
                )}
            </div>

            <input ref={inputRef} type="file" accept="application/zip,.zip" className="hidden" onChange={(event) => void importCanvas(event.target.files?.[0])} />
            <CanvasDeleteProjectsDialog />
        </main>
    );
}
