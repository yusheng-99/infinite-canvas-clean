export type ReleaseInfo = {
    version: string;
    date: string;
    originalVersion?: string;
    items: { type: string; content: string }[];
};

export function parseChangelog(content: string): ReleaseInfo[] {
    return content
        .split(/^## /m)
        .slice(1)
        .map((block) => {
            const [title = "", ...lines] = block.trim().split("\n");
            const [releaseTitle = "", originalVersion = ""] = title.split(/\s+-\s+原项目\s+/);
            const [, version = releaseTitle.trim(), date = ""] = releaseTitle.match(/^(.+?)(?:\s+-\s+(.+))?$/) || [];
            return {
                version: version.trim(),
                date: date.trim(),
                originalVersion: originalVersion.trim() || undefined,
                items: lines
                    .map((line) => line.trim().match(/^\+\s+\[(.+?)\]\s+(.+)$/))
                    .filter((match): match is RegExpMatchArray => Boolean(match))
                    .map((match) => ({ type: match[1], content: match[2] })),
            };
        })
        .filter((release) => release.items.length);
}
