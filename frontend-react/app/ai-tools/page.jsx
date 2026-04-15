import ToolsPage from "../../src/views/ToolsPage.jsx";
import { fetchPublicJson } from "../../src/lib/serverApi.js";

export const revalidate = 120;

export const metadata = {
  title: "Công Cụ AI",
  description: "Danh sách công cụ AI nổi bật với giá bán và tính năng cập nhật."
};

export default async function Page() {
  try {
    const items = await fetchPublicJson("/catalog/ai-tools", { revalidate });
    return <ToolsPage initialItems={items} />;
  } catch (_err) {
    return <ToolsPage initialError="Không tải được danh sách AI Tool." />;
  }
}
