import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

const palette = {
    light: {
        primary: "#2563eb",
        primaryHover: "#1d4ed8",
        primaryText: "#ffffff",
        background: "#f5f7fb",
        container: "#ffffff",
        elevated: "#ffffff",
        border: "#dce2ec",
        text: "#172033",
        textSecondary: "#68738a",
        menuBg: "#edf3ff",
        menuText: "#1d4ed8",
        selectActiveBg: "#f1f5ff",
        selectSelectedBg: "#e4edff",
        selectText: "#1d4ed8",
        tableSelectedBg: "rgba(37, 99, 235, 0.08)",
        tableSelectedHoverBg: "rgba(37, 99, 235, 0.12)",
    },
    dark: {
        primary: "#60a5fa",
        primaryHover: "#93c5fd",
        primaryText: "#0b1220",
        background: "#0d1119",
        container: "#151b26",
        elevated: "#191f2b",
        border: "#2b3445",
        text: "#f3f6fb",
        textSecondary: "#99a6bb",
        menuBg: "#202b3e",
        menuText: "#bfdbfe",
        selectActiveBg: "#202b3e",
        selectSelectedBg: "#263653",
        selectText: "#bfdbfe",
        tableSelectedBg: "rgba(96, 165, 250, 0.10)",
        tableSelectedHoverBg: "rgba(96, 165, 250, 0.15)",
    },
};

export function getAntThemeConfig(dark: boolean): ThemeConfig {
    const color = dark ? palette.dark : palette.light;

    return {
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        cssVar: { key: dark ? "infinite-canvas-dark" : "infinite-canvas-light" },
        token: {
            colorPrimary: color.primary,
            colorInfo: color.primary,
            colorLink: color.primary,
            colorLinkHover: color.primaryHover,
            colorLinkActive: color.primary,
            colorTextLightSolid: color.primaryText,
            colorBgBase: color.background,
            colorBgLayout: color.background,
            colorBgContainer: color.container,
            colorBgElevated: color.elevated,
            colorBorder: color.border,
            colorText: color.text,
            colorTextSecondary: color.textSecondary,
            borderRadius: 10,
            borderRadiusLG: 14,
            controlHeight: 36,
            fontFamily: 'Inter,"SF Pro Text","PingFang SC","Microsoft YaHei UI","Microsoft YaHei",sans-serif',
        },
        components: {
            Button: {
                primaryShadow: "none",
                borderRadius: 10,
            },
            Input: { activeShadow: `0 0 0 3px ${dark ? "rgba(96, 165, 250, 0.14)" : "rgba(37, 99, 235, 0.10)"}` },
            Menu: {
                itemActiveBg: color.menuBg,
                itemHoverBg: color.menuBg,
                itemSelectedBg: color.menuBg,
                itemSelectedColor: color.menuText,
                darkItemHoverBg: palette.dark.menuBg,
                darkItemSelectedBg: palette.dark.menuBg,
                darkItemSelectedColor: palette.dark.menuText,
            },
            Select: {
                optionActiveBg: color.selectActiveBg,
                optionSelectedBg: color.selectSelectedBg,
                optionSelectedColor: color.selectText,
            },
            Table: {
                rowSelectedBg: color.tableSelectedBg,
                rowSelectedHoverBg: color.tableSelectedHoverBg,
            },
        },
    };
}
