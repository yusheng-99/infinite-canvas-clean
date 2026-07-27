import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

const palette = {
    light: {
        primary: "#4c63d2",
        primaryHover: "#3f52b5",
        primaryText: "#ffffff",
        background: "#f5f7fb",
        container: "#ffffff",
        elevated: "#ffffff",
        border: "#dce2ec",
        text: "#172033",
        textSecondary: "#68738a",
        menuBg: "#eef1fc",
        menuText: "#3f52b5",
        selectActiveBg: "#f2f4fc",
        selectSelectedBg: "#e8ecfb",
        selectText: "#3f52b5",
        tableSelectedBg: "rgba(76, 99, 210, 0.08)",
        tableSelectedHoverBg: "rgba(76, 99, 210, 0.12)",
    },
    dark: {
        primary: "#8ea3f2",
        primaryHover: "#aab9f6",
        primaryText: "#0b1220",
        background: "#0d1119",
        container: "#151b26",
        elevated: "#191f2b",
        border: "#2b3445",
        text: "#f3f6fb",
        textSecondary: "#99a6bb",
        menuBg: "#273350",
        menuText: "#cdd8fb",
        selectActiveBg: "#273350",
        selectSelectedBg: "#30405f",
        selectText: "#cdd8fb",
        tableSelectedBg: "rgba(142, 163, 242, 0.10)",
        tableSelectedHoverBg: "rgba(142, 163, 242, 0.15)",
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
            fontFamily: 'Inter,"SF Pro Text","Segoe UI","PingFang SC","Microsoft YaHei UI","Microsoft YaHei",sans-serif',
        },
        components: {
            Button: {
                primaryShadow: "none",
                borderRadius: 10,
            },
            Input: { activeShadow: `0 0 0 3px ${dark ? "rgba(142, 163, 242, 0.14)" : "rgba(76, 99, 210, 0.10)"}` },
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
