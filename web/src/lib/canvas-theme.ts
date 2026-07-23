export type CanvasColorTheme = "light" | "dark";
export type CanvasBackgroundMode = "dots" | "lines" | "blank";

export const canvasThemes = {
    light: {
        canvas: {
            background: "#f5f7fb",
            dot: "rgba(71,85,105,.22)",
            line: "rgba(71,85,105,.09)",
            selectionStroke: "#2563eb",
            selectionFill: "rgba(37,99,235,.08)",
        },
        node: {
            label: "#475569",
            fill: "#eef3f9",
            panel: "#ffffff",
            stroke: "#dce2ec",
            shadow: "0 4px 16px rgba(15,23,42,.06), 0 1px 3px rgba(15,23,42,.04)",
            activeStroke: "#2563eb",
            placeholder: "#94a3b8",
            text: "#172033",
            muted: "#68738a",
            faint: "#a0abcc",
        },
        toolbar: {
            panel: "rgba(255,255,255,.92)",
            border: "#dce2ec",
            item: "#475569",
            itemHover: "#f1f5ff",
            activeBg: "#e4edff",
            activeText: "#1d4ed8",
        },
    },
    dark: {
        canvas: {
            background: "#0d1119",
            dot: "rgba(203,213,225,.18)",
            line: "rgba(203,213,225,.07)",
            selectionStroke: "#60a5fa",
            selectionFill: "rgba(96,165,250,.10)",
        },
        node: {
            label: "#cbd5e1",
            fill: "#17202c",
            panel: "#151b26",
            stroke: "#2b3445",
            shadow: "0 6px 20px rgba(0,0,0,.30)",
            activeStroke: "#60a5fa",
            placeholder: "#7d899b",
            text: "#f3f6fb",
            muted: "#99a6bb",
            faint: "#64748b",
        },
        toolbar: {
            panel: "rgba(21,27,38,.92)",
            border: "#2b3445",
            item: "#cbd5e1",
            itemHover: "#202b3e",
            activeBg: "#263653",
            activeText: "#bfdbfe",
        },
    },
} as const;

export type CanvasTheme = (typeof canvasThemes)[CanvasColorTheme];
