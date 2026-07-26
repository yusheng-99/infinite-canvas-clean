"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocation } from "react-router-dom";

import { AppTopNav } from "@/components/layout/app-top-nav";

export default function UserLayout({ children }: { children: ReactNode }) {
    const pathname = useLocation().pathname;
    const fullBleed = pathname === "/" || /^\/canvas\/[^/]+/.test(pathname);
    const reduceMotion = useReducedMotion();

    return (
        <div className="app-shell relative flex h-dvh flex-col overflow-hidden text-foreground md:flex-row">
            <AppTopNav />
            <motion.div
                key={pathname}
                className={fullBleed ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-h-0 min-w-0 flex-1 overflow-hidden md:py-3 md:pr-3"}
                initial={reduceMotion ? false : fullBleed ? { opacity: 0 } : { opacity: 0, y: 16, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: fullBleed ? 0.3 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className={fullBleed ? "h-full" : "app-main h-full overflow-hidden"}>{children}</div>
            </motion.div>
        </div>
    );
}
