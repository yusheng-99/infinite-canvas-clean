"use client";

import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { navigationTools, type NavigationToolSlug } from "@/constant/navigation-tools";
import { AppConfigModal } from "@/components/layout/app-config-modal";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { UserStatusActions } from "@/components/layout/user-status-actions";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function AppTopNav() {
    const pathname = useLocation().pathname;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const hideHeader = /^\/canvas\/[^/]+/.test(pathname);
    const hideEntrances = pathname === "/";
    const slug = pathname.split("/").filter(Boolean)[0];
    const activeToolSlug = navigationTools.some((tool) => tool.slug === slug) ? (slug as NavigationToolSlug) : undefined;

    return (
        <>
            {!hideHeader ? (
                <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-black/[0.06] bg-background/85 backdrop-blur-2xl dark:border-white/[0.07]">
                    <div className="mx-auto flex h-full max-w-[1600px] items-stretch justify-between gap-5 px-4 sm:px-6 lg:px-8">
                        {!hideEntrances ? (
                            <div className="flex min-w-0 items-center">
                                <Link to="/" className="flex h-full shrink-0 items-center gap-2.5 text-sm font-semibold leading-none tracking-tight text-foreground transition hover:opacity-70">
                                    <span className="grid size-9 place-items-center rounded-xl bg-foreground text-background shadow-sm">
                                    <span
                                        className="size-4 shrink-0 bg-current"
                                        style={{
                                            mask: "url(/logo.svg) center / contain no-repeat",
                                            WebkitMask: "url(/logo.svg) center / contain no-repeat",
                                        }}
                                    />
                                    </span>
                                    <span className="text-[15px] font-semibold">无限画布</span>
                                </Link>

                                <button
                                    type="button"
                                    className="ml-3 inline-flex size-8 shrink-0 items-center justify-center text-stone-600 transition hover:text-stone-950 md:hidden dark:text-stone-300 dark:hover:text-white"
                                    onClick={() => setMobileNavOpen(true)}
                                    aria-label="打开导航菜单"
                                    title="导航菜单"
                                >
                                    <Menu className="size-5" />
                                </button>

                                <nav className="hide-scrollbar ml-8 hidden h-16 min-w-0 items-center gap-1 overflow-x-auto md:flex">
                                    {navigationTools.map((tool) => {
                                        const Icon = tool.icon;
                                        const active = tool.slug === activeToolSlug;
                                        return (
                                            <Link
                                                key={tool.slug}
                                                to={`/${tool.slug}`}
                                                className={cn(
                                                    "flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-sm leading-6 transition",
                                                    active
                                                        ? "bg-foreground font-medium text-background shadow-sm"
                                                        : "text-muted-foreground hover:bg-black/[0.04] hover:text-foreground dark:hover:bg-white/[0.06]",
                                                )}
                                            >
                                                <Icon className="size-4" />
                                                <span className="truncate">{tool.label}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        ) : (
                            <div />
                        )}

                        <div className="my-auto flex h-9 min-w-0 items-center justify-end gap-2 justify-self-end whitespace-nowrap">
                            <UserStatusActions />
                        </div>
                    </div>
                </header>
            ) : null}

            <MobileNavDrawer open={mobileNavOpen} activeToolSlug={activeToolSlug} onClose={() => setMobileNavOpen(false)} />
            <AppConfigModal />
        </>
    );
}
