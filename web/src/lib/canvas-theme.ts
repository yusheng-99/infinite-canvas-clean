export type CanvasColorTheme = "light" | "dark";
export type CanvasBackgroundMode = "dots" | "lines" | "blank";

export const canvasThemes = {
    light: {
        canvas: {
            background: "#f8fafc",
            dot: "rgba(71,85,105,.24)",
            line: "rgba(71,85,105,.10)",
            selectionStroke: "#2563eb",
            selectionFill: "rgba(37,99,235,.08)",
        },
        node: {
            label: "#475569",
            fill: "#e9eff6",
            panel: "#ffffff",
            stroke: "#b8c4d3",
            shadow: "0 4px 14px rgba(15,23,42,.08), 0 1px 3px rgba(15,23,42,.10)",
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
            background: "#0d1119",
            dot: "rgba(203,213,225,.20)",
            line: "rgba(203,213,225,.08)",
            selectionStroke: "#60a5fa",
            selectionFill: "rgba(96,165,250,.10)",
        },
        node: {
            label: "#cbd5e1",
            fill: "#1b2430",
            panel: "#151b26",
            stroke: "#3b485b",
            shadow: "0 5px 18px rgba(0,0,0,.34)",
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
