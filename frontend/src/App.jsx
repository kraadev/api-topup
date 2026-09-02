import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TopUpModal } from './components/TopUpModal';
import { SearchModal } from './components/SearchModal';
import { HomePage } from './pages/HomePage';
import { GameDetailPage } from './pages/GameDetailPage';
import { InvoicePage } from './pages/InvoicePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { CheckTransactionPage } from './pages/CheckTransactionPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { PromoPage } from './pages/PromoPage';
import { userService } from './services/userService';
import { orderService } from './services/orderService';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Ambil data user dari backend Golang (default ID 1)
  const fetchUserData = useCallback(async () => {
    setLoadingUser(true);
    try {
      const response = await userService.getUserById(1);
      const userData = response.data || response;
      setUser(userData);
    } catch (err) {
      console.warn('Backend belum terkoneksi, menggunakan state lokal:', err.message);
      setUser((prev) => prev || { id: 1, username: 'player_one', saldo: 100000 });
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to open Search Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handler Top Up Saldo Dompet
  const handleTopUp = async (amount) => {
    try {
      await userService.topUpSaldo(user?.id || 1, amount);
      await fetchUserData();
    } catch (err) {
      setUser((prev) => ({
        ...prev,
        saldo: (prev?.saldo || 0) + Number(amount),
      }));
      if (err.message !== 'Failed to fetch' && !err.message.includes('Network Error')) {
        throw err;
      }
    }
  };

  // Handler Submit Transaksi Order
  const handleOrderSubmit = async (orderPayload) => {
    const isWallet = orderPayload.paymentMethod?.isWallet;

    if (isWallet) {
      // Jika bayar menggunakan Saldo Dompet -> Potong saldo via backend Golang
      const response = await orderService.createOrder({
        userId: orderPayload.userId,
        item: orderPayload.item,
        harga: orderPayload.harga,
      });
      await fetchUserData();
      return response;
    } else {
      // Jika bayar menggunakan Virtual Account (BCA/Mandiri/BRI/BNI) atau QRIS
      const newOrderId = Math.floor(100000 + Math.random() * 900000);
      const pendingOrder = {
        id: newOrderId,
        user_id: orderPayload.userId,
        item: orderPayload.item,
        harga: orderPayload.harga,
        status: 'Pending',
        paymentMethod: orderPayload.paymentMethod,
        created_at: new Date().toISOString(),
      };
      return { success: true, order: pendingOrder, data: { order: pendingOrder } };
    }
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Main Navbar */}
        <Navbar
          user={user}
          onOpenTopUpModal={() => setIsTopUpModalOpen(true)}
          onOpenSearchModal={() => setIsSearchModalOpen(true)}
        />

        {/* Dynamic Page Routes */}
        <div className="main-content-container">
          <Routes>
            {/* 1. Halaman Utama / Katalog Game */}
            <Route
              path="/"
              element={
                <HomePage
                  user={user}
                  onOpenSearchModal={() => setIsSearchModalOpen(true)}
                />
              }
            />

            {/* 2. Halaman Top-Up Per Game */}
            <Route
              path="/game/:gameId"
              element={
                <GameDetailPage
                  user={user}
                  onOrderSubmit={handleOrderSubmit}
                  onOpenTopUpModal={() => setIsTopUpModalOpen(true)}
                />
              }
            />

            {/* 3. Halaman Detail Transaksi / Invoice */}
            <Route path="/transaksi/:orderId" element={<InvoicePage />} />

            {/* 4. Halaman Riwayat Transaksi Lengkap */}
            <Route path="/transaksi" element={<OrderHistoryPage userId={user?.id || 1} />} />

            {/* 5. Halaman Lacak / Cek Pesanan */}
            <Route path="/cek-transaksi" element={<CheckTransactionPage />} />

            {/* 6. Halaman Kalkulator Gaming */}
            <Route path="/kalkulator" element={<CalculatorPage />} />

            {/* 7. Halaman Promo & Kupon Diskon */}
            <Route path="/promo" element={<PromoPage />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Footer */}
        <Footer />

        {/* Modal Top Up Saldo Akun */}
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={() => setIsTopUpModalOpen(false)}
          user={user}
          onTopUp={handleTopUp}
        />

        {/* Modal Command Palette Search */}
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
        />
      </div>
    </BrowserRouter>
  );
}
