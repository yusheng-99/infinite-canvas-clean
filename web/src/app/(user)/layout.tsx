"use client";

import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { AppTopNav } from "@/components/layout/app-top-nav";

export default function UserLayout({ children }: { children: ReactNode }) {
    const pathname = useLocation().pathname;
    const fullBleed = /^\/canvas\/[^/]+/.test(pathname);

    return (
        <div className="app-shell flex h-dvh flex-col overflow-hidden text-foreground md:flex-row">
            <AppTopNav />
            <div className={fullBleed ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-h-0 min-w-0 flex-1 overflow-hidden md:py-3 md:pr-3"}>
                <div className={fullBleed ? "h-full" : "app-main h-full overflow-hidden"}>{children}</div>
            </div>
        </div>
    );
}
