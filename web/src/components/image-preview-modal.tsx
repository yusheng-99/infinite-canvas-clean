"use client";

import { useCallback, useEffect, useState, type WheelEvent as ReactWheelEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MIN_SCALE = 0.25;
const MAX_SCALE = 6;

function clamp(scale: number) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

export function ImagePreviewModal({
    open,
    src,
    title,
    onClose,
    onPrev,
    onNext,
    counter,
}: {
    open: boolean;
    src?: string;
    title?: string;
    onClose: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    counter?: string;
}) {
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [drag, setDrag] = useState<{ pointerId: number; startX: number; startY: number; originX: number; originY: number } | null>(null);

    useEffect(() => {
        if (!open) {
            setScale(1);
            setOffset({ x: 0, y: 0 });
            setDrag(null);
        }
    }, [open, src]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") onPrev?.();
            if (e.key === "ArrowRight") onNext?.();
        };
        window.addEventListener("keydown", onKey);
        return () => {
            document.body.style.overflow = prev;
            window.removeEventListener("keydown", onKey);
        };
    }, [onClose, onPrev, onNext, open]);

    const handleWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setScale((cur) => {
            const next = clamp(cur * (e.deltaY < 0 ? 1.14 : 1 / 1.14));
            setOffset((off) => {
                if (next <= 1) return { x: 0, y: 0 };
                const ox = e.clientX - rect.left - rect.width / 2 - off.x;
                const oy = e.clientY - rect.top - rect.height / 2 - off.y;
                const r = next / cur;
                return { x: off.x - ox * (r - 1), y: off.y - oy * (r - 1) };
            });
            return next;
        });
    }, []);

    const handlePointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (e.button !== 0 || scale <= 1) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            setDrag({ pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y });
        },
        [offset.x, offset.y, scale],
    );

    const handlePointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (!drag || drag.pointerId !== e.pointerId) return;
            e.preventDefault();
            setOffset({ x: drag.originX + e.clientX - drag.startX, y: drag.originY + e.clientY - drag.startY });
        },
        [drag],
    );

    const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
        setDrag((cur) => (cur?.pointerId === e.pointerId ? null : cur));
    }, []);

    if (!open || !src) return null;

    return (
        <div
            className="fixed inset-0 z-[1000] flex touch-none select-none items-center justify-center overflow-hidden"
            data-canvas-no-zoom
            role="dialog"
            aria-modal="true"
            aria-label="图片预览"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={onClose}
            style={{
                cursor: scale > 1 ? (drag ? "grabbing" : "grab") : "zoom-in",
                background:
                    "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 34%), radial-gradient(circle at 78% 72%, rgba(118,153,215,0.08), transparent 38%), #0c0e12",
            }}
        >
            <img src={src} alt={title || "图片"} draggable={false} className="relative max-h-[92dvh] max-w-[94dvw] object-contain" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }} />
            <div className="pointer-events-none absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
                {Math.round(scale * 100)}%{counter ? ` · ${counter}` : ""}
            </div>
            <button
                type="button"
                className="absolute right-5 top-5 z-10 grid size-9 place-items-center rounded-full border border-white/25 bg-white/15 text-lg leading-none text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition hover:bg-white/25"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                aria-label="关闭图片预览"
            >
                ×
            </button>
            {onPrev ? (
                <button
                    type="button"
                    className="absolute left-4 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition hover:bg-white/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    aria-label="上一张"
                >
                    <ChevronLeft className="size-5" />
                </button>
            ) : null}
            {onNext ? (
                <button
                    type="button"
                    className="absolute right-4 top-1/2 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl transition hover:bg-white/20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    aria-label="下一张"
                >
                    <ChevronRight className="size-5" />
                </button>
            ) : null}
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-medium text-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.18)] backdrop-blur-2xl">滚轮缩放 · 双击关闭</div>
        </div>
    );
}