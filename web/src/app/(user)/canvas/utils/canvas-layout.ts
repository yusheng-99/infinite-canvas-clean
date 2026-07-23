import { NODE_DEFAULT_SIZE } from "../constants";
import { CanvasNodeType, type CanvasConnection, type CanvasNodeData, type Position } from "../types";

export type CanvasLayoutAction = "left" | "center-x" | "right" | "top" | "center-y" | "bottom" | "distribute-x" | "distribute-y";

export type CanvasAlignmentGuides = { x?: number; y?: number };

type DragNode = Pick<CanvasNodeData, "id" | "width" | "height"> & { position: Position };
type BatchLayout = { width: number; height: number; children: { node: CanvasNodeData; position: Position }[] };
type GraphEdge = { fromNodeId: string; toNodeId: string };

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
    const related = new Map<string, GraphEdge>();
    connections.forEach((connection) => {
        const fromNodeId = ownerByChild.get(connection.fromNodeId) || connection.fromNodeId;
        const toNodeId = ownerByChild.get(connection.toNodeId) || connection.toNodeId;
        if (fromNodeId === toNodeId || !layoutIdSet.has(fromNodeId) || !layoutIdSet.has(toNodeId)) return;
        related.set(`${fromNodeId}:${toNodeId}`, { fromNodeId, toNodeId });
    });
    const edges = [...related.values()];
    const connectedIds = new Set(edges.flatMap((edge) => [edge.fromNodeId, edge.toNodeId]));
    const connected = layoutNodes.filter((node) => connectedIds.has(node.id));
    const isolated = layoutNodes.filter((node) => !connectedIds.has(node.id));
    let connectedBottom = Math.min(...layoutNodes.map((node) => canvasNodeLayoutBounds(node).top));
    graphComponents(connected, edges).forEach((component) => {
        const bounds = layoutGraphComponent(component, edges, batchLayouts, positions);
        connectedBottom = Math.max(connectedBottom, bounds.bottom);
    });

    const originX = Math.min(...layoutNodes.map((node) => canvasNodeLayoutBounds(node).left));
    const originY = Math.min(...layoutNodes.map((node) => canvasNodeLayoutBounds(node).top));
    let rowY = connected.length ? connectedBottom + 80 : originY;
    for (let index = 0; index < isolated.length; index += 4) {
        const row = isolated.slice(index, index + 4).sort(byPosition);
        let x = originX;
        row.forEach((node) => {
            const size = layoutSize(node, batchLayouts);
            setLayoutPosition(positions, node, x, rowY);
            x += size.width + HORIZONTAL_GAP;
        });
        rowY += Math.max(...row.map((node) => layoutSize(node, batchLayouts).height)) + VERTICAL_GAP;
    }

    batchLayouts.forEach((layout, rootId) => {
        const root = nodeById.get(rootId);
        const rootPosition = positions.get(rootId) || root?.position;
        if (!rootPosition) return;
        const origin = layoutCellOrigin(root, rootPosition);
        layout.children.forEach(({ node, position }) => setLayoutPosition(positions, node, origin.x + position.x, origin.y + position.y));
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
        const size = nodeLayoutSize(node);
        columnWidths[index % 2] = Math.max(columnWidths[index % 2], size.width);
        rowHeights[Math.floor(index / 2)] = Math.max(rowHeights[Math.floor(index / 2)] || 0, size.height);
    });
    const rowTops: number[] = [];
    rowHeights.reduce((top, height, index) => {
        rowTops[index] = top;
        return top + height + 36;
    }, 0);
    const rootSize = nodeLayoutSize(root);
    const childStartX = rootSize.width + HORIZONTAL_GAP;
    const childHeight = rowHeights.reduce((sum, height) => sum + height, 0) + Math.max(0, rowHeights.length - 1) * 36;
    return {
        width: childStartX + columnWidths[0] + (columnWidths[1] ? 36 + columnWidths[1] : 0),
        height: Math.max(rootSize.height, childHeight),
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
    return batchLayouts.get(node.id) || nodeLayoutSize(node);
}

function nodeLayoutSize(node: CanvasNodeData) {
    return node.type === CanvasNodeType.Image && node.metadata?.generationType ? NODE_DEFAULT_SIZE[CanvasNodeType.Image] : node;
}

