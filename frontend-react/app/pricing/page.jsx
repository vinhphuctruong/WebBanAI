import PricingPage from "../../src/views/PricingPage.jsx";
import { fetchPublicJson } from "../../src/lib/serverApi.js";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata = {
  title: "Bảng Giá",
  description: "So sánh gói premium theo tháng và năm cho người dùng TM AIVIDEO."
};

export default async function Page() {
  try {
    const pricing = await fetchPublicJson("/catalog/pricing", { revalidate });
    return <PricingPage initialPricing={pricing} />;
  } catch (_err) {
    return <PricingPage />;
  }
}
