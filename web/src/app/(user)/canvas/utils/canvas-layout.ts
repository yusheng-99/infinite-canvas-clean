import type { CanvasConnection, CanvasNodeData, Position } from "../types";

export type CanvasLayoutAction = "left" | "center-x" | "right" | "top" | "center-y" | "bottom" | "distribute-x" | "distribute-y";

export type CanvasAlignmentGuides = { x?: number; y?: number };

type DragNode = Pick<CanvasNodeData, "id" | "width" | "height"> & { position: Position };
type BatchLayout = { width: number; height: number; children: { node: CanvasNodeData; position: Position }[] };

const HORIZONTAL_GAP = 120;
const VERTICAL_GAP = 48;
const GRID_SIZE = 16;

export function autoArrangeCanvasNodes(nodes: CanvasNodeData[], connections: CanvasConnection[], targetIds: Set<string>) {
    const targets = nodes.filter((node) => targetIds.has(node.id));
    const positions = new Map<string, Position>();
    if (targets.length < 2) return positions;

    const nodeById = new Map(targets.map((node) => [node.id, node]));
    const ownerByChild = new Map<string, string>();
    const batchLayouts = new Map<string, BatchLayout>();
    targets.forEach((root) => {
        const children = (root.metadata?.batchChildIds || []).map((id) => nodeById.get(id)).filter((node): node is CanvasNodeData => Boolean(node));
        if (!children.length) return;
        children.forEach((child) => ownerByChild.set(child.id, root.id));
        batchLayouts.set(root.id, createBatchLayout(root, children));
    });
    const layoutNodes = targets.filter((node) => !ownerByChild.has(node.id));
    const layoutIdSet = new Set(layoutNodes.map((node) => node.id));
    const related = new Map<string, { fromNodeId: string; toNodeId: string }>();
    connections.forEach((connection) => {
        const fromNodeId = ownerByChild.get(connection.fromNodeId) || connection.fromNodeId;
        const toNodeId = ownerByChild.get(connection.toNodeId) || connection.toNodeId;
        if (fromNodeId === toNodeId || !layoutIdSet.has(fromNodeId) || !layoutIdSet.has(toNodeId)) return;
        related.set(`${fromNodeId}:${toNodeId}`, { fromNodeId, toNodeId });
    });
    const degree = new Map(layoutNodes.map((node) => [node.id, 0]));
    const indegree = new Map(layoutNodes.map((node) => [node.id, 0]));
    const outgoing = new Map<string, string[]>();
    related.forEach((connection) => {
        degree.set(connection.fromNodeId, (degree.get(connection.fromNodeId) || 0) + 1);
        degree.set(connection.toNodeId, (degree.get(connection.toNodeId) || 0) + 1);
        indegree.set(connection.toNodeId, (indegree.get(connection.toNodeId) || 0) + 1);
        outgoing.set(connection.fromNodeId, [...(outgoing.get(connection.fromNodeId) || []), connection.toNodeId]);
    });

    const connected = layoutNodes.filter((node) => degree.get(node.id));
    const isolated = layoutNodes.filter((node) => !degree.get(node.id));
    const rank = new Map(connected.map((node) => [node.id, 0]));
    const queue = connected.filter((node) => indegree.get(node.id) === 0).sort(byPosition).map((node) => node.id);
    while (queue.length) {
        const id = queue.shift()!;
        (outgoing.get(id) || []).forEach((nextId) => {
            rank.set(nextId, Math.max(rank.get(nextId) || 0, (rank.get(id) || 0) + 1));
            indegree.set(nextId, (indegree.get(nextId) || 0) - 1);
            if (indegree.get(nextId) === 0) queue.push(nextId);
        });
    }

    const originX = Math.min(...layoutNodes.map((node) => node.position.x));
    const originY = Math.min(...layoutNodes.map((node) => node.position.y));
    const columns = new Map<number, CanvasNodeData[]>();
    connected.forEach((node) => columns.set(rank.get(node.id) || 0, [...(columns.get(rank.get(node.id) || 0) || []), node]));

    let columnX = originX;
    let connectedBottom = originY;
    [...columns.keys()].sort((a, b) => a - b).forEach((column) => {
        const columnNodes = columns.get(column)!.sort((a, b) => a.position.y - b.position.y);
        let y = originY;
        columnNodes.forEach((node) => {
            const size = layoutSize(node, batchLayouts);
            positions.set(node.id, { x: columnX, y });
            y += size.height + VERTICAL_GAP;
        });
        connectedBottom = Math.max(connectedBottom, y - VERTICAL_GAP);
        columnX += Math.max(...columnNodes.map((node) => layoutSize(node, batchLayouts).width)) + HORIZONTAL_GAP;
    });

    let rowY = connected.length ? connectedBottom + 80 : originY;
    for (let index = 0; index < isolated.length; index += 4) {
        const row = isolated.slice(index, index + 4).sort(byPosition);
        let x = originX;
        row.forEach((node) => {
            const size = layoutSize(node, batchLayouts);
            positions.set(node.id, { x, y: rowY });
            x += size.width + HORIZONTAL_GAP;
        });
        rowY += Math.max(...row.map((node) => layoutSize(node, batchLayouts).height)) + VERTICAL_GAP;
    }

    batchLayouts.forEach((layout, rootId) => {
        const root = nodeById.get(rootId);
        const rootPosition = positions.get(rootId) || root?.position;
        if (!rootPosition) return;
        layout.children.forEach(({ node, position }) => positions.set(node.id, { x: rootPosition.x + position.x, y: rootPosition.y + position.y }));
    });
    return positions;
}

