import { notFound } from "next/navigation";
import GemDetailPage from "../../../src/views/GemDetailPage.jsx";
import { fetchPublicJson } from "../../../src/lib/serverApi.js";

export const revalidate = 300;

function makeDescription(gem) {
  const description = String(gem?.description || "").trim();
  if (!description) return "Chi tiết prompt chatbot tại TM AIVIDEO.";
  return description.length > 160 ? `${description.slice(0, 157)}...` : description;
}

export async function generateMetadata({ params }) {
  try {
    const gem = await fetchPublicJson(`/catalog/gems/${params.slug}`, { revalidate });
    return {
      title: gem?.title || "Chi Tiết Prompt",
      description: makeDescription(gem),
      openGraph: {
        title: gem?.title || "Chi tiết prompt chatbot",
        description: makeDescription(gem),
        images: gem?.thumbnail ? [{ url: gem.thumbnail }] : []
      }
    };
  } catch (_err) {
    return {
      title: "Chi Tiết Prompt",
      description: "Chi tiết prompt chatbot tại TM AIVIDEO."
    };
  }
}

export default async function Page({ params }) {
  try {
    const gem = await fetchPublicJson(`/catalog/gems/${params.slug}`, { revalidate });
    return <GemDetailPage initialGem={gem} />;
  } catch (err) {
    if (err?.status === 404) {
      notFound();
    }
    return <GemDetailPage initialError="Không tải được thông tin prompt." />;
  }
}
