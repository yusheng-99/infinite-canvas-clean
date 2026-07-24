import { BookOpen, ImagePlus, Images, LayoutGrid, Maximize2, Video } from "lucide-react";

export const navigationTools = [
    {
        slug: "canvas",
        label: "我的画布",
        icon: Maximize2,
    },
    {
        slug: "image",
        label: "生图工作台",
        icon: ImagePlus,
    },
    {
        slug: "video",
        label: "视频创作台",
        icon: Video,
    },
    {
        slug: "assets",
        label: "我的素材",
        icon: Images,
    },
    {
        slug: "gallery",
        label: "画廊",
        icon: LayoutGrid,
    },
    {
        slug: "prompts",
        label: "提示词广场",
        icon: BookOpen,
    },
] as const;

export type NavigationToolSlug = (typeof navigationTools)[number]["slug"];