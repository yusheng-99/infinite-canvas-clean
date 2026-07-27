import { createBrowserRouter } from "react-router-dom";

import UserLayout from "@/app/(user)/layout";
import HomePage from "@/app/(user)/page";
import CanvasPage from "@/app/(user)/canvas/page";
import CanvasProjectPage from "@/app/(user)/canvas/[id]/page";
import ImagePage from "@/app/(user)/image/page";
import VideoPage from "@/app/(user)/video/page";
import AssetsPage from "@/app/(user)/assets/page";
import GalleryPage from "@/app/(user)/gallery/page";
import PromptsPage from "@/app/(user)/prompts/page";
import NotFound from "@/app/not-found";

export const router = createBrowserRouter([
    {
        element: <UserLayout />,
        children: [
            { path: "/", element: <HomePage /> },
            { path: "/canvas", element: <CanvasPage /> },
            { path: "/canvas/:id", element: <CanvasProjectPage /> },
            { path: "/image", element: <ImagePage /> },
            { path: "/video", element: <VideoPage /> },
            { path: "/assets", element: <AssetsPage /> },
            { path: "/gallery", element: <GalleryPage /> },
            { path: "/prompts", element: <PromptsPage /> },
        ],
    },
    { path: "*", element: <NotFound /> },
]);
