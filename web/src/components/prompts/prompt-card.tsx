"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { EyeOff, FileText, Star, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPromptTime, isNewPrompt, isRestrictedPrompt, type LibraryPrompt } from "@/services/api/prompts";

export function PromptCard({ prompt, favorite, revealed, onOpen, onFavorite, onReveal, onContributor }: { prompt: LibraryPrompt; favorite: boolean; revealed: boolean; onOpen: () => void; onFavorite: () => void; onReveal: () => void; onContributor: () => void }) {
    const [hovered, setHovered] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);
    const images = prompt.images || [];
    const restricted = isRestrictedPrompt(prompt);

    useEffect(() => {
        if (!hovered || images.length < 2) return setImageIndex(0);
        const timer = window.setInterval(() => setImageIndex((index) => (index + 1) % images.length), 1600);
        return () => window.clearInterval(timer);
    }, [hovered, images.length]);

    const stop = (event: MouseEvent) => event.stopPropagation();
    return (
        <article className="hover-float-card group relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[0_14px_38px_rgba(31,45,75,.07)] hover:border-primary/40 hover:shadow-[0_20px_48px_color-mix(in_srgb,var(--primary)_14%,transparent)]" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <div role="button" tabIndex={0} className="block w-full cursor-pointer text-left" onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(); }}>
                <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
                    {images.length ? images.map((src, index) => <img key={`${src}-${index}`} src={src} alt={index ? "" : prompt.title} loading="lazy" className={cn("absolute inset-0 size-full object-cover transition duration-500", imageIndex === index ? "scale-100 opacity-100" : "scale-[1.02] opacity-0", restricted && !revealed && "blur-2xl scale-110")} />) : <div className="grid size-full place-items-center text-muted-foreground"><FileText className="size-10" /></div>}
                    <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                        <div className="rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-md">{prompt.sectionTitle}</div>
                        {isNewPrompt(prompt) ? <div className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold tracking-wider text-primary-foreground">NEW</div> : null}
                    </div>
                    {restricted && !revealed ? <button type="button" className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-sm" onClick={(event) => { stop(event); onReveal(); }}><span className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-white"><EyeOff className="size-4" />点击显示</span></button> : null}
                    {images.length > 1 ? <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">{images.slice(0, 6).map((_, index) => <span key={index} className={cn("h-1 rounded-full bg-white/70 transition-all", imageIndex === index ? "w-5 bg-white" : "w-1.5")} />)}</div> : null}
                </div>
                <div className="p-4">
                    <div className="flex items-start justify-between gap-3"><h2 className="line-clamp-1 text-base font-semibold">{prompt.title}</h2><span className="shrink-0 text-[11px] text-muted-foreground">{formatPromptTime(prompt).split(" ")[0]}</span></div>
                    <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{prompt.content}</p>
                    <div className="mt-3 flex min-h-6 flex-wrap gap-1.5">{(prompt.tags || []).slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-[10px] text-secondary-foreground">#{tag}</span>)}</div>
                </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 px-4 py-3">
                <button type="button" className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground transition hover:text-primary" onClick={(event) => { stop(event); onContributor(); }}><span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground"><UserRound className="size-3.5" /></span><span className="truncate">{prompt.contributor || "匿名贡献者"}</span></button>
                <button type="button" aria-label={favorite ? "取消收藏" : "收藏"} className={cn("grid size-8 shrink-0 place-items-center rounded-full transition", favorite ? "bg-amber-100 text-amber-500 dark:bg-amber-950/50" : "text-muted-foreground hover:bg-secondary hover:text-foreground")} onClick={(event) => { stop(event); onFavorite(); }}><Star className={cn("size-4", favorite && "fill-current")} /></button>
            </div>
        </article>
    );
}
