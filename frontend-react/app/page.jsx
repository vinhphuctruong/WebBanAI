import HomePage from "../src/views/HomePage.jsx";
import { fetchPublicJson } from "../src/lib/serverApi.js";

export const revalidate = 120;

export const metadata = {
  title: "Trang Chủ",
  description: "Khám phá AI tools, chatbot prompt và ưu đãi dành cho creator video."
};

export default async function Page() {
  try {
    const [gems, tools, reviews] = await Promise.all([
      fetchPublicJson("/catalog/gems", { revalidate }),
      fetchPublicJson("/catalog/ai-tools", { revalidate }),
      fetchPublicJson("/catalog/reviews", { revalidate })
    ]);

    return <HomePage initialData={{ gems, tools, reviews }} />;
  } catch (_err) {
    return <HomePage initialError="Không tải được dữ liệu trang chủ." />;
  }
}
