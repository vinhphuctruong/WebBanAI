import "../src/styles.css";
import { AuthProvider } from "../src/lib/auth.jsx";
import Layout from "../src/components/Layout.jsx";

function resolveMetadataBase() {
  const fallback = "http://localhost:5173";

  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || fallback);
  } catch (_err) {
    return new URL(fallback);
  }
}

export const metadata = {
  metadataBase: resolveMetadataBase(),
  title: {
    default: "TM AIVIDEO | AI Tool & Prompt Marketplace",
    template: "%s | TM AIVIDEO"
  },
  description: "Kho công cụ AI và chatbot prompt giúp tăng tốc tạo nội dung video bán hàng.",
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <Layout>{children}</Layout>
        </AuthProvider>
      </body>
    </html>
  );
}
