"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Send, UploadCloud } from "lucide-react";
import { App, Button, Image, Input, Modal, Select, Upload } from "antd";

import { usePromptLibrary } from "@/components/prompts/use-prompt-library";
import { getImageBlob, resolveImageUrl } from "@/services/image-storage";
import { submitPrompt, uploadPromptSubmissionImage, type PromptSubmissionPayload } from "@/services/api/prompt-submission";
import type { CanvasNodeData } from "../types";

const contributorKey = "infinite-canvas:prompt-submission-contributor";

export function CanvasPromptSubmissionModal({ node, open, onClose }: { node: CanvasNodeData | null; open: boolean; onClose: () => void }) {
    const { message } = App.useApp();
    const { prompts } = usePromptLibrary(open);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [contributor, setContributor] = useState("");
    const [notes, setNotes] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [replacement, setReplacement] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const tagOptions = useMemo(() => Array.from(new Set(prompts.flatMap((prompt) => prompt.tags || []))).sort((a, b) => a.localeCompare(b, "zh-CN")).map((value) => ({ value, label: value })), [prompts]);

    useEffect(() => {
        if (!open || !node) return;
        const prompt = node.metadata?.prompt?.trim() || "";
        const firstLine = prompt.split(/\r?\n/).find((line) => line.trim())?.trim() || "未命名投稿";
        setTitle((node.title && !/^(New Generation(?:\s|$)|图片(?:\s|$)|画布图片$)/.test(node.title) ? node.title : firstLine).slice(0, 80));
        setContent(prompt);
        setContributor(window.localStorage.getItem(contributorKey) || "");
        setNotes(node.metadata?.model ? `生成模型：${node.metadata.model}` : "");
        setTags([]);
        setImageUrl("");
        setReplacement(null);
        void resolveImageUrl(node.metadata?.storageKey, node.metadata?.content || "").then(setPreviewUrl);
    }, [node, open]);

    useEffect(() => {
        if (!replacement) return;
        const url = URL.createObjectURL(replacement);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [replacement]);

    const submit = async () => {
        if (!node || !title.trim() || !content.trim()) return message.warning("标题和提示词不能为空");
        setSubmitting(true);
        try {
            let publishedImage = imageUrl.trim();
            if (!publishedImage) {
                const blob = replacement || (node.metadata?.storageKey ? await getImageBlob(node.metadata.storageKey) : previewUrl ? await (await fetch(previewUrl)).blob() : null);
                if (!blob) throw new Error("没有找到可投稿的图片");
                publishedImage = await uploadPromptSubmissionImage(blob);
            }
            if (!/^https?:\/\//i.test(publishedImage)) throw new Error("请填写有效的公网图片链接");
            const payload: PromptSubmissionPayload = { title: title.trim(), content: content.trim(), tags, images: [publishedImage], contributor: contributor.trim() || "匿名", notes: notes.trim(), action: "create", targetId: null, variantIndex: null, originalTitle: null, submissionType: "全新投稿" };
            await submitPrompt(payload);
            window.localStorage.setItem(contributorKey, contributor.trim());
            message.success("投稿已提交，等待管理员审核");
            onClose();
        } catch (error) {
            message.error(error instanceof Error ? error.message : "投稿失败");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal title={<div><div className="text-lg font-semibold">一键投稿</div><div className="mt-0.5 text-xs font-normal text-muted-foreground">投稿到 nanobanana-website</div></div>} open={open && Boolean(node)} width={820} centered onCancel={onClose} footer={<><Button onClick={onClose}>取消</Button><Button type="primary" icon={<Send className="size-4" />} loading={submitting} onClick={() => void submit()}>提交投稿</Button></>}>
            <div className="grid gap-5 pt-2 md:grid-cols-[260px_minmax(0,1fr)]">
                <section className="space-y-3">
                    <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">{previewUrl ? <Image src={previewUrl} alt="投稿图片" width="100%" height="100%" className="object-contain" preview /> : <div className="grid size-full place-items-center text-muted-foreground"><ImagePlus className="size-9" /></div>}</div>
                    <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { setReplacement(file); setImageUrl(""); return false; }}><Button block icon={<UploadCloud className="size-4" />}>替换投稿图片</Button></Upload>
                    <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="或填写公网图片链接" />
                </section>
                <section className="space-y-4">
                    <label className="block"><span className="mb-1.5 block text-sm font-medium">标题</span><Input value={title} maxLength={80} showCount onChange={(event) => setTitle(event.target.value)} /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-medium">投稿人 ID</span><Input value={contributor} placeholder="不填则为匿名" onChange={(event) => setContributor(event.target.value)} /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-medium">提示词</span><Input.TextArea value={content} rows={7} onChange={(event) => setContent(event.target.value)} /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-medium">标签</span><Select mode="tags" className="w-full" value={tags} options={tagOptions} tokenSeparators={[",", "，", " "]} placeholder="选择或输入标签" onChange={setTags} /></label>
                    <label className="block"><span className="mb-1.5 block text-sm font-medium">投稿备注</span><Input.TextArea value={notes} rows={3} placeholder="可填写模型、使用技巧或注意事项" onChange={(event) => setNotes(event.target.value)} /></label>
                </section>
            </div>
        </Modal>
    );
}
