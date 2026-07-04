"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Modal, Pagination, Popconfirm, Space, Tag, Typography } from "antd";
import { Eye, PencilLine, Plus, Search, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/image-utils";
import { useAssetStore, type Asset } from "@/stores/use-asset-store";

export type InsertAssetPayload =
    | { kind: "text"; content: string; title: string }
    | { kind: "image"; dataUrl: string; title: string; storageKey?: string; prompt?: string }
    | { kind: "video"; url: string; title: string; storageKey?: string; width?: number; height?: number; prompt?: string };

type Props = {
    open: boolean;
    defaultTab?: string;
    onInsert: (payload: InsertAssetPayload) => void;
    onClose: () => void;
};

export function AssetPickerModal({ open, onInsert, onClose }: Props) {
    return (
        <Modal title="选择素材" open={open} onCancel={onClose} footer={null} width={860} destroyOnHidden styles={{ body: { padding: "0 24px 24px", minHeight: 480 } }}>
            <MyAssetsTab onInsert={onInsert} />
        </Modal>
    );
}

const PAGE_SIZE = 8;

const kindOptions = [
    { label: "全部", value: "all" },
    { label: "文本", value: "text" },
    { label: "图片", value: "image" },
    { label: "视频", value: "video" },
];

function PickerCard({ asset, onOpen, onInsert, onRename, onDelete }: { asset: Asset; onOpen: () => void; onInsert: () => void; onRename: () => void; onDelete: () => void }) {
    const cover = asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "");
    return (
        <div
            role="button"
            tabIndex={0}
            className="group relative cursor-pointer overflow-hidden rounded-lg border border-stone-200 bg-white text-left transition hover:border-stone-400 hover:shadow-md dark:border-stone-700 dark:bg-stone-900 dark:hover:border-stone-500"
            onClick={onOpen}
            onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                onOpen();
            }}
        >
            {cover ? (
                <img src={cover} alt={asset.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-stone-100 p-3 text-center text-xs leading-5 text-stone-500 dark:bg-stone-800 dark:text-stone-400">{asset.kind === "text" ? asset.data.content : asset.title}</div>
            )}
            <div className="p-2.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-xs font-medium text-stone-800 dark:text-stone-200">{asset.title}</span>
                    <Tag className="m-0 shrink-0 text-[10px]">{asset.kind === "image" ? "图片" : asset.kind === "video" ? "视频" : "文本"}</Tag>
                </div>
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-950/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-stone-950/55 group-hover:opacity-100">
                <Eye className="mr-1 size-4" />
                查看
            </div>
            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow hover:bg-white dark:bg-stone-900/90 dark:text-stone-200"
                    onClick={(event) => {
                        event.stopPropagation();
                        onInsert();
                    }}
                    title="插入"
                >
                    <Plus className="size-3.5" />
                </button>
                <button
                    type="button"
                    className="inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow hover:bg-white dark:bg-stone-900/90 dark:text-stone-200"
                    onClick={(event) => {
                        event.stopPropagation();
                        onRename();
                    }}
                    title="重命名"
                >
                    <PencilLine className="size-3.5" />
                </button>
                <Popconfirm title="删除素材" description={`确定删除「${asset.title}」吗？`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={onDelete}>
                    <button
                        type="button"
                        className="inline-flex size-7 items-center justify-center rounded-full bg-white/90 text-red-500 shadow hover:bg-white dark:bg-stone-900/90"
                        onClick={(event) => event.stopPropagation()}
                        title="删除"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </Popconfirm>
            </div>
        </div>
    );
}

