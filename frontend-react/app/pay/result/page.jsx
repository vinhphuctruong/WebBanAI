import { Suspense } from "react";
import PayResultPage from "../../../src/views/PayResultPage.jsx";

export const metadata = {
  title: "Kết Quả Thanh Toán",
  description: "Kiểm tra trạng thái thanh toán đơn hàng của bạn."
};

export default function Page() {
  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <PayResultPage />
    </Suspense>
  );
}
