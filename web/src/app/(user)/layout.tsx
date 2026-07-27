"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLocation, useOutlet } from "react-router-dom";

import { AppTopNav } from "@/components/layout/app-top-nav";

export default function UserLayout() {
    const pathname = useLocation().pathname;
    const outlet = useOutlet();
    const fullBleed = pathname === "/" || /^\/canvas\/[^/]+/.test(pathname);
    const reduceMotion = useReducedMotion();

    return (
        <div className="app-shell relative flex h-dvh flex-col overflow-hidden text-foreground md:flex-row">
            <AppTopNav />
            <div className={fullBleed ? "min-h-0 min-w-0 flex-1 overflow-hidden" : "min-h-0 min-w-0 flex-1 overflow-hidden md:py-3 md:pr-3"}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pathname}
                        className={fullBleed ? "h-full" : "app-main h-full overflow-hidden"}
                        style={{ willChange: "opacity, transform" }}
                        initial={reduceMotion ? false : fullBleed ? { opacity: 0 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: fullBleed ? 0 : -8 }}
                        transition={{ duration: fullBleed ? 0.26 : 0.32, ease: [0.33, 1, 0.68, 1] }}
                    >
                        {outlet}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
