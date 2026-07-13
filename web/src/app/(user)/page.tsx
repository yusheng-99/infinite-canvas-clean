import { ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { navigationTools } from "@/constant/navigation-tools";
import { cn } from "@/lib/utils";

const descriptions: Record<string, string> = {
    canvas: "管理和打开你的画布项目",
    image: "用提示词和参考图生成图片",
    video: "生成视频并保存结果",
    assets: "管理本地素材库",
};

export default function IndexPage() {
    return (
        <main className="app-page">
            <div className="app-page-container flex min-h-full max-w-6xl flex-col justify-center py-12 lg:py-16">
                <div className="mb-10 max-w-2xl">
                    <div className="mb-5 flex size-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-card shadow-sm dark:border-white/[0.08]">
                        <Sparkles className="size-5" />
                    </div>
                    <p className="page-eyebrow">Creative workspace</p>
                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">把灵感变成作品。</h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">从无限画布开始创作，或直接进入图片、视频与素材工作台。</p>
                </div>
                <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {navigationTools.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.slug}
                            to={`/${item.slug}`}
                            className={cn(
                                "group flex min-h-52 flex-col justify-between rounded-2xl border border-black/[0.06] bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,.04),0_12px_32px_rgba(15,23,42,.04)] transition duration-200 hover:-translate-y-1 hover:border-black/[0.12] hover:shadow-[0_18px_44px_rgba(15,23,42,.10)]",
                                "dark:border-white/[0.08] dark:hover:border-white/[0.16] dark:hover:shadow-[0_20px_48px_rgba(0,0,0,.28)]",
                            )}
                        >
                            <span className="flex items-start justify-between">
                            <span className="grid size-11 place-items-center rounded-xl bg-secondary text-foreground transition group-hover:bg-foreground group-hover:text-background">
                                <Icon className="size-5" />
                            </span>
                            <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                            </span>
                            <span>
                                <span className="block text-lg font-semibold tracking-tight">{item.label}</span>
                                <span className="mt-2 block text-sm leading-6 text-muted-foreground">{descriptions[item.slug]}</span>
                            </span>
                        </Link>
                    );
                })}
                </div>
            </div>
        </main>
    );
}
