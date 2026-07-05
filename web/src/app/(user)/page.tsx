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
        <main className="flex h-full items-center justify-center bg-background px-6 text-foreground">
            <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {navigationTools.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.slug}
                            to={`/${item.slug}`}
                            className={cn(
                                "group flex min-h-44 flex-col justify-between rounded-3xl border border-stone-200/80 bg-white/80 p-5 shadow-[0_18px_60px_rgba(28,25,23,.10)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(28,25,23,.16)]",
                                "dark:border-stone-800/80 dark:bg-stone-950/80 dark:shadow-[0_18px_60px_rgba(0,0,0,.35)] dark:hover:shadow-[0_24px_80px_rgba(0,0,0,.48)]",
                            )}
                        >
                            <span className="grid size-11 place-items-center rounded-2xl bg-stone-100 text-stone-900 transition group-hover:bg-stone-900 group-hover:text-white dark:bg-stone-900 dark:text-stone-100 dark:group-hover:bg-stone-100 dark:group-hover:text-stone-950">
                                <Icon className="size-5" />
                            </span>
                            <span>
                                <span className="block text-lg font-semibold">{item.label}</span>
                                <span className="mt-2 block text-sm leading-6 text-stone-500 dark:text-stone-400">{descriptions[item.slug]}</span>
                            </span>
                        </Link>
                    );
                })}
            </div>
        </main>
    );
}