function MyAssetsTab({ onInsert }: { onInsert: (payload: InsertAssetPayload) => void }) {
    const assets = useAssetStore((state) => state.assets);
    const updateAsset = useAssetStore((state) => state.updateAsset);
    const removeAsset = useAssetStore((state) => state.removeAsset);
    const [keyword, setKeyword] = useState("");
    const [kindFilter, setKindFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
    const [renamingAsset, setRenamingAsset] = useState<Asset | null>(null);

    const filtered = useMemo(() => {
        const query = keyword.trim().toLowerCase();
        return assets
            .filter((a) => a.kind === "text" || a.kind === "image" || a.kind === "video")
            .filter((a) => kindFilter === "all" || a.kind === kindFilter)
            .filter((a) => !query || assetSearchText(a).includes(query));
    }, [assets, keyword, kindFilter]);

    const visible = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

    useEffect(() => {
        const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        setPage((v) => Math.min(v, maxPage));
    }, [filtered.length]);

    const handleInsert = (asset: Asset) => {
        if (asset.kind === "text") {
            onInsert({ kind: "text", content: asset.data.content, title: asset.title });
        } else {
            const prompt = getAssetPrompt(asset);
            onInsert(asset.kind === "video" ? { kind: "video", url: asset.data.url, storageKey: asset.data.storageKey, title: asset.title, width: asset.data.width, height: asset.data.height, prompt } : { kind: "image", dataUrl: asset.data.dataUrl, storageKey: asset.data.storageKey, title: asset.title, prompt });
        }
    };

    const handleDelete = (asset: Asset) => {
        removeAsset(asset.id);
        setPreviewAsset((current) => (current?.id === asset.id ? null : current));
        setRenamingAsset((current) => (current?.id === asset.id ? null : current));
    };

    const handleRename = (asset: Asset, title: string) => {
        const nextTitle = title.trim();
        if (!nextTitle) return;
        updateAsset(asset.id, { title: nextTitle });
        setPreviewAsset((current) => (current?.id === asset.id ? { ...current, title: nextTitle, updatedAt: new Date().toISOString() } : current));
        setRenamingAsset(null);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
                <Input
                    className="w-56"
                    size="small"
                    prefix={<Search className="size-3.5 text-stone-400" />}
                    placeholder="搜索素材"
                    value={keyword}
                    allowClear
                    onChange={(e) => {
                        setPage(1);
                        setKeyword(e.target.value);
                    }}
                />
                <div className="flex gap-1.5">
                    {kindOptions.map((opt) => (
                        <Tag.CheckableTag
                            key={opt.value}
                            checked={kindFilter === opt.value}
                            className={cn("filter-tag", kindFilter === opt.value && "is-active")}
                            onChange={() => {
                                setPage(1);
                                setKindFilter(opt.value);
                            }}
                        >
                            {opt.label}
                        </Tag.CheckableTag>
                    ))}
                </div>
            </div>

            {visible.length ? (
                <div className="grid grid-cols-4 gap-3">
                    {visible.map((asset) => (
                        <PickerCard key={asset.id} asset={asset} onOpen={() => setPreviewAsset(asset)} onInsert={() => handleInsert(asset)} onRename={() => setRenamingAsset(asset)} onDelete={() => handleDelete(asset)} />
                    ))}
                </div>
            ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有素材" className="py-12" />
            )}

            {filtered.length > PAGE_SIZE && (
                <div className="flex justify-center">
                    <Pagination size="small" current={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} showSizeChanger={false} />
                </div>
            )}
            <AssetPreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} onInsert={handleInsert} onRename={setRenamingAsset} onDelete={handleDelete} />
            <RenameAssetModal asset={renamingAsset} onClose={() => setRenamingAsset(null)} onRename={handleRename} />
        </div>
    );
}

