import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TopUpModal } from './components/TopUpModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { GameDetailPage } from './pages/GameDetailPage';
import { InvoicePage } from './pages/InvoicePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { CheckTransactionPage } from './pages/CheckTransactionPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { PromoPage } from './pages/PromoPage';
import { ProfilePage } from './pages/ProfilePage';
import { orderService } from './services/orderService';
import './index.css';

function AppContent() {
  const { user, topUpSaldo, refreshUser } = useAuth();
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState('login');

  const handleOpenAuth = (view = 'login') => {
    setAuthModalView(view);
    setAuthModalOpen(true);
  };

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
      await topUpSaldo(amount);
    } catch (err) {
      console.warn('Top-up saldo error:', err.message);
    }
  };

  // Handler Submit Transaksi Order
  const handleOrderSubmit = async (orderPayload) => {
    const isWallet = orderPayload.paymentMethod?.isWallet;

    if (isWallet) {
      // Jika bayar menggunakan Saldo Dompet -> Potong saldo via backend Golang
      const response = await orderService.createOrder({
        userId: orderPayload.userId || user?.id || 1,
        item: orderPayload.item,
        harga: orderPayload.harga,
      });
      await refreshUser();
      return response;
    } else {
      // Jika bayar menggunakan Virtual Account (BCA/Mandiri/BRI/BNI) atau QRIS
      const newOrderId = Math.floor(100000 + Math.random() * 900000);
      const pendingOrder = {
        id: newOrderId,
        user_id: orderPayload.userId || user?.id || 1,
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
    <div className="app-layout">
      {/* Main Navbar */}
      <Navbar
        onOpenTopUp={() => setIsTopUpModalOpen(true)}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenAuth={handleOpenAuth}
      />

      {/* Dynamic Page Routes */}
      <main className="main-content-container">
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

          {/* 8. Halaman Profil & Pengaturan Akun */}
          <Route
            path="/profile"
            element={
              <ProfilePage
                onOpenTopUp={() => setIsTopUpModalOpen(true)}
                onOpenAuth={handleOpenAuth}
              />
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

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

      {/* Modal Autentikasi (Login / Register / OTP / Reset) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
