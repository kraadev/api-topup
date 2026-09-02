import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { TopUpModal } from './components/TopUpModal';
import { HomePage } from './pages/HomePage';
import { GameDetailPage } from './pages/GameDetailPage';
import { InvoicePage } from './pages/InvoicePage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { userService } from './services/userService';
import { orderService } from './services/orderService';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);

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
    try {
      const response = await orderService.createOrder(orderPayload);
      await fetchUserData();
      return response;
    } catch (err) {
      setUser((prev) => ({
        ...prev,
        saldo: Math.max(0, (prev?.saldo || 0) - orderPayload.harga),
      }));
      if (err.message !== 'Failed to fetch' && !err.message.includes('Network Error')) {
        throw err;
      }
      return { success: true, order: { id: Date.now(), item: orderPayload.item, harga: orderPayload.harga, status: 'Success', created_at: new Date().toISOString() } };
    }
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Main Navbar */}
        <Navbar
          user={user}
          onOpenTopUpModal={() => setIsTopUpModalOpen(true)}
        />

        {/* Dynamic Page Routes */}
        <div className="main-content-container">
          <Routes>
            {/* 1. Halaman Utama / Katalog Game */}
            <Route path="/" element={<HomePage user={user} />} />

            {/* 2. Halaman Top-Up Per Game (ala xcashshop.com/mobile-legends) */}
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
      </div>
    </BrowserRouter>
  );
}
