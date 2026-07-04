import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIG_FILE = join(process.env.LOCALAPPDATA || process.cwd(), "infinite-canvas", "ai-config.json");

export async function GET() {
    try {
        const config = JSON.parse(await readFile(CONFIG_FILE, "utf8")) as unknown;
        return Response.json({ config });
    } catch {
        return Response.json({ config: null });
    }
}

export async function PUT(request: NextRequest) {
    return saveConfig(request);
}

export async function POST(request: NextRequest) {
    return saveConfig(request);
}

async function saveConfig(request: NextRequest) {
    const body = (await request.json().catch(() => null)) as { config?: unknown } | null;
    if (!isConfigLike(body?.config)) return Response.json({ error: "Invalid config" }, { status: 400 });

    const incoming = body.config as Record<string, unknown>;
    await mkdir(dirname(CONFIG_FILE), { recursive: true });
    const nextContent = JSON.stringify(incoming, null, 2);
    await backupCurrentConfig(nextContent);
    await writeFile(CONFIG_FILE, nextContent, "utf8");
    return Response.json({ ok: true });
}

async function backupCurrentConfig(nextContent: string) {
    const current = await readFile(CONFIG_FILE, "utf8").catch(() => "");
    if (!current || current === nextContent) return;
    const backupDir = join(dirname(CONFIG_FILE), "ai-config-backups");
    await mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await copyFile(CONFIG_FILE, join(backupDir, `ai-config.${stamp}.json`));
}

function isConfigLike(config: unknown): config is Record<string, unknown> {
    if (!config || typeof config !== "object") return false;
    const value = config as Record<string, unknown>;
    return Array.isArray(value.channels) && typeof value.model === "string";
}
