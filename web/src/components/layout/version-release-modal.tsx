"use client";

import type { CSSProperties } from "react";
import { Empty, Modal, Tag, Timeline } from "antd";
import { useVersionCheck } from "@/hooks/use-version-check";

function getTagColor(type: string) {
    if (type === "新增") return "green";
    if (type === "修复") return "red";
    if (type === "调整") return "blue";
    if (type === "文档") return "purple";
    return "default";
}

function getReleaseTitle(version: string) {
    return version === "Unreleased" ? "未发布" : version;
}

function sameVersion(a?: string, b?: string) {
    return Boolean(a && b && a.replace(/^v/, "") === b.replace(/^v/, ""));
}

type VersionReleaseModalProps = {
    className?: string;
    style?: CSSProperties;
};

function ReleaseTimeline({ releases, currentVersion, latestVersion }: { releases: ReturnType<typeof useVersionCheck>["localReleases"]; currentVersion?: string; latestVersion?: string }) {
    if (!releases.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无更新记录" />;

    return (
        <Timeline
            items={releases.map((release) => ({
                content: (
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-stone-950 dark:text-stone-100">{getReleaseTitle(release.version)}</span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">{release.date}</span>
                            <div className="flex min-w-0 items-center gap-1.5">
                                {sameVersion(release.version, latestVersion) ? <Tag color="green">最新</Tag> : null}
                                {sameVersion(release.version, currentVersion) ? <Tag>当前</Tag> : null}
                            </div>
                            {release.originalVersion ? <span className="ml-auto text-xs text-stone-500 dark:text-stone-400">原项目 {release.originalVersion}</span> : null}
                        </div>
                        <div className="mt-2 space-y-1.5">
                            {release.items.map((item, index) => (
                                <div key={`${release.version}-${index}`} className="flex items-start gap-2 text-sm leading-6 text-stone-700 dark:text-stone-300">
                                    <Tag color={getTagColor(item.type)} className="m-0 mt-0.5 shrink-0 whitespace-nowrap">
                                        {item.type}
                                    </Tag>
                                    <span className="min-w-0 flex-1">{item.content}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ),
            }))}
        />
    );
}

export function VersionReleaseModal({ className, style }: VersionReleaseModalProps) {
    const { open, setOpen, openReleaseModal, localVersion, localReleases, upstreamVersion, upstreamReleases, checking, checkUpstreamRelease } = useVersionCheck();

    return (
        <>
            <button
                type="button"
                className={className || "shrink-0 cursor-pointer text-xs font-medium text-stone-500 transition hover:text-stone-950 dark:text-stone-400 dark:hover:text-white"}
                style={style}
                onClick={openReleaseModal}
                title="查看版本更新"
            >
                {localVersion}
            </button>
            <Modal title="版本更新" open={open} width={720} centered footer={null} onCancel={() => setOpen(false)}>
                <div className="mb-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
                        <div className="text-xs text-stone-500 dark:text-stone-400">本地精简版</div>
                        <div className="mt-1 text-base font-semibold text-stone-950 dark:text-stone-100">{localVersion}</div>
                    </div>
                    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-stone-500 dark:text-stone-400">原项目最新版本</div>
                            <button
                                type="button"
                                className="cursor-pointer bg-transparent p-0 text-[11px] font-normal text-stone-400 underline-offset-2 transition hover:text-stone-700 hover:underline dark:text-stone-500 dark:hover:text-stone-300"
                                onClick={() => void checkUpstreamRelease(true)}
                            >
                                {checking ? "检查中..." : "检查原项目"}
                            </button>
                        </div>
                        <div className="mt-1 text-base font-semibold text-stone-950 dark:text-stone-100">{upstreamVersion || "未获取"}</div>
                    </div>
                </div>
                <div className="max-h-[58vh] overflow-y-auto pr-2">
                    <div className="mb-3 text-sm font-semibold text-stone-950 dark:text-stone-100">本地精简版更新</div>
                    <ReleaseTimeline releases={localReleases} currentVersion={localVersion} />
                    <div className="mb-3 mt-6 flex items-center justify-between gap-3 border-t border-stone-200 pt-5 text-sm font-semibold text-stone-950 dark:border-stone-800 dark:text-stone-100">
                        <span>原项目更新</span>
                        <span className="text-xs font-normal text-stone-500 dark:text-stone-400">仅供参考，不与本地版本号比较</span>
                    </div>
                    <ReleaseTimeline releases={upstreamReleases} latestVersion={upstreamVersion} />
                </div>
            </Modal>
        </>
    );
}
