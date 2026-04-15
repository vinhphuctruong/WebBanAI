import { Suspense } from "react";
import AuthPage from "../../src/views/AuthPage.jsx";

export const metadata = {
  title: "Đăng Nhập / Đăng Ký",
  description: "Đăng nhập hoặc tạo tài khoản để mua prompt và công cụ AI."
};

export default function Page() {
  return (
    <Suspense fallback={<p>Đang tải...</p>}>
      <AuthPage />
    </Suspense>
  );
}
