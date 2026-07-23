import axios, { type AxiosRequestConfig } from "axios";

import { buildApiUrl, type AiConfig } from "@/stores/use-config-store";

type ScriptRequestOptions = { signal?: AbortSignal };
type PollOptions = { intervalMs?: number; timeoutMs?: number };

export type RunModelScriptArgs = {
    script: string;
    config: AiConfig;
    prompt: string;
    images?: string[];
    params?: Record<string, unknown>;
    signal?: AbortSignal;
};

function sleep(ms: number, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
        if (signal?.aborted) return reject(new DOMException("Aborted", "AbortError"));
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
        }, { once: true });
    });
}

function createPoll(signal?: AbortSignal) {
    return async function poll<T, R>(request: () => Promise<T>, extract: (value: T) => R | null | undefined | false, options?: PollOptions): Promise<R> {
        const intervalMs = options?.intervalMs ?? 2500;
        const deadline = performance.now() + Math.min(options?.timeoutMs ?? 600000, 600000);
        for (;;) {
            if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
            const result = extract(await request());
            if (result !== null && result !== undefined && result !== false) return result;
            if (performance.now() >= deadline) throw new Error("自定义调用脚本轮询超时");
            await sleep(intervalMs, signal);
        }
    };
}

function rawUrl(baseUrl: string, url: string) {
    return /^https?:/i.test(url) ? url : `${baseUrl.trim().replace(/\/+$/, "")}/${url.replace(/^\/+/, "")}`;
}

function createRequest(config: AiConfig, options?: ScriptRequestOptions) {
    return async (requestConfig: AxiosRequestConfig & { url: string }) => {
        const response = await axios.request({ ...requestConfig, url: rawUrl(config.baseUrl, requestConfig.url), signal: options?.signal });
        return response.data;
    };
}

function createHttp(config: AiConfig, options?: ScriptRequestOptions) {
    const run = async (method: "get" | "post", path: string, data?: unknown, requestOptions?: AxiosRequestConfig) => {
        const form = typeof FormData !== "undefined" && data instanceof FormData;
        const response = await axios.request({
            ...requestOptions,
            method,
            url: /^https?:/i.test(path) ? path : buildApiUrl(config.baseUrl, path.startsWith("/") ? path : `/${path}`),
            data: method === "post" ? data : undefined,
            headers: { Authorization: `Bearer ${config.apiKey}`, ...(method === "post" && data !== undefined && !form ? { "Content-Type": "application/json" } : {}), ...requestOptions?.headers },
            signal: options?.signal,
        });
        return response.data;
    };
    return {
        url: (path: string) => /^https?:/i.test(path) ? path : buildApiUrl(config.baseUrl, path.startsWith("/") ? path : `/${path}`),
        get: (path: string, requestOptions?: AxiosRequestConfig) => run("get", path, undefined, requestOptions),
        post: (path: string, data?: unknown, requestOptions?: AxiosRequestConfig) => run("post", path, data, requestOptions),
    };
}

export async function runModelScript<T = unknown>(args: RunModelScriptArgs): Promise<T> {
    const request = createRequest(args.config, { signal: args.signal });
    const http = createHttp(args.config, { signal: args.signal });
    const poll = createPoll(args.signal);
    const runner = new Function(
        "prompt", "images", "params", "model", "baseUrl", "apiKey", "http", "request", "poll", "sleep", "signal",
        `"use strict"; return (async () => {\n${args.script}\n})();`,
    ) as (...values: unknown[]) => Promise<T>;
    try {
        return await runner(args.prompt, args.images || [], args.params || {}, args.config.model, args.config.baseUrl, args.config.apiKey, http, request, poll, (ms: number) => sleep(ms, args.signal), args.signal);
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`自定义调用脚本执行失败：${message}`);
    }
}

export function normalizeModelScriptImages(result: unknown) {
    const images = (Array.isArray(result) ? result : [result]).map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const value = item as Record<string, unknown>;
        if (typeof value.dataUrl === "string") return value.dataUrl;
        if (typeof value.url === "string") return value.url;
        return typeof value.b64_json === "string" ? `data:image/png;base64,${value.b64_json}` : "";
    }).filter(Boolean);
    if (!images.length) throw new Error("自定义调用脚本没有返回图片");
    return images;
}

export const MODEL_SCRIPT_TEMPLATES = {
    image: `// images 为空时生图，有值时改图；最后返回图片 URL、dataURL 或数组。
if (!images.length) {
  const data = await http.post("/images/generations", {
    model, prompt, n: params.count, size: params.size, quality: params.quality,
    response_format: "b64_json",
  });
  return (data.data || []).map((item) => item.b64_json ? \`data:image/png;base64,\${item.b64_json}\` : item.url);
}
const form = new FormData();
form.set("model", model);
form.set("prompt", prompt);
form.set("n", String(params.count));
form.set("response_format", "b64_json");
for (const dataUrl of images) form.append("image", await (await fetch(dataUrl)).blob(), "reference.png");
const data = await http.post("/images/edits", form);
return (data.data || []).map((item) => item.b64_json ? \`data:image/png;base64,\${item.b64_json}\` : item.url);`,
    video: `// 脚本内完成创建和轮询，最后返回视频 URL 或 { url }。
const task = await http.post("/videos", {
  model, prompt, seconds: params.seconds, size: params.size,
  resolution_name: params.resolution,
});
if (task.url || task.video_url) return { url: task.url || task.video_url };
return await poll(
  () => http.get(\`/videos/\${task.id}\`),
  (state) => state.url || state.video_url ? { url: state.url || state.video_url } : null,
  { intervalMs: 2500, timeoutMs: 600000 },
);`,
} as const;
