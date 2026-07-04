"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { App } from "antd";

import { fetchServerAiConfig, saveServerAiConfigOnUnload } from "@/services/app-config-storage";
import { createModelChannel, mergeAiConfigs, useConfigStore } from "@/stores/use-config-store";

export function ClientRootInit({ children }: { children: ReactNode }) {
    const { message } = App.useApp();
    const handledConfigParams = useRef(false);
    const handledServerConfig = useRef(false);
    const updateConfig = useConfigStore((state) => state.updateConfig);
    const updateConfigPatch = useConfigStore((state) => state.updateConfigPatch);
    const config = useConfigStore((state) => state.config);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);

    useEffect(() => {
        if (handledServerConfig.current) return;
        fetchServerAiConfig()
            .then((serverConfig) => {
                handledServerConfig.current = true;
                if (!serverConfig) return;
                const currentConfig = useConfigStore.getState().config;
                const mergedConfig = mergeAiConfigs(currentConfig, serverConfig);
                if (JSON.stringify(mergedConfig) !== JSON.stringify(currentConfig)) updateConfigPatch(mergedConfig);
            })
            .catch(() => {
                handledServerConfig.current = false;
            });
    }, [config, updateConfigPatch]);

    useEffect(() => {
        const save = () => saveServerAiConfigOnUnload(useConfigStore.getState().config);
        const saveWhenHidden = () => {
            if (document.visibilityState === "hidden") save();
        };
        window.addEventListener("pagehide", save);
        document.addEventListener("visibilitychange", saveWhenHidden);
        return () => {
            window.removeEventListener("pagehide", save);
            document.removeEventListener("visibilitychange", saveWhenHidden);
        };
    }, []);

    useEffect(() => {
        if (handledConfigParams.current) return;
        const searchParams = new URLSearchParams(window.location.search);
        const baseUrl = searchParams.get("baseUrl") || searchParams.get("baseurl");
        const apiKey = searchParams.get("apiKey") || searchParams.get("apikey");
        if (!baseUrl && !apiKey) return;
        handledConfigParams.current = true;
        searchParams.delete("baseUrl");
        searchParams.delete("baseurl");
        searchParams.delete("apiKey");
        searchParams.delete("apikey");
        window.history.replaceState(null, "", `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ""}${window.location.hash}`);
        const firstChannel = config.channels[0];
        updateConfig(
            "channels",
            firstChannel
                ? config.channels.map((channel, index) =>
                      index === 0
                          ? {
                                ...channel,
                                ...(baseUrl ? { baseUrl } : {}),
                                ...(apiKey ? { apiKey } : {}),
                            }
                          : channel,
                  )
                : [createModelChannel({ id: "default", name: "默认渠道", baseUrl: baseUrl || undefined, apiKey: apiKey || "" })],
        );
        if (baseUrl) updateConfig("baseUrl", baseUrl);
        if (apiKey) updateConfig("apiKey", apiKey);
        openConfigDialog(false);
        message.success("已导入本地直连配置");
    }, [config.channels, message, openConfigDialog, updateConfig]);

    return <>{children}</>;
}
