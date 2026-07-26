import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

import { navigationTools } from "@/constant/navigation-tools";

const descriptions: Record<string, string> = {
    canvas: "整理灵感与创作路径",
    image: "提示词生成画面",
    video: "画面延展成动态",
    assets: "收纳文本与媒体",
    gallery: "收藏生成图慢慢看",
    prompts: "浏览收藏提示词",
};

export default function IndexPage() {
    return (
        <main className="h-full overflow-auto bg-background text-foreground">
            <div className="mx-auto flex min-h-full max-w-[1120px] flex-col justify-center px-6 py-16 sm:px-8">
                <section className="mx-auto max-w-3xl text-center">
                    <p className="text-[13px] font-medium tracking-[0.08em] text-muted-foreground">无限画布</p>
                    <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[3.75rem]">
                        让每个想法，
                        <br className="hidden sm:block" />
                        自由延展。
                    </h1>
                    <p className="mx-auto mt-5 max-w-xl text-[17px] leading-7 text-muted-foreground">以画布组织思路，再用图像、视频与素材工作台把它变成作品。</p>
                </section>

                <section className="mt-16 grid auto-rows-fr gap-6 overflow-visible px-1 sm:grid-cols-2 lg:grid-cols-3">
                    {navigationTools.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.slug} className="home-launch-card">
                                <Link to={`/${item.slug}`} className="home-launch-card-link">
                                    <span className="home-launch-card-icon">
                                        <Icon className="size-4" />
                                    </span>
                                    <span className="mt-8 block text-[17px] font-semibold tracking-tight text-foreground">{item.label}</span>
                                    <span className="mt-2 block min-h-[40px] text-sm leading-5 text-muted-foreground">{descriptions[item.slug]}</span>
                                    <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-primary">
                                        打开
                                        <ArrowUpRight className="home-launch-card-arrow size-3.5" />
                                    </span>
                                </Link>
                            </div>
                        );
                    })}
                </section>
            </div>
        </main>
    );
}
