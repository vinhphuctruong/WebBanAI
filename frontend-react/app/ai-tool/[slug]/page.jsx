import { notFound } from "next/navigation";
import ToolDetailPage from "../../../src/views/ToolDetailPage.jsx";
import { fetchPublicJson } from "../../../src/lib/serverApi.js";

export const revalidate = 300;

function makeDescription(tool) {
  const description = String(tool?.description || "").trim();
  if (!description) return "Chi tiết công cụ AI tại TM AIVIDEO.";
  return description.length > 160 ? `${description.slice(0, 157)}...` : description;
}

export async function generateMetadata({ params }) {
  try {
    const tool = await fetchPublicJson(`/catalog/ai-tools/${params.slug}`, { revalidate });
    return {
      title: tool?.name || "Chi Tiết AI Tool",
      description: makeDescription(tool),
      openGraph: {
        title: tool?.name || "Chi tiết AI Tool",
        description: makeDescription(tool),
        images: tool?.logo ? [{ url: tool.logo }] : []
      }
    };
  } catch (_err) {
    return {
      title: "Chi Tiết AI Tool",
      description: "Chi tiết công cụ AI tại TM AIVIDEO."
    };
  }
}

export default async function Page({ params }) {
  try {
    const tool = await fetchPublicJson(`/catalog/ai-tools/${params.slug}`, { revalidate });
    return <ToolDetailPage initialTool={tool} />;
  } catch (err) {
    if (err?.status === 404) {
      notFound();
    }
    return <ToolDetailPage initialError="Không tải được thông tin AI Tool." />;
  }
}
