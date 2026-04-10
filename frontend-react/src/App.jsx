import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import HomePage from "./pages/HomePage.jsx";
import GemsPage from "./pages/GemsPage.jsx";
import GemDetailPage from "./pages/GemDetailPage.jsx";
import ToolsPage from "./pages/ToolsPage.jsx";
import ToolDetailPage from "./pages/ToolDetailPage.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PurchasedProductsPage from "./pages/PurchasedProductsPage.jsx";
import PayPage from "./pages/PayPage.jsx";
import PayResultPage from "./pages/PayResultPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chatbotprompt" element={<GemsPage />} />
          <Route path="/chatbotprompt/:slug" element={<GemDetailPage />} />
          <Route path="/ai-tools" element={<ToolsPage />} />
          <Route path="/ai-tool/:slug" element={<ToolDetailPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/purchased-products" element={<PurchasedProductsPage />} />
          <Route path="/pay/:itemType/:slug" element={<PayPage />} />
          <Route path="/pay/result" element={<PayResultPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
