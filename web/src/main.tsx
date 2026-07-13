import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "antd/dist/reset.css";
import "./app/globals.css";

import { AppProviders } from "@/components/layout/app-providers";
import { router } from "@/router";

document.documentElement.lang = "zh-CN";
document.documentElement.classList.add("font-sans");
document.body.className = "bg-background text-foreground antialiased";
document.body.style.fontFamily = '"SimSun","宋体",serif';

try {
    const state = JSON.parse(localStorage.getItem("infinite-canvas:theme_store") || "{}");
    const theme = state.state?.theme === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
} catch {}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <AppProviders>
            <RouterProvider router={router} />
        </AppProviders>
    </React.StrictMode>,
);
