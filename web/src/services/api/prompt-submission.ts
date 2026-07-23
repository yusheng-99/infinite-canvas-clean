export type PromptSubmissionPayload = {
    title: string;
    content: string;
    tags: string[];
    images: string[];
    contributor: string;
    notes: string;
    action: "create";
    targetId: null;
    variantIndex: null;
    originalTitle: null;
    submissionType: "全新投稿";
};

const submitEndpoints = ["https://nanobanana-website.vercel.app/api/submit", "https://bmzxdlj.cn/api/submit"];
const imgbbApiKey = "d24f035fac70f7c113badcb1f800b248";

export async function uploadPromptSubmissionImage(blob: Blob) {
    try {
        return await uploadToCatbox(blob);
    } catch {
        const formData = new FormData();
        formData.append("image", blob, `infinite-canvas-${Date.now()}.${blob.type.split("/")[1] || "png"}`);
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, { method: "POST", body: formData });
        const result = await readJson(response);
        const url = (result.data as { url?: string } | undefined)?.url || "";
        if (!response.ok || !url) throw new Error(String(result.error || "图片上传失败"));
        return url;
    }
}

async function uploadToCatbox(blob: Blob) {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", blob, `infinite-canvas-${Date.now()}.${blob.type.split("/")[1] || "png"}`);
    const response = await fetch("/api/catbox-upload", { method: "POST", body: formData });
    const url = (await response.text()).trim();
    if (!response.ok || !/^https?:\/\//i.test(url)) throw new Error(url || "图片上传失败");
    return url;
}

export async function submitPrompt(payload: PromptSubmissionPayload) {
    let error = "投稿服务暂不可用";
    for (const endpoint of submitEndpoints) {
        try {
            const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const result = await readJson(response);
            if (response.ok && result.success !== false) return result;
            error = String(result.error || result.message || `投稿失败（${response.status}）`);
            if (response.status < 500) break;
        } catch (reason) {
            error = reason instanceof Error ? reason.message : "投稿失败";
        }
    }
    throw new Error(error);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
    const text = await response.text();
    if (!text) return {};
    try { return JSON.parse(text) as Record<string, unknown>; } catch { return { error: text }; }
}
