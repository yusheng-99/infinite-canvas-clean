"use client";

import { Drawer } from "antd";
import { Link } from "react-router-dom";

import { navigationTools, type NavigationToolSlug } from "@/constant/navigation-tools";
import { cn } from "@/lib/utils";

type MobileNavDrawerProps = {
    open: boolean;
    activeToolSlug?: NavigationToolSlug;
    onClose: () => void;
};

export function MobileNavDrawer({ open, activeToolSlug, onClose }: MobileNavDrawerProps) {
    return (
        <Drawer title="导航" placement="left" size={280} open={open} onClose={onClose} className="md:hidden">
            <div className="space-y-1">
                <Link
                    to="/"
                    onClick={onClose}
                    className="mb-2 flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium text-foreground transition hover:bg-foreground/[0.04]"
                >
                    返回首页
                </Link>
                {navigationTools.map((tool) => {
                    const Icon = tool.icon;
                    const active = tool.slug === activeToolSlug;
                    return (
                        <Link
                            key={tool.slug}
                            to={`/${tool.slug}`}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-3 py-3 text-base transition",
                                active
                                    ? "bg-foreground/[0.07] font-medium text-foreground dark:bg-white/[0.1]"
                                    : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground",
                            )}
                        >
                            <Icon className="size-5" />
                            <span>{tool.label}</span>
                        </Link>
                    );
                })}
            </div>
        </Drawer>
    );
}