function layoutCellOrigin(node: CanvasNodeData, position = node.position) {
    const size = nodeLayoutSize(node);
    return { x: position.x - (size.width - node.width) / 2, y: position.y - (size.height - node.height) / 2 };
}

function setLayoutPosition(positions: Map<string, Position>, node: CanvasNodeData, x: number, y: number) {
    const size = nodeLayoutSize(node);
    positions.set(node.id, { x: x + (size.width - node.width) / 2, y: y + (size.height - node.height) / 2 });
}

export function canvasNodeLayoutBounds(node: CanvasNodeData) {
    const size = nodeLayoutSize(node);
    const origin = layoutCellOrigin(node);
    return { left: origin.x, top: origin.y, right: origin.x + size.width, bottom: origin.y + size.height };
}

function compactMixedLayout(nodes: CanvasNodeData[], batchLayouts: Map<string, BatchLayout>, positions: Map<string, Position>) {
    const columns: { anchor: number; nodes: CanvasNodeData[] }[] = [];
    [...nodes]
        .sort((a, b) => layoutCellOrigin(a, positions.get(a.id)!).x - layoutCellOrigin(b, positions.get(b.id)!).x)
        .forEach((node) => {
            const x = layoutCellOrigin(node, positions.get(node.id)!).x;
            const column = columns.at(-1);
            if (column && x - column.anchor <= VERTICAL_GAP) column.nodes.push(node);
            else columns.push({ anchor: x, nodes: [node] });
        });
    const top = Math.min(...nodes.map((node) => layoutCellOrigin(node, positions.get(node.id)!).y));
    let x = columns[0]?.anchor || 0;
    let right = x;
    let bottom = top;
    columns.forEach((column) => {
        const width = Math.max(...column.nodes.map((node) => layoutSize(node, batchLayouts).width));
        let y = top;
        column.nodes.sort((a, b) => layoutCellOrigin(a, positions.get(a.id)!).y - layoutCellOrigin(b, positions.get(b.id)!).y).forEach((node) => {
            const size = layoutSize(node, batchLayouts);
            setLayoutPosition(positions, node, x, y);
            right = Math.max(right, x + size.width);
            bottom = Math.max(bottom, y + size.height);
            y += size.height + VERTICAL_GAP;
        });
        x += width + VERTICAL_GAP;
    });
    return { right, bottom };
}

function graphComponents(nodes: CanvasNodeData[], edges: GraphEdge[]) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const neighbors = new Map(nodes.map((node) => [node.id, new Set<string>()]));
    edges.forEach((edge) => {
        neighbors.get(edge.fromNodeId)?.add(edge.toNodeId);
        neighbors.get(edge.toNodeId)?.add(edge.fromNodeId);
    });
    const remaining = new Set(nodeById.keys());
    const components: CanvasNodeData[][] = [];
    [...nodes].sort(byPosition).forEach((node) => {
        if (!remaining.delete(node.id)) return;
        const ids = [node.id];
        const stack = [node.id];
        while (stack.length) {
            (neighbors.get(stack.pop()!) || []).forEach((id) => {
                if (!remaining.delete(id)) return;
                ids.push(id);
                stack.push(id);
            });
        }
        components.push(ids.map((id) => nodeById.get(id)!));
    });
    return components;
}

