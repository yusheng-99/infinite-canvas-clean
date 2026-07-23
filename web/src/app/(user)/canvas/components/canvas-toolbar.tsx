import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode, RefObject } from "react";
import { useRef, useState } from "react";
import { Button, Popover, Segmented, Switch } from "antd";
import { CircleDot, Eraser, FolderOpen, FolderPlus, Grid2x2, Hand, Image as ImageIcon, Info, Moon, Music2, Palette, Redo2, Settings2, Square, Sun, Trash2, Type, Undo2, Upload, Video } from "lucide-react";

import { canvasThemes, type CanvasBackgroundMode, type CanvasColorTheme, type CanvasTheme } from "@/lib/canvas-theme";
import { useThemeStore } from "@/stores/use-theme-store";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import type { CanvasLayoutAction } from "../utils/canvas-layout";

export function CanvasToolbar({
    selectedCount,
    nodeCount,
    canUndo,
    canRedo,
    backgroundMode,
    showImageInfo,
    onAddImage,
    onAddVideo,
    onAddAudio,
    onAddText,
    onAddConfig,
    onUndo,
    onRedo,
    onUpload,
    onSaveNodeGroup,
    onAutoLayout,
    onAlign,
    onDelete,
    onClear,
    onDeselect,
    onBackgroundModeChange,
    onShowImageInfoChange,
    onOpenMyAssets,
}: {
    selectedCount: number;
    nodeCount: number;
    canUndo: boolean;
    canRedo: boolean;
    backgroundMode: CanvasBackgroundMode;
    showImageInfo: boolean;
    onAddImage: () => void;
    onAddVideo: () => void;
    onAddAudio: () => void;
    onAddText: () => void;
    onAddConfig: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onUpload: () => void;
    onSaveNodeGroup: () => void;
    onAutoLayout: (scope: "selected" | "all") => void;
    onAlign: (action: CanvasLayoutAction) => void;
    onDelete: () => void;
    onClear: () => void;
    onDeselect: () => void;
    onBackgroundModeChange: (mode: CanvasBackgroundMode) => void;
    onShowImageInfoChange: (show: boolean) => void;
    onOpenMyAssets: () => void;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const colorTheme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const theme = canvasThemes[colorTheme];
    const [hovered, setHovered] = useState<string | null>(null);
    const [tipX, setTipX] = useState(0);

    const dockStyle = {
        background: theme.toolbar.panel,
        borderColor: theme.toolbar.border,
        color: theme.toolbar.item,
        boxShadow: colorTheme === "dark" ? "0 12px 32px rgba(0,0,0,.30)" : "0 8px 24px rgba(15,23,42,.08)",
    };
    const hoverStyle = { background: theme.toolbar.itemHover, color: theme.toolbar.activeText };
    const activeStyle = { background: theme.toolbar.activeBg, color: theme.toolbar.activeText };
    const tip = hovered ? toolLabel(hovered) : "";

    const appearanceContent = (
        <div className="flex flex-col gap-3 p-1 min-w-[200px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>主题色彩</span>
                <AnimatedThemeToggler />
            </div>
            <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2">
                <span className="text-xs text-muted-foreground">背景纹理</span>
                <Segmented
                    size="small"
                    value={backgroundMode}
                    options={[
                        { label: "点阵", value: "dots", icon: <CircleDot className="size-3.5 inline mr-1" /> },
                        { label: "网格", value: "lines", icon: <Grid2x2 className="size-3.5 inline mr-1" /> },
                        { label: "纯色", value: "blank", icon: <Square className="size-3.5 inline mr-1" /> },
                    ]}
                    onChange={(val) => onBackgroundModeChange(val as CanvasBackgroundMode)}
                />
            </div>
            <div className="flex items-center justify-between border-t border-border/40 pt-2 text-xs">
                <span>显示节点尺寸与元数据</span>
                <Switch size="small" checked={showImageInfo} onChange={onShowImageInfoChange} />
            </div>
        </div>
    );

    const layoutContent = (
        <div className="flex flex-col gap-2 p-1 min-w-[180px]">
            <span className="text-xs text-muted-foreground">自动整理</span>
            <div className="flex gap-2">
                <Button size="small" className="flex-1 text-xs" onClick={() => onAutoLayout("all")}>
                    全部节点
                </Button>
                {selectedCount > 1 ? (
                    <Button size="small" className="flex-1 text-xs" onClick={() => onAutoLayout("selected")}>
                        选中节点
                    </Button>
                ) : null}
            </div>
            {selectedCount > 1 ? (
                <div className="flex flex-col gap-1.5 border-t border-border/40 pt-2">
                    <span className="text-xs text-muted-foreground">对齐选中节点</span>
                    <div className="grid grid-cols-3 gap-1">
                        <Button size="small" onClick={() => onAlign("left")}>左对齐</Button>
                        <Button size="small" onClick={() => onAlign("center-x")}>水平居中</Button>
                        <Button size="small" onClick={() => onAlign("right")}>右对齐</Button>
                        <Button size="small" onClick={() => onAlign("top")}>顶对齐</Button>
                        <Button size="small" onClick={() => onAlign("center-y")}>垂直居中</Button>
                        <Button size="small" onClick={() => onAlign("bottom")}>底对齐</Button>
                    </div>
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-50 flex max-w-[calc(100%-32px)] -translate-x-1/2 justify-center">
            {tip ? <DockTip label={tip} x={tipX} theme={theme} /> : null}
            <div ref={wrapRef} className="thin-scrollbar pointer-events-auto flex h-11 max-w-full items-center gap-1 overflow-x-auto rounded-full border px-2 backdrop-blur-md transition-all [&>*]:shrink-0" style={dockStyle}>
                <ToolbarButton id="tool-hand" label="选择模式" active={!selectedCount} hovered={hovered} activeStyle={activeStyle} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onDeselect}>
                    <Hand className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-undo" label="撤销" disabled={!canUndo} hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onUndo}>
                    <Undo2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-redo" label="重做" disabled={!canRedo} hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onRedo}>
                    <Redo2 className="size-4" />
                </ToolbarButton>
                <Divider theme={theme} />
                <ToolbarButton id="tool-text" label="文本" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onAddText}>
                    <Type className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-image" label="图片" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onAddImage}>
                    <ImageIcon className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-video" label="视频" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onAddVideo}>
                    <Video className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-audio" label="音频" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onAddAudio}>
                    <Music2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-config" label="生成配置" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onAddConfig}>
                    <Settings2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton id="tool-upload" label="上传素材" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onUpload}>
                    <Upload className="size-4" />
                </ToolbarButton>
                <Divider theme={theme} />
                <ToolbarButton id="tool-assets" label="我的素材" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onOpenMyAssets}>
                    <FolderOpen className="size-4" />
                </ToolbarButton>

                <Popover content={appearanceContent} trigger="click" placement="top">
                    <div className="inline-flex">
                        <ToolbarButton id="tool-style" label="外观设置" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={() => {}}>
                            <Palette className="size-4" />
                        </ToolbarButton>
                    </div>
                </Popover>

                <Popover content={layoutContent} trigger="click" placement="top">
                    <div className="inline-flex">
                        <ToolbarButton id="tool-layout" label="整理布局" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={() => {}}>
                            <Grid2x2 className="size-4" />
                        </ToolbarButton>
                    </div>
                </Popover>

                {selectedCount ? (
                    <>
                        <Divider theme={theme} />
                        <ToolbarButton id="tool-save-group" label="存为节点组" hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onSaveNodeGroup}>
                            <FolderPlus className="size-4" />
                        </ToolbarButton>
                        <ToolbarButton id="tool-delete" label={`删除 (${selectedCount})`} hovered={hovered} hoverStyle={hoverStyle} wrapRef={wrapRef} onTipX={setTipX} onHover={setHovered} onClick={onDelete}>
                            <Trash2 className="size-4 text-destructive" />
                        </ToolbarButton>
                    </>
                ) : null}
            </div>
        </div>
    );
}