export function alignCanvasNodes(nodes: CanvasNodeData[], targetIds: Set<string>, action: CanvasLayoutAction) {
    const targets = nodes.filter((node) => targetIds.has(node.id));
    const positions = new Map<string, Position>();
    if (targets.length < 2) return positions;

    const left = Math.min(...targets.map((node) => node.position.x));
    const right = Math.max(...targets.map((node) => node.position.x + node.width));
    const top = Math.min(...targets.map((node) => node.position.y));
    const bottom = Math.max(...targets.map((node) => node.position.y + node.height));

    if (action === "distribute-x" || action === "distribute-y") {
        const horizontal = action === "distribute-x";
        const ordered = [...targets].sort((a, b) => (horizontal ? a.position.x - b.position.x : a.position.y - b.position.y));
        const totalSize = ordered.reduce((sum, node) => sum + (horizontal ? node.width : node.height), 0);
        const span = horizontal ? right - left : bottom - top;
        const gap = Math.max(16, (span - totalSize) / (ordered.length - 1));
        let cursor = horizontal ? left : top;
        ordered.forEach((node) => {
            positions.set(node.id, horizontal ? { x: cursor, y: node.position.y } : { x: node.position.x, y: cursor });
            cursor += (horizontal ? node.width : node.height) + gap;
        });
        return positions;
    }

    targets.forEach((node) => {
        let { x, y } = node.position;
        if (action === "left") x = left;
        if (action === "center-x") x = (left + right - node.width) / 2;
        if (action === "right") x = right - node.width;
        if (action === "top") y = top;
        if (action === "center-y") y = (top + bottom - node.height) / 2;
        if (action === "bottom") y = bottom - node.height;
        positions.set(node.id, { x, y });
    });
    return positions;
}

export function snapCanvasDrag(fixedNodes: CanvasNodeData[], movingNodes: DragNode[], rawDx: number, rawDy: number, scale: number) {
    if (!movingNodes.length) return { dx: rawDx, dy: rawDy, guides: {} as CanvasAlignmentGuides };
    const left = Math.min(...movingNodes.map((node) => node.position.x + rawDx));
    const right = Math.max(...movingNodes.map((node) => node.position.x + node.width + rawDx));
    const top = Math.min(...movingNodes.map((node) => node.position.y + rawDy));
    const bottom = Math.max(...movingNodes.map((node) => node.position.y + node.height + rawDy));
    const movingX = [left, (left + right) / 2, right];
    const movingY = [top, (top + bottom) / 2, bottom];
    const threshold = 8 / Math.max(scale, 0.05);
    const bestX: { distance: number; offset: number; guide?: number } = { distance: Number.POSITIVE_INFINITY, offset: 0 };
    const bestY: { distance: number; offset: number; guide?: number } = { distance: Number.POSITIVE_INFINITY, offset: 0 };

    fixedNodes.forEach((node) => {
        const fixedX = [node.position.x, node.position.x + node.width / 2, node.position.x + node.width];
        const fixedY = [node.position.y, node.position.y + node.height / 2, node.position.y + node.height];
        movingX.forEach((moving) => fixedX.forEach((fixed) => {
            const distance = Math.abs(fixed - moving);
            if (distance <= threshold && distance < bestX.distance) Object.assign(bestX, { distance, offset: fixed - moving, guide: fixed });
        }));
        movingY.forEach((moving) => fixedY.forEach((fixed) => {
            const distance = Math.abs(fixed - moving);
            if (distance <= threshold && distance < bestY.distance) Object.assign(bestY, { distance, offset: fixed - moving, guide: fixed });
        }));
    });

    return {
        dx: rawDx + (bestX.guide === undefined ? Math.round(left / GRID_SIZE) * GRID_SIZE - left : bestX.offset),
        dy: rawDy + (bestY.guide === undefined ? Math.round(top / GRID_SIZE) * GRID_SIZE - top : bestY.offset),
        guides: { x: bestX.guide, y: bestY.guide },
    };
}

function createBatchLayout(root: CanvasNodeData, children: CanvasNodeData[]): BatchLayout {
    const columnWidths = [0, 0];
    const rowHeights: number[] = [];
    children.forEach((node, index) => {
        columnWidths[index % 2] = Math.max(columnWidths[index % 2], node.width);
        rowHeights[Math.floor(index / 2)] = Math.max(rowHeights[Math.floor(index / 2)] || 0, node.height);
    });
    const rowTops: number[] = [];
    rowHeights.reduce((top, height, index) => {
        rowTops[index] = top;
        return top + height + 36;
    }, 0);
    const childStartX = root.width + HORIZONTAL_GAP;
    const childHeight = rowHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, rowHeights.length - 1) * 36;
    return {
        width: childStartX + columnWidths[0] + (columnWidths[1] ? 36 + columnWidths[1] : 0),
        height: Math.max(root.height, childHeight),
        children: children.map((node, index) => ({
            node,
            position: {
                x: childStartX + (index % 2 ? columnWidths[0] + 36 : 0),
                y: rowTops[Math.floor(index / 2)],
            },
        })),
    };
}

function layoutSize(node: CanvasNodeData, batchLayouts: Map<string, BatchLayout>) {
    return batchLayouts.get(node.id) || node;
}

function byPosition(a: CanvasNodeData, b: CanvasNodeData) {
    return a.position.y - b.position.y || a.position.x - b.position.x;
}
