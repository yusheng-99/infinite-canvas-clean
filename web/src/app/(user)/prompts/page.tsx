"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Database, RefreshCw, Search, Sparkles, Star, UploadCloud, UserRound } from "lucide-react";
import { App, Button, Drawer, Empty, Input, Pagination, Select, Spin, Tag } from "antd";
import { useNavigate } from "react-router-dom";

import { PromptCard } from "@/components/prompts/prompt-card";
import { PromptDetailDialog } from "@/components/prompts/prompt-detail-dialog";
import { usePromptLibrary } from "@/components/prompts/use-prompt-library";
import { useCopyText } from "@/hooks/use-copy-text";
import { cn } from "@/lib/utils";
import { isNewPrompt, PROMPT_SOURCES, type LibraryPrompt } from "@/services/api/prompts";
import { useAssetStore } from "@/stores/use-asset-store";
import { promptFavoriteKey, usePromptStore } from "@/stores/use-prompt-store";

const pageSize = 36;
const contributorPageSize = 18;

export default function PromptsPage() {
    const { message, modal } = App.useApp();
    const navigate = useNavigate();
    const copyText = useCopyText();
    const addAsset = useAssetStore((state) => state.addAsset);
    const favorites = usePromptStore((state) => state.favorites);
    const setSourceUrl = usePromptStore((state) => state.setSourceUrl);
    const toggleFavorite = usePromptStore((state) => state.toggleFavorite);
    const { sourceUrl, query, data, prompts, refresh } = usePromptLibrary();
    const [sourceDraft, setSourceDraft] = useState(sourceUrl);
    const [customSourceOpen, setCustomSourceOpen] = useState(!PROMPT_SOURCES.some((item) => item.value === sourceUrl));
    const [scope, setScope] = useState("all");
    const [keyword, setKeyword] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [page, setPage] = useState(1);
    const [selectedPrompt, setSelectedPrompt] = useState<LibraryPrompt | null>(null);
    const [contributor, setContributor] = useState("");
    const [contributorSection, setContributorSection] = useState("all");
    const [contributorTags, setContributorTags] = useState<string[]>([]);
    const [contributorPage, setContributorPage] = useState(1);
    const [revealed, setRevealed] = useState<Set<string>>(new Set());
    useEffect(() => { setSourceDraft(sourceUrl); setCustomSourceOpen(!PROMPT_SOURCES.some((item) => item.value === sourceUrl)); setScope("all"); setTags([]); setKeyword(""); setPage(1); }, [sourceUrl]);
    useEffect(() => { if (query.isError) message.error(query.error instanceof Error ? query.error.message : "提示词数据读取失败"); }, [message, query.error, query.isError]);
    useEffect(() => { setPage(1); }, [scope, keyword, tags]);
    useEffect(() => { setContributorPage(1); }, [contributor, contributorSection, contributorTags]);

    const scopedPrompts = useMemo(() => filterPrompts(prompts, scope, keyword, tags, favorites, sourceUrl), [favorites, keyword, prompts, scope, sourceUrl, tags]);
    const availableTags = useMemo(() => collectTags(filterPrompts(prompts, scope, "", [], favorites, sourceUrl)), [favorites, prompts, scope, sourceUrl]);
    const pagedPrompts = scopedPrompts.slice((page - 1) * pageSize, page * pageSize);
    const sourceLabel = PROMPT_SOURCES.find((item) => item.value === sourceUrl)?.label || "自定义数据源";
    const authorPrompts = useMemo(() => prompts.filter((item) => (item.contributor || "匿名贡献者") === contributor), [contributor, prompts]);
    const authorSections = useMemo(() => Array.from(new Map(authorPrompts.map((item) => [item.sectionId, item.sectionTitle])).entries()), [authorPrompts]);
    const authorAvailableTags = useMemo(() => collectTags(authorPrompts.filter((item) => contributorSection === "all" || item.sectionId === contributorSection)), [authorPrompts, contributorSection]);
    const filteredAuthorPrompts = authorPrompts.filter((item) => (contributorSection === "all" || item.sectionId === contributorSection) && (!contributorTags.length || contributorTags.every((tag) => item.tags?.includes(tag))));
    const pagedAuthorPrompts = filteredAuthorPrompts.slice((contributorPage - 1) * contributorPageSize, contributorPage * contributorPageSize);

    const isFavorite = (prompt: LibraryPrompt | null) => Boolean(prompt && favorites.includes(promptFavoriteKey(sourceUrl, prompt.id)));
    const favorite = (prompt: LibraryPrompt) => toggleFavorite(promptFavoriteKey(sourceUrl, prompt.id));
    const reveal = (prompt: LibraryPrompt) => setRevealed((current) => new Set(current).add(prompt.id));
    const openContributor = (name: string) => { setSelectedPrompt(null); setContributor(name || "匿名贡献者"); setContributorSection("all"); setContributorTags([]); };
    const saveAsset = (prompt: LibraryPrompt, content = prompt.content) => {
        addAsset({ kind: "text", title: prompt.title, coverUrl: prompt.images?.[0] || "", tags: prompt.tags || [], source: prompt.sectionTitle, note: prompt.notes, data: { content }, metadata: { source: "prompt-library", promptId: prompt.id, contributor: prompt.contributor } });
        message.success("已加入我的素材");
    };
    const usePrompt = (value: string) => navigate("/image", { state: { prompt: value } });
    const contribute = () => modal.confirm({ title: "投稿提示词", content: "前往原提示词广场的投稿页面分享你的提示词？", okText: "前往投稿", cancelText: "取消", onOk: () => window.open("https://bmzxdlj.cn", "_blank", "noopener,noreferrer") });

    return (
        <div className="app-page thin-scrollbar">
            <main className="app-page-container max-w-[1600px]">
                <header className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-6 shadow-[0_18px_60px_rgba(31,45,75,.07)] sm:px-8 sm:py-8">
                    <div className="absolute inset-y-0 left-0 w-1.5 bg-primary" />
                    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px] xl:items-end">
                        <div>
                            <div className="page-eyebrow mb-3">PROMPT INDEX</div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">提示词广场</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">浏览创作者公开的画面方案，查看参考图、变体与备注，再直接送入工作台。</p>
                            <div className="mt-5 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-primary px-2.5 py-1.5 font-semibold text-primary-foreground">{prompts.length.toLocaleString()} 条灵感</span><span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">{data?.sections.length || 0} 个分类</span><span className="rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground">{favorites.filter((key) => key.startsWith(`${sourceUrl}::`)).length} 个收藏</span></div>
                        </div>
                        <div className="rounded-2xl border border-border bg-background/70 p-4">
                            <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground"><span className="flex items-center gap-2"><Database className="size-3.5" />数据源</span><span><Button type="text" size="small" icon={<UploadCloud className="size-3.5" />} onClick={contribute}>投稿</Button><Button type="text" size="small" icon={<RefreshCw className={cn("size-3.5", query.isFetching && "animate-spin")} />} loading={query.isFetching} onClick={() => void refresh()}>刷新</Button></span></div>
                            <Select className="w-full" value={customSourceOpen ? "custom" : sourceUrl} options={[...PROMPT_SOURCES, { label: "自定义 URL", value: "custom" }]} onChange={(value) => { if (value === "custom") setCustomSourceOpen(true); else { setCustomSourceOpen(false); setSourceUrl(value); } }} />
                            {customSourceOpen ? <Input className="mt-2" value={sourceDraft} placeholder="输入允许跨域访问的 JSON 地址" onChange={(event) => setSourceDraft(event.target.value)} onPressEnter={() => setSourceUrl(sourceDraft)} addonAfter={<button type="button" onClick={() => setSourceUrl(sourceDraft)}>应用</button>} /> : null}
                            <div className="mt-2 truncate text-[11px] text-muted-foreground">当前：{sourceLabel}</div>
                        </div>
                    </div>
                </header>

                <section className="mt-5 rounded-2xl border border-border bg-card p-4 sm:p-5">
                    <div className="grid gap-4 lg:grid-cols-[minmax(260px,420px)_1fr] lg:items-start">
                        <Input size="large" prefix={<Search className="size-4 text-muted-foreground" />} value={keyword} placeholder="搜索标题、内容、标签或投稿者" allowClear onChange={(event) => setKeyword(event.target.value)} />
                        <div className="flex flex-wrap gap-2 lg:justify-end">
                            {[{ id: "all", label: "全部", icon: BookOpen }, { id: "new", label: "最新", icon: Sparkles }, { id: "favorites", label: "我的收藏", icon: Star }, ...((data?.sections || []).map((section) => ({ id: section.id, label: section.title, icon: null })))].map((item) => { const Icon = item.icon; return <button key={item.id} type="button" className={cn("flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition", scope === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground")} onClick={() => setScope(item.id)}>{Icon ? <Icon className="size-3.5" /> : null}{item.label}</button>; })}
                        </div>
                    </div>
                    {availableTags.length ? <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/70 pt-4"><Tag.CheckableTag checked={!tags.length} className={cn("filter-tag", !tags.length && "is-active")} onChange={() => setTags([])}>全部标签</Tag.CheckableTag>{availableTags.map((tag) => <Tag.CheckableTag key={tag} checked={tags.includes(tag)} className={cn("filter-tag", tags.includes(tag) && "is-active")} onChange={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])}>{tag}</Tag.CheckableTag>)}</div> : null}
                </section>

                <div className="mt-5 flex items-center justify-between gap-3"><div className="text-sm font-semibold">{scope === "favorites" ? "收藏内容" : scope === "new" ? "最近 48 小时" : "浏览结果"}<span className="ml-2 text-xs font-normal text-muted-foreground">{scopedPrompts.length} 条</span></div>{data?.lastUpdated ? <span className="text-xs text-muted-foreground">数据更新：{data.lastUpdated}</span> : null}</div>
                {query.isLoading ? <div className="grid min-h-80 place-items-center"><Spin size="large" /></div> : null}
                {!query.isLoading && pagedPrompts.length ? <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{pagedPrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} favorite={isFavorite(prompt)} revealed={revealed.has(prompt.id)} onOpen={() => setSelectedPrompt(prompt)} onFavorite={() => favorite(prompt)} onReveal={() => reveal(prompt)} onContributor={() => openContributor(prompt.contributor || "匿名贡献者")} />)}</div> : null}
                {!query.isLoading && !pagedPrompts.length ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有找到匹配的提示词" className="py-20" /> : null}
                {scopedPrompts.length > pageSize ? <div className="flex justify-center py-8"><Pagination current={page} pageSize={pageSize} total={scopedPrompts.length} showSizeChanger={false} onChange={setPage} /></div> : <div className="h-8" />}
            </main>

            <Drawer open={Boolean(contributor)} onClose={() => setContributor("")} title={<div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground"><UserRound className="size-4" /></span><div><div className="font-semibold">{contributor}</div><div className="text-xs font-normal text-muted-foreground">{authorPrompts.length} 条投稿</div></div></div>} size={760}>
                <div className="mb-4 flex flex-wrap gap-2"><Select value={contributorSection} className="min-w-40" options={[{ label: "全部分类", value: "all" }, ...authorSections.map(([value, label]) => ({ value, label }))]} onChange={setContributorSection} /><Select mode="multiple" allowClear maxTagCount="responsive" value={contributorTags} className="min-w-56 flex-1" placeholder="筛选标签" options={authorAvailableTags.map((tag) => ({ label: tag, value: tag }))} onChange={setContributorTags} /></div>
                <div className="grid gap-4 sm:grid-cols-2">{pagedAuthorPrompts.map((prompt) => <PromptCard key={prompt.id} prompt={prompt} favorite={isFavorite(prompt)} revealed={revealed.has(prompt.id)} onOpen={() => setSelectedPrompt(prompt)} onFavorite={() => favorite(prompt)} onReveal={() => reveal(prompt)} onContributor={() => undefined} />)}</div>
                {filteredAuthorPrompts.length > contributorPageSize ? <div className="mt-6 flex justify-center"><Pagination current={contributorPage} pageSize={contributorPageSize} total={filteredAuthorPrompts.length} showSizeChanger={false} onChange={setContributorPage} /></div> : null}
            </Drawer>

            <PromptDetailDialog prompt={selectedPrompt} favorite={isFavorite(selectedPrompt)} revealed={Boolean(selectedPrompt && revealed.has(selectedPrompt.id))} onClose={() => setSelectedPrompt(null)} onFavorite={() => selectedPrompt && favorite(selectedPrompt)} onReveal={() => selectedPrompt && reveal(selectedPrompt)} onCopy={(value) => copyText(value, "提示词已复制")} onUse={usePrompt} onSave={saveAsset} onContributor={openContributor} />
        </div>
    );
}

function filterPrompts(prompts: LibraryPrompt[], scope: string, keyword: string, tags: string[], favorites: string[], sourceUrl: string) {
    const search = keyword.trim().toLowerCase();
    return prompts.filter((prompt) => {
        if (scope === "new" && !isNewPrompt(prompt)) return false;
        if (scope === "favorites" && !favorites.includes(promptFavoriteKey(sourceUrl, prompt.id))) return false;
        if (scope !== "all" && scope !== "new" && scope !== "favorites" && prompt.sectionId !== scope) return false;
        if (tags.length && !tags.every((tag) => prompt.tags?.includes(tag))) return false;
        return !search || [prompt.title, prompt.content, prompt.contributor, ...(prompt.tags || [])].filter(Boolean).join(" ").toLowerCase().includes(search);
    }).sort((a, b) => Number(isNewPrompt(b)) - Number(isNewPrompt(a)));
}

function collectTags(prompts: LibraryPrompt[]) {
    return Array.from(new Set(prompts.flatMap((prompt) => prompt.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN"));
}
