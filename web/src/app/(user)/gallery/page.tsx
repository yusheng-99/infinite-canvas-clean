"use client";

import { Image as ImageIcon, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { App, Button, Empty, Image, Input, Modal, Select } from "antd";

import { useAssetStore } from "@/stores/use-asset-store";
import { useGalleryStore } from "@/stores/use-gallery-store";
import { readFileAsDataUrl } from "@/lib/image-utils";

export default function GalleryPage() {
    const { message } = App.useApp();
    const fileRef = useRef<HTMLInputElement>(null);
    const items = useGalleryStore((state) => state.items);
    const hydrated = useGalleryStore((state) => state.hydrated);
    const addItem = useGalleryStore((state) => state.addItem);
    const removeItem = useGalleryStore((state) => state.removeItem);
    const assets = useAssetStore((state) => state.assets);
    const [keyword, setKeyword] = useState("");
    const [assetPickerOpen, setAssetPickerOpen] = useState(false);
    const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);

    const imageAssets = useMemo(() => assets.filter((asset) => asset.kind === "image"), [assets]);
    const filtered = useMemo(() => {
        const q = keyword.trim().toLowerCase();
        if (!q) return items;
        return items.filter((item) => `${item.title} ${item.source || ""} ${item.note || ""}`.toLowerCase().includes(q));
    }, [items, keyword]);

    const handleUpload = async (files: FileList | null) => {
        if (!files?.length) return;
        let count = 0;
        for (const file of Array.from(files)) {
            if (!file.type.startsWith("image/")) continue;
            const dataUrl = await readFileAsDataUrl(file);
            await addItem({ title: file.name.replace(/\.[^.]+$/, ""), url: dataUrl, source: "本地上传" });
            count += 1;
        }
        message.success(count ? `已加入 ${count} 张图片` : "没有可导入的图片");
        if (fileRef.current) fileRef.current.value = "";
    };

    const importFromAssets = async () => {
        if (!selectedAssetIds.length) return message.warning("请先选择图片素材");
        let count = 0;
        for (const id of selectedAssetIds) {
            const asset = imageAssets.find((item) => item.id === id);
            if (!asset || asset.kind !== "image") continue;
            await addItem({
                title: asset.title,
                url: asset.data.dataUrl,
                storageKey: asset.data.storageKey,
                width: asset.data.width,
                height: asset.data.height,
                bytes: asset.data.bytes,
                mimeType: asset.data.mimeType,
                source: asset.source || "我的素材",
                note: asset.note,
            });
            count += 1;
        }
        setAssetPickerOpen(false);
        setSelectedAssetIds([]);
        message.success(`已从素材加入 ${count} 张`);
    };

    return (
        <main className="h-full overflow-auto bg-background text-foreground">
            <div className="mx-auto flex min-h-full max-w-[1400px] flex-col px-4 py-6 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[13px] font-medium tracking-[0.08em] text-muted-foreground">GALLERY</p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">画廊</h1>
                        <p className="mt-2 text-sm text-muted-foreground">收藏生成结果，安静地欣赏。</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            allowClear
                            prefix={<Search className="size-3.5 text-muted-foreground" />}
                            placeholder="搜索标题"
                            value={keyword}
                            onChange={(event) => setKeyword(event.target.value)}
                            className="w-full sm:w-56"
                        />
                        <Button onClick={() => setAssetPickerOpen(true)}>从素材导入</Button>
                        <Button type="primary" icon={<Upload className="size-3.5" />} onClick={() => fileRef.current?.click()}>
                            上传图片
                        </Button>
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(event) => void handleUpload(event.target.files)} />
                    </div>
                </header>

                <div className="mt-3 text-xs text-muted-foreground">{hydrated ? `${filtered.length} 张` : "加载中..."}</div>

                {!hydrated ? null : filtered.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center py-24">
                        <Empty description={<span className="text-muted-foreground">还没有画廊图片。可从画布、生图工作台或这里上传加入。</span>}>
                            <Button type="primary" icon={<ImageIcon className="size-3.5" />} onClick={() => fileRef.current?.click()}>
                                上传第一张
                            </Button>
                        </Empty>
                    </div>
                ) : (
                    <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 xl:columns-5">
                        {filtered.map((item, index) => (
                            <div key={item.id} className="hover-float-card group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-card ring-1 ring-border/40 hover:ring-border">
                                <button
                                    type="button"
                                    className="block w-full text-left"
                                    onClick={() => {
                                        setPreviewIndex(index);
                                        setPreviewOpen(true);
                                    }}
                                >
                                    <img src={item.url} alt={item.title} className="block w-full object-cover" loading="lazy" />
                                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-3 pt-8 opacity-0 transition group-hover:opacity-100">
                                        <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="absolute right-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100"
                                    onClick={() => {
                                        Modal.confirm({
                                            title: "移出画廊？",
                                            content: "只从画廊移除，不会影响画布或素材里的原图。",
                                            okText: "移出",
                                            okButtonProps: { danger: true },
                                            cancelText: "取消",
                                            onOk: () => removeItem(item.id),
                                        });
                                    }}
                                    aria-label="移出画廊"
                                >
                                    <Trash2 className="size-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="hidden">
                <Image.PreviewGroup
                    preview={{
                        visible: previewOpen,
                        current: previewIndex,
                        onVisibleChange: (visible) => setPreviewOpen(visible),
                        onChange: (current) => setPreviewIndex(current),
                    }}
                >
                    {filtered.map((item) => (
                        <Image key={item.id} src={item.url} alt={item.title} />
                    ))}
                </Image.PreviewGroup>
            </div>

            <Modal
                title="从我的素材导入"
                open={assetPickerOpen}
                onCancel={() => {
                    setAssetPickerOpen(false);
                    setSelectedAssetIds([]);
                }}
                onOk={() => void importFromAssets()}
                okText="加入画廊"
                cancelText="取消"
                destroyOnHidden
            >
                <Select
                    mode="multiple"
                    className="w-full"
                    placeholder={imageAssets.length ? "选择图片素材" : "暂无图片素材"}
                    value={selectedAssetIds}
                    onChange={setSelectedAssetIds}
                    options={imageAssets.map((asset) => ({ value: asset.id, label: asset.title }))}
                    optionFilterProp="label"
                    showSearch
                />
            </Modal>
        </main>
    );
}