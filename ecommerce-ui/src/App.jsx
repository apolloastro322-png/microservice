import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import CartPage from "./pages/CartPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductListPage from "./pages/ProductListPage";

export default function App() {
  const [userId, setUserId] = useState(
    () => Number(localStorage.getItem("userId")) || 1,
  );
  function changeUser(value) {
    setUserId(value);
    localStorage.setItem("userId", String(value));
  }
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased">
      <Navbar userId={userId} onUserChange={changeUser} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <Routes>
          <Route path="/" element={<ProductListPage />} />
          <Route
            path="/products/:id"
            element={<ProductDetailPage userId={userId} />}
          />

          <Route path="/cart" element={<CartPage userId={userId} />} />

          <Route
            path="*"
            element={<p className="text-muted-foreground">Halaman tidak ditemukan.</p>}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
