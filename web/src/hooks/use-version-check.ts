import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import { APP_VERSION } from "@/constant/env";
import { parseChangelog, type ReleaseInfo } from "@/lib/release";

const upstreamVersionUrl = "https://raw.githubusercontent.com/basketikun/infinite-canvas/main/VERSION";
const upstreamChangelogUrl = "https://raw.githubusercontent.com/basketikun/infinite-canvas/main/CHANGELOG.md";

function readLocalReleases(): ReleaseInfo[] {
    return Array.isArray(__APP_RELEASES__) ? __APP_RELEASES__ : [];
}

export function useVersionCheck() {
    const { message } = App.useApp();
    const localReleases = useMemo(readLocalReleases, []);
    const [upstreamVersion, setUpstreamVersion] = useState("");
    const [upstreamReleases, setUpstreamReleases] = useState<ReleaseInfo[]>([]);
    const [checking, setChecking] = useState(false);
    const [open, setOpen] = useState(false);

    const checkUpstreamVersion = useCallback(async () => {
        try {
            const response = await fetch(upstreamVersionUrl);
            if (!response.ok) return false;
            setUpstreamVersion((await response.text()).trim());
            return true;
        } catch {
            return false;
        }
    }, []);

    const checkUpstreamRelease = useCallback(
        async (showMessage = false) => {
            setChecking(true);
            try {
                const [versionResponse, changelogResponse] = await Promise.all([fetch(upstreamVersionUrl), fetch(upstreamChangelogUrl)]);
                if (!versionResponse.ok) throw new Error("版本读取失败");
                if (!changelogResponse.ok) throw new Error("更新日志读取失败");
                const [version, changelog] = await Promise.all([versionResponse.text(), changelogResponse.text()]);
                setUpstreamVersion(version.trim());
                setUpstreamReleases(parseChangelog(changelog));
                if (showMessage) message.success("已获取原项目更新信息");
                return true;
            } catch {
                if (showMessage) message.error("获取原项目更新信息失败");
                return false;
            } finally {
                setChecking(false);
            }
        },
        [message],
    );

    useEffect(() => {
        void checkUpstreamVersion();
    }, [checkUpstreamVersion]);

    const openReleaseModal = useCallback(() => {
        setOpen(true);
        void checkUpstreamRelease();
    }, [checkUpstreamRelease]);

    return {
        open,
        setOpen,
        openReleaseModal,
        localVersion: APP_VERSION,
        localReleases,
        upstreamVersion,
        upstreamReleases,
        checking,
        checkUpstreamRelease,
    };
}
