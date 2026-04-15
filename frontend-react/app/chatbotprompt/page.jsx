import GemsPage from "../../src/views/GemsPage.jsx";
import { fetchPublicJson } from "../../src/lib/serverApi.js";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export const metadata = {
  title: "Chatbot Prompt",
  description: "Kho prompt chatbot và workflow AI giúp viết nội dung nhanh, chuẩn hơn."
};

export default async function Page() {
  try {
    const items = await fetchPublicJson("/catalog/gems", { revalidate });
    return <GemsPage initialItems={items} />;
  } catch (_err) {
    return <GemsPage />;
  }
}
