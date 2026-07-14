import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { navigationTools } from "@/constant/navigation-tools";
import { cn } from "@/lib/utils";

const descriptions: Record<string, string> = {
    canvas: "整理灵感、节点与创作路径",
    image: "从提示词与参考图生成画面",
    video: "让静态画面延展成动态叙事",
    assets: "收纳常用文本与本地媒体",
};

export default function IndexPage() {
    return (
        <main className="app-page">
            <div className="app-page-container flex min-h-full max-w-[1400px] flex-col justify-center py-10 lg:py-12">
                <header className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="max-w-3xl">
                        <p className="page-eyebrow">从灵感原点开始</p>
                        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">让每个想法，自由延展。</h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">以画布组织思路，再用图像、视频与素材工作台把它变成作品。</p>
                    </div>
                    <div className="hidden items-center gap-5 border-l border-border pl-6 text-xs text-muted-foreground lg:flex">
                        <span><strong className="mr-2 text-2xl font-semibold text-foreground">4</strong>个创作入口</span>
                        <span><strong className="mr-2 text-2xl font-semibold text-foreground">∞</strong>自由画布</span>
                        <span><strong className="mr-2 text-2xl font-semibold text-foreground">本地</strong>保存优先</span>
                    </div>
                </header>
                <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)] lg:grid-rows-3">
                {navigationTools.map((item) => {
                    const Icon = item.icon;
                    const primary = item.slug === "canvas";
                    return (
                        <Link
                            key={item.slug}
                            to={`/${item.slug}`}
                            className={cn(
                                "launch-card group flex flex-col justify-between",
                                primary ? "launch-card-primary min-h-64 sm:col-span-2 lg:col-span-1 lg:row-span-3 lg:min-h-[320px]" : "min-h-36 lg:min-h-0",
                            )}
                        >
                            <span className="flex items-start justify-between">
                                <span className={cn("grid place-items-center rounded-xl bg-secondary text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground", primary ? "size-14" : "size-10")}>
                                    <Icon className={primary ? "size-6" : "size-4"} />
                                </span>
                                <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                            </span>
                            <span>
                                {primary ? <span className="mb-5 block max-w-sm text-sm leading-6 text-muted-foreground">画布是整个创作流程的起点。</span> : null}
                                <span className={cn("block font-semibold tracking-tight", primary ? "text-3xl" : "text-base")}>{item.label}</span>
                                <span className={cn("block text-muted-foreground", primary ? "mt-3 text-base leading-7" : "mt-1 text-sm leading-6")}>{descriptions[item.slug]}</span>
                            </span>
                        </Link>
                    );
                })}
                </div>
            </div>
        </main>
    );
}
