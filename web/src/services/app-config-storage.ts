import type { AiConfig } from "@/stores/use-config-store";

export async function fetchServerAiConfig() {
    const response = await fetch("/api/app-config", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { config?: Partial<AiConfig> | null };
    return data.config || null;
}

export async function saveServerAiConfig(config: AiConfig) {
    await fetch("/api/app-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config }),
    });
}

export function saveServerAiConfigOnUnload(config: AiConfig) {
    const body = JSON.stringify({ config });
    if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        if (navigator.sendBeacon("/api/app-config", blob)) return;
    }
    void fetch("/api/app-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: body.length < 60_000,
    }).catch(() => {});
}
