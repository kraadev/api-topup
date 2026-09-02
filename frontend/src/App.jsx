import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from './components/UserProfile';
import { OrderForm } from './components/OrderForm';
import { OrderHistory } from './components/OrderHistory';
import { userService } from './services/userService';
import { orderService } from './services/orderService';
import { formatRupiah } from './utils/formatters';
import { IconCheck, IconAlert } from './components/Icons';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Ambil data user dari backend Golang (default ID 1)
  const fetchUserData = useCallback(async () => {
    setLoadingUser(true);
    setUserError(null);
    try {
      const response = await userService.getUserById(1);
      const userData = response.data || response;
      setUser(userData);
    } catch (err) {
      setUserError('Koneksi ke backend belum aktif. Menggunakan state lokal.');
      setUser((prev) => prev || { id: 1, username: 'player_one', saldo: 100000 });
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Handler Top Up Saldo
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

  // Handler Order / Beli Produk
  const handleOrderSubmit = async (orderPayload) => {
    try {
      await orderService.createOrder(orderPayload);
      await fetchUserData();
      setHistoryRefreshKey((prev) => prev + 1);
    } catch (err) {
      setUser((prev) => ({
        ...prev,
        saldo: Math.max(0, (prev?.saldo || 0) - orderPayload.harga),
      }));
      if (err.message !== 'Failed to fetch' && !err.message.includes('Network Error')) {
        throw err;
      }
    }
  };

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="brand-section">
            <div className="brand-symbol">TG</div>
            <div>
              <div className="brand-name">TopUp Gateway</div>
              <div className="brand-tag">PORTAL TRANSAKSI DIGITAL</div>
            </div>
          </div>

          <div className="top-bar-actions">
            <div className="server-status">
              <span className="status-dot" />
              <span>API :8080</span>
            </div>

            <div className="user-quick-pill">
              <span className="user-quick-id">UID #{user?.id || 1}</span>
              <span className="user-quick-saldo">{formatRupiah(user?.saldo)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="main-wrapper">
        <div className="page-header">
          <h1 className="page-title">Katalog & Pemesanan Produk</h1>
          <p className="page-desc">
            Pilih layanan produk digital, masukkan ID akun tujuan, dan selesaikan transaksi secara instan.
          </p>
        </div>

        {/* Global Alert Notification */}
        {feedback && (
          <div className={`toast-notice toast-${feedback.type}`}>
            {feedback.type === 'success' ? <IconCheck size={18} /> : <IconAlert size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* 2-Column Split Interface */}
        <div className="split-grid">
          {/* Left Column: Top-Up Order Flow */}
          <div className="order-flow-col">
            <OrderForm
              user={user}
              onOrderSubmit={handleOrderSubmit}
              notification={feedback}
              setNotification={setFeedback}
            />
          </div>

          {/* Right Column: User Balance & Wallet Actions */}
          <div className="sidebar-sticky">
            <UserProfile
              user={user}
              loading={loadingUser}
              onTopUp={handleTopUp}
              onRefresh={fetchUserData}
              feedback={feedback}
              setFeedback={setFeedback}
            />
          </div>
        </div>

        {/* Full-Width Bottom Section: Transaction Ledger */}
        <div className="ledger-section">
          <OrderHistory
            userId={user?.id || 1}
            triggerRefresh={historyRefreshKey}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div>TopUp Gateway — Sistem Transaksi Terpadu &middot; Backend Golang PostgreSQL</div>
      </footer>
    </div>
  );
}
