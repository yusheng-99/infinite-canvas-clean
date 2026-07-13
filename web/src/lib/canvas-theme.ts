export type CanvasColorTheme = "light" | "dark";
export type CanvasBackgroundMode = "dots" | "lines" | "blank";

export const canvasThemes = {
    light: {
        canvas: {
            background: "#f5f6f8",
            dot: "rgba(71,85,105,.24)",
            line: "rgba(71,85,105,.10)",
            selectionStroke: "#2563eb",
            selectionFill: "rgba(37,99,235,.08)",
        },
        node: {
            label: "#475569",
            fill: "#eef1f5",
            panel: "#ffffff",
            stroke: "#d9dee7",
            activeStroke: "#2563eb",
            placeholder: "#94a3b8",
            text: "#1e293b",
            muted: "#64748b",
            faint: "#a8b2c1",
        },
        toolbar: {
            panel: "rgba(255,255,255,.96)",
            border: "#d9dee7",
            item: "#475569",
            itemHover: "#eef2f7",
            activeBg: "#e8eefc",
            activeText: "#1d4ed8",
        },
    },
    dark: {
        canvas: {
            background: "#111318",
            dot: "rgba(203,213,225,.20)",
            line: "rgba(203,213,225,.08)",
            selectionStroke: "#60a5fa",
            selectionFill: "rgba(96,165,250,.10)",
        },
        node: {
            label: "#cbd5e1",
            fill: "#1d2129",
            panel: "#171a21",
            stroke: "#303744",
            activeStroke: "#60a5fa",
            placeholder: "#7d899b",
            text: "#f1f5f9",
            muted: "#94a3b8",
            faint: "#64748b",
        },
        toolbar: {
            panel: "rgba(23,26,33,.96)",
            border: "#303744",
            item: "#cbd5e1",
            itemHover: "#252a34",
            activeBg: "#253657",
            activeText: "#bfdbfe",
        },
    },
} as const;

export type CanvasTheme = (typeof canvasThemes)[CanvasColorTheme];
