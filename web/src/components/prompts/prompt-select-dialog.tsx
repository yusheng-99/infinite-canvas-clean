"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { App, Empty, Input, Modal, Pagination, Select, Spin, Tag } from "antd";

import { PromptCard } from "./prompt-card";
import { PromptDetailDialog } from "./prompt-detail-dialog";
import { usePromptLibrary } from "./use-prompt-library";
import { cn } from "@/lib/utils";
import { useCopyText } from "@/hooks/use-copy-text";
import { PROMPT_SOURCES, type LibraryPrompt } from "@/services/api/prompts";
import { promptFavoriteKey, usePromptStore } from "@/stores/use-prompt-store";

const pageSize = 18;

export function PromptSelectDialog({ open, onOpenChange, onSelect }: { open: boolean; onOpenChange: (open: boolean) => void; onSelect: (prompt: string) => void }) {
    const { message } = App.useApp();
    const copyText = useCopyText();
    const favorites = usePromptStore((state) => state.favorites);
    const setSourceUrl = usePromptStore((state) => state.setSourceUrl);
    const toggleFavorite = usePromptStore((state) => state.toggleFavorite);
    const { sourceUrl, query, data, prompts } = usePromptLibrary(open);
    const [keyword, setKeyword] = useState("");
    const [section, setSection] = useState("all");
    const [tags, setTags] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<LibraryPrompt | null>(null);
    const [revealed, setRevealed] = useState<Set<string>>(new Set());

    useEffect(() => { if (query.isError) message.error(query.error instanceof Error ? query.error.message : "提示词数据读取失败"); }, [message, query.error, query.isError]);
    useEffect(() => { setPage(1); }, [keyword, section, tags, sourceUrl]);
    const filtered = useMemo(() => {
        const search = keyword.trim().toLowerCase();
        return prompts.filter((prompt) => (section === "all" || prompt.sectionId === section) && (!tags.length || tags.every((tag) => prompt.tags?.includes(tag))) && (!search || [prompt.title, prompt.content, prompt.contributor, ...(prompt.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(search)));
    }, [keyword, prompts, section, tags]);
    const availableTags = useMemo(() => Array.from(new Set(prompts.filter((prompt) => section === "all" || prompt.sectionId === section).flatMap((prompt) => prompt.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN")), [prompts, section]);
    const isFavorite = (prompt: LibraryPrompt | null) => Boolean(prompt && favorites.includes(promptFavoriteKey(sourceUrl, prompt.id)));
    const favorite = (prompt: LibraryPrompt) => toggleFavorite(promptFavoriteKey(sourceUrl, prompt.id));
    const reveal = (prompt: LibraryPrompt) => setRevealed((value) => new Set(value).add(prompt.id));
    const usePrompt = (value: string) => { onSelect(value); setSelected(null); onOpenChange(false); message.success("已应用提示词"); };

    return (
        <>
            <Modal title="提示词广场" open={open} onCancel={() => onOpenChange(false)} footer={null} width={1180} centered styles={{ body: { paddingTop: 12 } }}>
                <div data-canvas-no-zoom onWheelCapture={(event) => event.stopPropagation()}>
                    <div className="grid gap-3 md:grid-cols-[220px_minmax(280px,1fr)_220px]">
                        <Select value={sourceUrl} options={PROMPT_SOURCES.map((item) => ({ ...item }))} onChange={setSourceUrl} />
                        <Input prefix={<Search className="size-4 text-muted-foreground" />} allowClear value={keyword} placeholder="搜索标题、内容、标签或投稿者" onChange={(event) => setKeyword(event.target.value)} />
                        <Select value={section} options={[{ label: "全部分类", value: "all" }, ...(data?.sections || []).map((item) => ({ label: item.title, value: item.id }))]} onChange={setSection} />
                    </div>
                    {availableTags.length ? <div className="mt-3 flex max-h-20 flex-wrap gap-1.5 overflow-y-auto"><Tag.CheckableTag checked={!tags.length} className={cn("filter-tag", !tags.length && "is-active")} onChange={() => setTags([])}>全部标签</Tag.CheckableTag>{availableTags.map((tag) => <Tag.CheckableTag key={tag} checked={tags.includes(tag)} className={cn("filter-tag", tags.includes(tag) && "is-active")} onChange={() => setTags((value) => value.includes(tag) ? value.filter((item) => item !== tag) : [...value, tag])}>{tag}</Tag.CheckableTag>)}</div> : null}
                    <div className="thin-scrollbar mt-4 max-h-[58vh] overflow-y-auto pr-1">
                        {query.isLoading ? <div className="grid h-48 place-items-center"><Spin /></div> : null}
                        {!query.isLoading && filtered.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.slice((page - 1) * pageSize, page * pageSize).map((prompt) => <PromptCard key={prompt.id} prompt={prompt} favorite={isFavorite(prompt)} revealed={revealed.has(prompt.id)} onOpen={() => setSelected(prompt)} onFavorite={() => favorite(prompt)} onReveal={() => reveal(prompt)} onContributor={() => setKeyword(prompt.contributor || "匿名贡献者")} />)}</div> : null}
                        {!query.isLoading && !filtered.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有找到匹配的提示词" className="py-12" /> : null}
                    </div>
                    {filtered.length > pageSize ? <div className="mt-4 flex justify-center"><Pagination current={page} pageSize={pageSize} total={filtered.length} showSizeChanger={false} onChange={setPage} /></div> : null}
                </div>
            </Modal>
            <PromptDetailDialog prompt={selected} favorite={isFavorite(selected)} revealed={Boolean(selected && revealed.has(selected.id))} onClose={() => setSelected(null)} onFavorite={() => selected && favorite(selected)} onReveal={() => selected && reveal(selected)} onCopy={(value) => copyText(value, "提示词已复制")} onUse={usePrompt} onContributor={(name) => { setKeyword(name); setSelected(null); }} />
        </>
    );
}
