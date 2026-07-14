import type { CanvasConnection, CanvasNodeData, CanvasNodeGroupData, CanvasNodeMetadata, Position } from "../types";

export function createCanvasNodeGroup(nodes: CanvasNodeData[], connections: CanvasConnection[], selectedIds: Iterable<string>): CanvasNodeGroupData {
    const ids = new Set(selectedIds);
    let changed = true;
    while (changed) {
        changed = false;
        nodes.forEach((node) => {
            if (!ids.has(node.id)) return;
            [node.metadata?.batchRootId, ...(node.metadata?.batchChildIds || [])].forEach((id) => {
                if (id && !ids.has(id)) {
                    ids.add(id);
                    changed = true;
                }
            });
        });
    }

    const selectedNodes = nodes.filter((node) => ids.has(node.id));
    if (!selectedNodes.length) return { nodes: [], connections: [] };
    const left = Math.min(...selectedNodes.map((node) => node.position.x));
    const top = Math.min(...selectedNodes.map((node) => node.position.y));

    return {
        nodes: selectedNodes.map((node) => {
            const copy = structuredClone(node);
            copy.position = { x: node.position.x - left, y: node.position.y - top };
            return copy;
        }),
        connections: connections.filter((connection) => ids.has(connection.fromNodeId) && ids.has(connection.toNodeId)).map((connection) => structuredClone(connection)),
    };
}

export function instantiateCanvasNodeGroup(group: CanvasNodeGroupData, center: Position, copyTitle = false): CanvasNodeGroupData {
    if (!group.nodes.length) return { nodes: [], connections: [] };
    const bounds = group.nodes.reduce(
        (result, node) => ({
            left: Math.min(result.left, node.position.x),
            top: Math.min(result.top, node.position.y),
            right: Math.max(result.right, node.position.x + node.width),
            bottom: Math.max(result.bottom, node.position.y + node.height),
        }),
        { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity },
    );
    const dx = center.x - (bounds.left + bounds.right) / 2;
    const dy = center.y - (bounds.top + bounds.bottom) / 2;
    const stamp = Date.now();
    const idMap = new Map(group.nodes.map((node, index) => [node.id, `${node.type}-${stamp}-${index}-${Math.random().toString(36).slice(2, 7)}`]));
    const nodes = group.nodes.map((source) => {
        const node = structuredClone(source);
        node.id = idMap.get(source.id)!;
        node.title = copyTitle && !source.title.endsWith(" Copy") ? `${source.title} Copy` : source.title;
        node.position = { x: source.position.x + dx, y: source.position.y + dy };
        node.metadata = remapMetadata(source.metadata, idMap);
        return node;
    });
    const connections = group.connections.flatMap((source, index) => {
        const fromNodeId = idMap.get(source.fromNodeId);
        const toNodeId = idMap.get(source.toNodeId);
        return fromNodeId && toNodeId ? [{ ...structuredClone(source), id: `conn-${stamp}-${index}-${Math.random().toString(36).slice(2, 7)}`, fromNodeId, toNodeId }] : [];
    });
    return { nodes, connections };
}

function remapMetadata(metadata: CanvasNodeMetadata | undefined, idMap: Map<string, string>) {
    if (!metadata) return undefined;
    const next = structuredClone(metadata);
    remapId(next, "batchRootId", idMap);
    remapId(next, "primaryImageId", idMap);
    remapId(next, "upstreamEditSourceId", idMap);
    if (next.batchChildIds) next.batchChildIds = next.batchChildIds.flatMap((id) => (idMap.has(id) ? [idMap.get(id)!] : []));
    if (next.composerContent) next.composerContent = next.composerContent.replace(/@\[node:([^\]]+)\]/g, (_token, id: string) => (idMap.has(id) ? `@[node:${idMap.get(id)}]` : ""));
    if (next.status === "loading" || next.status === "error" || next.isRetrying) {
        next.status = "idle";
        delete next.errorDetails;
        delete next.retryCount;
        delete next.isRetrying;
        delete next.retryMessage;
    }
    return next;
}

function remapId(metadata: CanvasNodeMetadata, key: "batchRootId" | "primaryImageId" | "upstreamEditSourceId", idMap: Map<string, string>) {
    const id = metadata[key];
    if (!id) return;
    const mapped = idMap.get(id);
    if (mapped) metadata[key] = mapped;
    else delete metadata[key];
}
