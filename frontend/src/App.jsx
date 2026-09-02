import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from './components/UserProfile';
import { OrderForm } from './components/OrderForm';
import { OrderHistory } from './components/OrderHistory';
import { userService } from './services/userService';
import { orderService } from './services/orderService';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('order'); // 'order' | 'user' | 'history'
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState(null);

  // Ambil data user dari backend Golang (default ID 1)
  const fetchUserData = useCallback(async () => {
    setLoadingUser(true);
    setUserError(null);
    try {
      const response = await userService.getUserById(1);
      const userData = response.data || response;
      setUser(userData);
    } catch (err) {
      console.warn('Backend offline / belum ada data, menggunakan dummy data:', err.message);
      setUserError('Backend belum aktif / user belum ada. Menggunakan simulasi lokal.');
      // Fallback state lokal agar UI tetap interaktif
      setUser((prev) => prev || { id: 1, username: 'GamerPro', saldo: 100000 });
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
      // Fallback update saldo lokal jika backend belum dinyalakan
      setUser((prev) => ({
        ...prev,
        saldo: (prev?.saldo || 0) + Number(amount),
      }));
      // Jika error bukan karena offline murni, lempar agar feedback muncul
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
    } catch (err) {
      // Fallback update saldo lokal jika backend belum dinyalakan
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
    <div className="app-container">
      {/* Header & Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <div className="brand-logo">⚡</div>
          <div>
            <h1 className="brand-title">TopUp Station</h1>
            <span className="brand-subtitle">Platform Top-Up Produk Digital</span>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'order' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('order')}
          >
            🛒 Order Produk
          </button>
          <button
            className={`tab-btn ${activeTab === 'user' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('user')}
          >
            👤 Profil & Saldo
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📜 Riwayat
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'order' && (
          <OrderForm user={user} onOrderSubmit={handleOrderSubmit} />
        )}

        {activeTab === 'user' && (
          <UserProfile
            user={user}
            loading={loadingUser}
            error={userError}
            onTopUp={handleTopUp}
            onRefresh={fetchUserData}
          />
        )}

        {activeTab === 'history' && (
          <OrderHistory userId={user?.id || 1} />
        )}
      </main>

      <footer className="footer">
        <p>API Endpoint: <code>{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}</code></p>
      </footer>
    </div>
  );
}