function AssetPreviewModal({ asset, onClose, onInsert, onRename, onDelete }: { asset: Asset | null; onClose: () => void; onInsert: (asset: Asset) => void; onRename: (asset: Asset) => void; onDelete: (asset: Asset) => void }) {
    const prompt = asset ? getAssetPrompt(asset) : "";
    const cover = asset ? asset.coverUrl || (asset.kind === "image" ? asset.data.dataUrl : "") : "";
    return (
        <Modal title="素材详情" open={Boolean(asset)} onCancel={onClose} footer={null} width={860} destroyOnHidden>
            {asset ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="min-w-0 space-y-4">
                        {asset.kind === "video" ? (
                            <video src={asset.data.url} controls className="aspect-video w-full rounded-lg bg-black" />
                        ) : cover ? (
                            <img src={cover} alt={asset.title} className="max-h-[56vh] w-full rounded-lg object-contain bg-stone-950" />
                        ) : (
                            <div className="max-h-[56vh] overflow-auto rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-700 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">{asset.kind === "text" ? asset.data.content : "暂无预览"}</div>
                        )}
                        {prompt ? (
                            <div className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
                                <Typography.Text type="secondary" className="block text-xs">
                                    完整提示词
                                </Typography.Text>
                                <Typography.Paragraph className="!mb-0 !mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6">{prompt}</Typography.Paragraph>
                            </div>
                        ) : null}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Typography.Title level={5} className="!mb-2">
                                {asset.title}
                            </Typography.Title>
                            <Space size={[4, 4]} wrap>
                                <Tag>{asset.kind === "image" ? "图片" : asset.kind === "video" ? "视频" : "文本"}</Tag>
                                {(asset.tags || []).map((tag) => (
                                    <Tag key={tag}>{tag}</Tag>
                                ))}
                            </Space>
                        </div>
                        <div className="rounded-lg border border-stone-200 p-3 text-xs leading-6 text-stone-500 dark:border-stone-800 dark:text-stone-400">
                            <div>来源：{asset.source || "未标注"}</div>
                            {asset.kind === "image" || asset.kind === "video" ? <div>尺寸：{asset.data.width}x{asset.data.height}</div> : null}
                            {asset.kind === "image" || asset.kind === "video" ? <div>大小：{formatBytes(asset.data.bytes)}</div> : null}
                            {asset.kind === "image" || asset.kind === "video" ? <div>类型：{asset.data.mimeType}</div> : null}
                        </div>
                        {asset.note ? <Typography.Paragraph className="whitespace-pre-wrap text-sm text-stone-600 dark:text-stone-300">{asset.note}</Typography.Paragraph> : null}
                        <Space wrap>
                            <Button type="primary" icon={<Plus className="size-4" />} onClick={() => onInsert(asset)}>
                                插入
                            </Button>
                            <Button icon={<PencilLine className="size-4" />} onClick={() => onRename(asset)}>
                                重命名
                            </Button>
                            <Popconfirm title="删除素材" description={`确定删除「${asset.title}」吗？`} okText="删除" cancelText="取消" okButtonProps={{ danger: true }} onConfirm={() => onDelete(asset)}>
                                <Button danger icon={<Trash2 className="size-4" />}>
                                    删除
                                </Button>
                            </Popconfirm>
                        </Space>
                    </div>
                </div>
            ) : null}
        </Modal>
    );
}

function RenameAssetModal({ asset, onClose, onRename }: { asset: Asset | null; onClose: () => void; onRename: (asset: Asset, title: string) => void }) {
    const [title, setTitle] = useState("");

    useEffect(() => {
        setTitle(asset?.title || "");
    }, [asset]);

    const nextTitle = title.trim();
    return (
        <Modal
            title="重命名素材"
            open={Boolean(asset)}
            onCancel={onClose}
            onOk={() => {
                if (asset) onRename(asset, title);
            }}
            okText="保存"
            cancelText="取消"
            okButtonProps={{ disabled: !nextTitle || nextTitle === asset?.title }}
            destroyOnHidden
        >
            <Input
                autoFocus
                value={title}
                placeholder="输入新的素材名称"
                maxLength={80}
                showCount
                onChange={(event) => setTitle(event.target.value)}
                onPressEnter={() => {
                    if (asset && nextTitle && nextTitle !== asset.title) onRename(asset, title);
                }}
            />
        </Modal>
    );
}

function getAssetPrompt(asset: Asset) {
    const metadata = asset.metadata || {};
    return stringValue(metadata.prompt) || stringValue(metadata.fullPrompt) || stringValue(metadata.composerContent) || stringValue(metadata.generationPrompt);
}

function assetSearchText(asset: Asset) {
    return [asset.title, asset.source || "", asset.note || "", (asset.tags || []).join(" "), getAssetPrompt(asset), asset.kind === "text" ? asset.data.content : asset.data.mimeType].join(" ").toLowerCase();
}

function stringValue(value: unknown) {
    return typeof value === "string" ? value.trim() : "";
}
