"use client";

import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

import { navigationTools, type NavigationToolSlug } from "@/constant/navigation-tools";
import { AppConfigModal } from "@/components/layout/app-config-modal";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { UserStatusActions } from "@/components/layout/user-status-actions";
import { cn } from "@/lib/utils";

export function AppTopNav() {
    const pathname = useLocation().pathname;
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const hideHeader = /^\/canvas\/[^/]+/.test(pathname);
    const slug = pathname.split("/").filter(Boolean)[0];
    const activeToolSlug = navigationTools.some((tool) => tool.slug === slug) ? (slug as NavigationToolSlug) : undefined;

    return (
        <>
            {!hideHeader ? (
                <header className="sticky top-0 z-30 h-14 shrink-0 border-b border-border/50 bg-background/70 backdrop-blur-xl">
                    <div className="relative mx-auto flex h-full max-w-[1600px] items-center px-4 sm:px-6 lg:px-8">
                        <div className="z-10 flex min-w-0 items-center">
                            <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition hover:opacity-90">
                                <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                                    <span
                                        className="size-3.5 shrink-0 bg-current"
                                        style={{
                                            mask: "url(/logo.svg) center / contain no-repeat",
                                            WebkitMask: "url(/logo.svg) center / contain no-repeat",
                                        }}
                                    />
                                </span>
                                <span>无限画布</span>
                            </Link>
                            <button
                                type="button"
                                className="ml-3 inline-flex size-8 shrink-0 items-center justify-center text-muted-foreground transition hover:text-foreground md:hidden"
                                onClick={() => setMobileNavOpen(true)}
                                aria-label="打开导航菜单"
                                title="导航菜单"
                            >
                                <Menu className="size-5" />
                            </button>
                        </div>

                        <nav className="absolute inset-y-0 left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
                            {navigationTools.map((tool) => {
                                const Icon = tool.icon;
                                const active = tool.slug === activeToolSlug;
                                return (
                                    <Link
                                        key={tool.slug}
                                        to={`/${tool.slug}`}
                                        className={cn(
                                            "relative flex h-full shrink-0 items-center gap-2 px-3 text-xs font-medium transition-all duration-150 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-all",
                                            active ? "font-semibold text-foreground after:bg-primary" : "text-muted-foreground after:bg-transparent hover:text-foreground",
                                        )}
                                    >
                                        <Icon className={cn("size-3.5 transition", active && "text-primary")} />
                                        <span className="whitespace-nowrap">{tool.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="z-10 ml-auto flex items-center">
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