"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ClipboardCopy, EyeOff, FolderPlus, ImageIcon, Sparkles, Star, UserRound } from "lucide-react";
import { Button, Image, Modal, Tabs, Tag } from "antd";

import { cn } from "@/lib/utils";
import { formatPromptTime, isNewPrompt, isRestrictedPrompt, type LibraryPrompt } from "@/services/api/prompts";

export function PromptDetailDialog({ prompt, favorite, revealed, onClose, onFavorite, onReveal, onCopy, onUse, onSave, onContributor }: { prompt: LibraryPrompt | null; favorite: boolean; revealed: boolean; onClose: () => void; onFavorite: () => void; onReveal: () => void; onCopy: (value: string) => void; onUse: (value: string) => void; onSave?: (prompt: LibraryPrompt, content: string) => void; onContributor: (name: string) => void }) {
    const [variantIndex, setVariantIndex] = useState(0);
    const [imageIndex, setImageIndex] = useState(0);
    useEffect(() => { setVariantIndex(0); setImageIndex(0); }, [prompt?.id]);
    const current = useMemo(() => {
        if (!prompt) return null;
        const variant = variantIndex ? prompt.similar?.[variantIndex - 1] : null;
        return { content: variant?.content || prompt.content, contributor: variant?.contributor || prompt.contributor, notes: variant?.notes || prompt.notes, images: variant?.images?.length ? variant.images : prompt.images || [], refs: prompt.refs || [] };
    }, [prompt, variantIndex]);
    const restricted = prompt ? isRestrictedPrompt(prompt) : false;

    return (
        <Modal open={Boolean(prompt)} onCancel={onClose} footer={null} width={1120} centered destroyOnHidden styles={{ body: { padding: 0, overflow: "hidden" } }}>
            {prompt && current ? (
                <div className="grid max-h-[82vh] min-h-[620px] grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,.92fr)]">
                    <section className="relative flex min-h-72 flex-col bg-secondary lg:min-h-0">
                        <div className="relative min-h-72 flex-1 overflow-hidden">
                            {current.images.length ? <img src={current.images[Math.min(imageIndex, current.images.length - 1)]} alt={prompt.title} className={cn("size-full object-contain", restricted && !revealed && "blur-2xl scale-105")} /> : <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-14" /></div>}
                            {restricted && !revealed ? <button type="button" className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm" onClick={onReveal}><span className="flex items-center gap-2 rounded-full bg-black/70 px-5 py-2.5 text-sm text-white"><EyeOff className="size-4" />点击显示图片</span></button> : null}
                            {current.images.length > 1 ? <><button type="button" aria-label="上一张" className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75" onClick={() => setImageIndex((value) => (value - 1 + current.images.length) % current.images.length)}><ArrowLeft className="size-5" /></button><button type="button" aria-label="下一张" className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75" onClick={() => setImageIndex((value) => (value + 1) % current.images.length)}><ArrowRight className="size-5" /></button></> : null}
                        </div>
                        {current.images.length > 1 ? <div className="hide-scrollbar flex h-20 shrink-0 gap-2 overflow-x-auto border-t border-border bg-card/90 p-2 backdrop-blur">{current.images.map((src, index) => <button key={`${src}-${index}`} type="button" aria-label={`查看第 ${index + 1} 张图片`} className={cn("h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition", imageIndex === index ? "border-primary" : "border-transparent opacity-65 hover:opacity-100")} onClick={() => setImageIndex(index)}><img src={src} alt="" className="size-full object-cover" /></button>)}</div> : null}
                    </section>
                    <section className="thin-scrollbar flex min-h-0 flex-col overflow-y-auto bg-card text-card-foreground">
                        <header className="border-b border-border px-6 pb-5 pt-6 pr-14">
                            <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-semibold leading-tight">{prompt.title}</h2>{isNewPrompt(prompt) ? <Tag color="blue">NEW</Tag> : null}{favorite ? <Tag color="gold">已收藏</Tag> : null}</div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                <button type="button" className="flex items-center gap-1.5 transition hover:text-primary" onClick={() => onContributor(current.contributor || "匿名贡献者")}><UserRound className="size-3.5" />{current.contributor || "匿名贡献者"}</button>
                                <span>{prompt.sectionTitle}</span><span>{formatPromptTime(prompt)}</span>
                            </div>
                        </header>
                        <div className="space-y-5 px-6 py-5">
                            {prompt.similar?.length ? <Tabs size="small" activeKey={String(variantIndex)} onChange={(value) => { setVariantIndex(Number(value)); setImageIndex(0); }} items={[{ key: "0", label: "主提示词" }, ...prompt.similar.map((_, index) => ({ key: String(index + 1), label: `变体 ${index + 1}` }))]} /> : null}
                            {current.notes ? <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-100"><div className="mb-1 font-semibold">投稿者备注</div><p className="whitespace-pre-wrap">{current.notes}</p></div> : null}
                            {current.refs.length ? <div><div className="mb-2 text-xs font-semibold text-muted-foreground">参考图</div><Image.PreviewGroup><div className="flex gap-2 overflow-x-auto">{current.refs.map((src, index) => <Image key={`${src}-${index}`} src={src} width={68} height={68} className="rounded-lg object-cover" />)}</div></Image.PreviewGroup></div> : null}
                            <div className="rounded-xl border border-border bg-background/55">
                                <div className="flex items-center justify-between border-b border-border px-4 py-2"><span className="text-xs font-semibold text-muted-foreground">提示词内容</span><Button type="text" size="small" icon={<ClipboardCopy className="size-3.5" />} onClick={() => onCopy(current.content)}>复制</Button></div>
                                <pre className="thin-scrollbar max-h-72 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-6 text-foreground">{current.content}</pre>
                            </div>
                            {prompt.tags?.length ? <div className="flex flex-wrap gap-1.5">{prompt.tags.map((tag) => <Tag key={tag} className="m-0">#{tag}</Tag>)}</div> : null}
                        </div>
                        <footer className="sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-card/95 px-6 py-4 backdrop-blur">
                            <Button type="primary" size="large" block icon={<Sparkles className="size-4" />} onClick={() => onUse(current.content)}>使用此提示词</Button>
                            {onSave ? <Button size="large" icon={<FolderPlus className="size-4" />} onClick={() => onSave(prompt, current.content)}>存素材</Button> : null}
                            <Button size="large" aria-label={favorite ? "取消收藏" : "收藏"} icon={<Star className={cn("size-4", favorite && "fill-current text-amber-500")} />} onClick={onFavorite} />
                        </footer>
                    </section>
                </div>
            ) : null}
        </Modal>
    );
}
