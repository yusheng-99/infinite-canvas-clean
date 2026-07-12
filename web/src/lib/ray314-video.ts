import { modelOptionName, resolveModelRequestConfig, type AiConfig } from "@/stores/use-config-store";

export const ray314ResolutionOptions = [
    { value: "720", label: "720p" },
    { value: "1080", label: "1080p" },
    { value: "2160", label: "4K" },
] as const;

export const ray314RatioOptions = [
    { value: "16:9", label: "横屏" },
    { value: "9:16", label: "竖屏" },
    { value: "1:1", label: "方形" },
    { value: "4:3", label: "标准横屏" },
    { value: "3:4", label: "标准竖屏" },
    { value: "21:9", label: "宽银幕" },
    { value: "9:21", label: "长竖屏" },
] as const;

export const ray314DurationOptions = [5, 10] as const;

const sizesByRatio: Record<(typeof ray314RatioOptions)[number]["value"], string> = {
    "21:9": "1680x720",
    "16:9": "1280x720",
    "4:3": "960x720",
    "1:1": "720x720",
    "3:4": "720x960",
    "9:16": "720x1280",
    "9:21": "720x1680",
};

export function isRay314VideoModel(model: string) {
    return modelOptionName(model).trim().toLowerCase() === "firefly-ray314";
}

export function isRay314VideoConfig(config: AiConfig | Pick<AiConfig, "model" | "videoModel" | "baseUrl">) {
    const requestConfig = "channels" in config ? resolveModelRequestConfig(config, config.model || config.videoModel) : config;
    return isRay314VideoModel(requestConfig.model || requestConfig.videoModel);
}

export function normalizeRay314Resolution(value: string) {
    const resolution = String(value || "").trim().toLowerCase().replace(/p$/i, "");
    if (["4k", "2160"].includes(resolution)) return "2160";
    if (resolution === "1080") return "1080";
    return "720";
}

export function normalizeRay314Duration(value: string) {
    return Number(value) >= 8 ? 10 : 5;
}

export function normalizeRay314Ratio(value: string) {
    if (ray314RatioOptions.some((item) => item.value === value)) return value as (typeof ray314RatioOptions)[number]["value"];
    const match = String(value || "").match(/^(\d+)x(\d+)$/);
    if (!match) return "16:9";
    const ratio = Number(match[1]) / Number(match[2]);
    return ray314RatioOptions.reduce((best, item) => (
        Math.abs(ratio - Number(item.value.split(":")[0]) / Number(item.value.split(":")[1])) < Math.abs(ratio - Number(best.value.split(":")[0]) / Number(best.value.split(":")[1])) ? item : best
    )).value;
}

export function normalizeRay314Size(value: string) {
    return sizesByRatio[normalizeRay314Ratio(value)];
}