function Divider({ theme }: { theme: CanvasTheme }) {
    return <div className="h-4 w-[1px] shrink-0 my-auto opacity-40" style={{ background: theme.toolbar.border }} />;
}

function ToolbarButton({
    id,
    label,
    active,
    disabled,
    hovered,
    activeStyle,
    hoverStyle,
    wrapRef,
    onTipX,
    onHover,
    onClick,
    children,
}: {
    id: string;
    label: string;
    active?: boolean;
    disabled?: boolean;
    hovered: string | null;
    activeStyle?: CSSProperties;
    hoverStyle?: CSSProperties;
    wrapRef: RefObject<HTMLDivElement | null>;
    onTipX: (x: number) => void;
    onHover: (id: string | null) => void;
    onClick: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    children: ReactNode;
}) {
    const isHovered = hovered === id;
    const style = active ? activeStyle : isHovered ? hoverStyle : undefined;

    return (
        <button
            type="button"
            disabled={disabled}
            className={`relative flex size-8 items-center justify-center rounded-full transition-colors duration-150 ${disabled ? "opacity-35 cursor-not-allowed" : "cursor-pointer"}`}
            style={style}
            onMouseEnter={(e) => {
                if (disabled) return;
                onHover(id);
                onTipX(getTipX(wrapRef.current, e.currentTarget));
            }}
            onMouseLeave={() => onHover(null)}
            onClick={onClick}
            aria-label={label}
        >
            {children}
        </button>
    );
}

function DockTip({ label, x, theme }: { label: string; x: number; theme: CanvasTheme }) {
    return (
        <div
            className="pointer-events-none absolute -top-9 z-10 flex -translate-x-1/2 items-center rounded-md px-2 py-1 text-xs font-medium backdrop-blur-sm transition-all duration-150 shadow-sm border"
            style={{
                left: `${x}px`,
                background: theme.toolbar.panel,
                borderColor: theme.toolbar.border,
                color: theme.toolbar.item,
            }}
        >
            {label}
        </div>
    );
}

function getTipX(container: HTMLDivElement | null, button: HTMLElement) {
    if (!container) return 0;
    const cRect = container.getBoundingClientRect();
    const bRect = button.getBoundingClientRect();
    return bRect.left + bRect.width / 2 - cRect.left;
}

function toolLabel(id: string) {
    switch (id) {
        case "tool-hand": return "选择/移动";
        case "tool-undo": return "撤销";
        case "tool-redo": return "重做";
        case "tool-text": return "添加文本";
        case "tool-image": return "添加图片";
        case "tool-video": return "添加视频";
        case "tool-audio": return "添加音频";
        case "tool-config": return "生成配置";
        case "tool-upload": return "上传本地素材";
        case "tool-assets": return "我的素材";
        case "tool-style": return "外观设置";
        case "tool-layout": return "整理布局";
        case "tool-save-group": return "存为节点组";
        case "tool-delete": return "删除选中";
        default: return "";
    }
}
