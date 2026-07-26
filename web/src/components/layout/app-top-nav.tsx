"use client";

import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

import { navigationTools, type NavigationToolSlug } from "@/constant/navigation-tools";
import { AppConfigModal } from "@/components/layout/app-config-modal";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { UserStatusActions } from "@/components/layout/user-status-actions";
import { cn } from "@/lib/utils";

const navGroups = [
    { label: "创作", slugs: ["canvas", "image", "video"] },
    { label: "资源", slugs: ["assets", "gallery", "prompts"] },
] as const;

function LogoIcon() {
    return (
        <span className="grid size-9 place-items-center rounded-[12px] bg-primary text-primary-foreground shadow-sm transition-transform duration-300 hover:scale-105">
            <span
                className="size-3.5 shrink-0 bg-current"
                style={{
                    mask: "url(/logo.svg) center / contain no-repeat",
                    WebkitMask: "url(/logo.svg) center / contain no-repeat",
                }}
            />
        </span>
    );
}

export function AppTopNav() {
    const pathname = useLocation().pathname;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const isHome = pathname === "/";
    const hideHeader = isHome || /^\/canvas\/[^/]+/.test(pathname);
    const slug = pathname.split("/").filter(Boolean)[0];
    const activeToolSlug = navigationTools.some((tool) => tool.slug === slug) ? (slug as NavigationToolSlug) : undefined;

    if (hideHeader) {
        return (
            <>
                {isHome ? (
                    <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
                        <UserStatusActions />
                    </div>
                ) : null}
                <MobileNavDrawer open={mobileNavOpen} activeToolSlug={activeToolSlug} onClose={() => setMobileNavOpen(false)} />
                <AppConfigModal />
            </>
        );
    }

    return (
        <>
            {/* 移动端顶部条 */}
            <div className="flex h-14 shrink-0 items-center justify-between px-3 md:hidden">
                <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="打开导航菜单"
                    title="导航菜单"
                >
                    <Menu className="size-5" />
                </button>
                <Link to="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                    <LogoIcon />
                    <span>无限画布</span>
                </Link>
                <div className="flex items-center">
                    <UserStatusActions />
                </div>
            </div>

            {/* 桌面左侧栏 */}
            <aside className="hidden h-full w-[232px] shrink-0 flex-col px-4 py-5 md:flex">
                <Link to="/" className="mb-8 flex items-center gap-2.5 px-2 transition hover:opacity-80" title="返回首页">
                    <LogoIcon />
                    <span className="text-[15px] font-bold tracking-tight text-foreground">无限画布</span>
                </Link>

                <nav className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
                    {navGroups.map((group) => (
                        <div key={group.label} className="flex flex-col gap-1">
                            <span className="mb-1 px-3 text-xs font-semibold tracking-[0.14em] text-muted-foreground/80">{group.label}</span>
                            {group.slugs.map((slug) => {
                                const tool = navigationTools.find((item) => item.slug === slug)!;
                                const Icon = tool.icon;
                                const active = tool.slug === activeToolSlug;
                                return (
                                    <Link
                                        key={tool.slug}
                                        to={`/${tool.slug}`}
                                        className={cn(
                                            "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px] transition-all duration-200",
                                            active
                                                ? "bg-primary/10 font-semibold text-primary"
                                                : "font-medium text-foreground hover:bg-foreground/[0.05] dark:hover:bg-white/[0.06]",
                                        )}
                                    >
                                        <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-foreground/60 group-hover:text-foreground")} />
                                        <span className="truncate">{tool.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="mt-3 pt-3">
                    <div className="flex items-center justify-center px-1">
                        <UserStatusActions />
                    </div>
                </div>
            </aside>

            <MobileNavDrawer open={mobileNavOpen} activeToolSlug={activeToolSlug} onClose={() => setMobileNavOpen(false)} />
            <AppConfigModal />
        </>
    );
}