function layoutGraphComponent(nodes: CanvasNodeData[], edges: GraphEdge[], batchLayouts: Map<string, BatchLayout>, positions: Map<string, Position>) {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const componentEdges = edges.filter((edge) => nodeById.has(edge.fromNodeId) && nodeById.has(edge.toNodeId));
    const indegree = new Map(nodes.map((node) => [node.id, 0]));
    const outgoing = new Map<string, string[]>();
    componentEdges.forEach((edge) => {
        indegree.set(edge.toNodeId, (indegree.get(edge.toNodeId) || 0) + 1);
        outgoing.set(edge.fromNodeId, [...(outgoing.get(edge.fromNodeId) || []), edge.toNodeId]);
    });
    const rank = new Map(nodes.map((node) => [node.id, 0]));
    const queue = nodes.filter((node) => indegree.get(node.id) === 0).sort(byPosition).map((node) => node.id);
    while (queue.length) {
        const id = queue.shift()!;
        (outgoing.get(id) || []).forEach((nextId) => {
            rank.set(nextId, Math.max(rank.get(nextId) || 0, (rank.get(id) || 0) + 1));
            indegree.set(nextId, (indegree.get(nextId) || 0) - 1);
            if (indegree.get(nextId) === 0) queue.push(nextId);
        });
    }

    let horizontalScore = 0;
    let verticalScore = 0;
    let horizontalDirection = 0;
    let verticalDirection = 0;
    let hasHorizontalEdge = false;
    let hasVerticalEdge = false;
    componentEdges.forEach((edge) => {
        const from = nodeById.get(edge.fromNodeId)!;
        const to = nodeById.get(edge.toNodeId)!;
        const dx = to.position.x + to.width / 2 - from.position.x - from.width / 2;
        const dy = to.position.y + to.height / 2 - from.position.y - from.height / 2;
        horizontalScore += Math.abs(dx);
        verticalScore += Math.abs(dy);
        horizontalDirection += dx;
        verticalDirection += dy;
        if (Math.abs(dx) >= Math.abs(dy)) hasHorizontalEdge = true;
        else hasVerticalEdge = true;
    });
    if (hasHorizontalEdge && hasVerticalEdge) {
        nodes.forEach((node) => {
            const position = { x: Math.round(node.position.x / GRID_SIZE) * GRID_SIZE, y: Math.round(node.position.y / GRID_SIZE) * GRID_SIZE };
            positions.set(node.id, position);
        });
        return compactMixedLayout(nodes, batchLayouts, positions);
    }
    const horizontal = horizontalScore >= verticalScore;
    const direction = (horizontal ? horizontalDirection : verticalDirection) < 0 ? -1 : 1;
    const groups = new Map<number, CanvasNodeData[]>();
    nodes.forEach((node) => groups.set(rank.get(node.id) || 0, [...(groups.get(rank.get(node.id) || 0) || []), node]));
    const orderedGroups = [...groups.keys()].sort((a, b) => a - b).map((key) => groups.get(key)!);
    const originX = Math.min(...nodes.map((node) => canvasNodeLayoutBounds(node).left));
    const originY = Math.min(...nodes.map((node) => canvasNodeLayoutBounds(node).top));
    let right = originX;
    let bottom = originY;

    if (horizontal) {
        let cursor = direction > 0 ? originX : Math.max(...nodes.map((node) => layoutCellOrigin(node).x + layoutSize(node, batchLayouts).width));
        orderedGroups.forEach((group) => {
            const width = Math.max(...group.map((node) => layoutSize(node, batchLayouts).width));
            const x = direction > 0 ? cursor : cursor - width;
            let y = originY;
            group.sort((a, b) => a.position.y - b.position.y).forEach((node) => {
                const size = layoutSize(node, batchLayouts);
                setLayoutPosition(positions, node, x, y);
                right = Math.max(right, x + size.width);
                bottom = Math.max(bottom, y + size.height);
                y += size.height + VERTICAL_GAP;
            });
            cursor = direction > 0 ? x + width + HORIZONTAL_GAP : x - HORIZONTAL_GAP;
        });
    } else {
        let cursor = direction > 0 ? originY : Math.max(...nodes.map((node) => layoutCellOrigin(node).y + layoutSize(node, batchLayouts).height));
        orderedGroups.forEach((group) => {
            const height = Math.max(...group.map((node) => layoutSize(node, batchLayouts).height));
            const y = direction > 0 ? cursor : cursor - height;
            let x = originX;
            group.sort((a, b) => a.position.x - b.position.x).forEach((node) => {
                const size = layoutSize(node, batchLayouts);
                setLayoutPosition(positions, node, x, y);
                right = Math.max(right, x + size.width);
                bottom = Math.max(bottom, y + size.height);
                x += size.width + VERTICAL_GAP;
            });
            cursor = direction > 0 ? y + height + HORIZONTAL_GAP : y - HORIZONTAL_GAP;
        });
    }
    return { right, bottom };
}

function byPosition(a: CanvasNodeData, b: CanvasNodeData) {
    return a.position.y - b.position.y || a.position.x - b.position.x;
}
