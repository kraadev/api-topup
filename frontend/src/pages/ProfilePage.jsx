import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import {
  IconUser,
  IconWallet,
  IconShield,
  IconHistory,
  IconSun,
  IconMoon,
  IconSettings,
  IconLogOut,
  IconPlus,
  IconCheck,
  IconAlert,
  IconArrowRight,
} from '../components/Icons';

export const ProfilePage = ({ onOpenTopUp, onOpenAuth }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const fetchUserOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await orderService.getOrders(user.id);
          const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setOrders(list.slice(0, 5)); // Ambil 5 transaksi terbaru
        } catch (err) {
          console.warn('Gagal memuat transaksi user:', err.message);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchUserOrders();
    }
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) {
    return (
      <div className="profile-page-unauth">
        <div className="unauth-card">
          <div className="status-icon-box" style={{ margin: '0 auto 1.25rem' }}>
            <IconUser size={32} />
          </div>
          <h2 className="unauth-title">Masuk untuk Mengakses Akun</h2>
          <p className="unauth-desc">
            Kelola saldo dompet, riwayat transaksi, dan pengaturan akun Anda dalam satu tempat.
          </p>
          <div className="unauth-btn-row">
            <button
              type="button"
              className="btn-solid"
              onClick={() => onOpenAuth('login')}
            >
              Masuk ke Akun
            </button>
            <button
              type="button"
              className="btn-secondary-flat"
              onClick={() => onOpenAuth('register')}
            >
              Daftar Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userInitial = (user.name || user.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-page-container">
      {/* Header Banner */}
      <div className="profile-header-card">
        <div className="profile-hero-left">
          <div className="profile-avatar-large">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="avatar-img-large" />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div className="profile-details-column">
            <h1 className="profile-display-name">{user.name || user.username}</h1>
            <span className="profile-email-badge">{user.email || 'Akun Member Triple S'}</span>
            <div className="profile-tags-row">
              <span className="profile-uid-pill mono">UID #{user.id}</span>
              <span className="profile-status-pill">Member Terverifikasi</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-right">
          <div className="profile-wallet-box">
            <div className="wallet-box-top">
              <div className="wallet-label-group">
                <IconWallet size={16} className="text-emerald" />
                <span className="wallet-caption">Saldo Dompet Anda</span>
              </div>
              <span className="wallet-figure-large mono">{formatRupiah(user.saldo || 0)}</span>
            </div>
            <button
              type="button"
              className="btn-solid btn-topup-hero"
              onClick={onOpenTopUp}
            >
              <IconPlus size={14} />
              <span>Isi Saldo Dompet</span>
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content-grid">
        {/* Left Column: Settings */}
        <div className="profile-settings-col">
          {/* 1. Pengaturan Tampilan Tema */}
          <div className="settings-section-card">
            <div className="section-card-header">
              <IconSun size={18} className="text-emerald" />
              <h3 className="section-title">Preferensi Tema Tampilan</h3>
            </div>
            <p className="section-desc">
              Pilih mode tampilan tema yang paling nyaman untuk mata Anda.
            </p>

            <div className="theme-options-grid">
              <button
                type="button"
                className={`theme-option-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >
                <IconMoon size={18} />
                <div className="theme-btn-info">
                  <span className="theme-name">Mode Gelap (Dark)</span>
                  <span className="theme-hint">Kontras obsidian gaming</span>
                </div>
                {theme === 'dark' && <IconCheck size={16} className="theme-check-icon text-emerald" />}
              </button>

              <button
                type="button"
                className={`theme-option-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >
                <IconSun size={18} />
                <div className="theme-btn-info">
                  <span className="theme-name">Mode Terang (Light)</span>
                  <span className="theme-hint">Bersih & cerah</span>
                </div>
                {theme === 'light' && <IconCheck size={16} className="theme-check-icon text-emerald" />}
              </button>

              <button
                type="button"
                className={`theme-option-btn ${theme === 'system' ? 'active' : ''}`}
                onClick={() => setTheme('system')}
              >
                <IconSettings size={18} />
                <div className="theme-btn-info">
                  <span className="theme-name">Ikuti Sistem (Auto)</span>
                  <span className="theme-hint">Sesuai pengaturan OS</span>
                </div>
                {theme === 'system' && <IconCheck size={16} className="theme-check-icon text-emerald" />}
              </button>
            </div>
          </div>

          {/* 2. Keamanan Akun */}
          <div className="settings-section-card">
            <div className="section-card-header">
              <IconShield size={18} className="text-emerald" />
              <h3 className="section-title">Keamanan & Kata Sandi</h3>
            </div>
            <p className="section-desc">
              Lindungi akun Anda dengan kata sandi yang kuat dan verifikasi OTP.
            </p>

            <div className="security-actions-box">
              <div className="security-item-row">
                <div>
                  <span className="security-label">Kata Sandi Akun</span>
                  <span className="security-sub">Ganti kata sandi secara berkala demi keamanan.</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary-flat"
                  onClick={() => onOpenAuth('forgot')}
                >
                  Ganti Kata Sandi
                </button>
              </div>
            </div>
          </div>

          {/* 3. Keluar dari Akun */}
          <div className="settings-section-card danger-zone">
            <div className="section-card-header">
              <IconLogOut size={18} className="text-danger" />
              <h3 className="section-title text-danger">Keluar dari Sesi</h3>
            </div>
            <p className="section-desc">
              Akhiri sesi aktif akun Anda di perangkat ini.
            </p>
            <button
              type="button"
              className="btn-logout-danger"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <IconLogOut size={16} />
              <span>Keluar / Logout</span>
            </button>
          </div>
        </div>

        {/* Right Column: Recent Transactions */}
        <div className="profile-transactions-col">
          <div className="settings-section-card">
            <div className="section-card-header space-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <IconHistory size={18} className="text-emerald" />
                <h3 className="section-title">5 Transaksi Terakhir</h3>
              </div>
              <Link to="/transaksi" className="view-all-link">
                <span>Lihat Semua</span>
                <IconArrowRight size={14} />
              </Link>
            </div>

            {loadingOrders ? (
              <p className="text-muted" style={{ fontSize: '0.85rem', padding: '1rem 0' }}>
                Memuat riwayat transaksi...
              </p>
            ) : orders.length === 0 ? (
              <div className="empty-orders-mini">
                <p>Belum ada transaksi di akun ini.</p>
                <Link to="/" className="btn-solid" style={{ display: 'inline-flex', width: 'auto', marginTop: '0.75rem' }}>
                  Beli Top-Up Pertama
                </Link>
              </div>
            ) : (
              <div className="recent-orders-list">
                {orders.map((o) => (
                  <div key={o.id} className="mini-order-card">
                    <div className="mini-order-left">
                      <span className="mini-order-item">{o.item}</span>
                      <span className="mini-order-date">{formatDate(o.created_at)} &bull; <strong className="mono">#TRX-{o.id}</strong></span>
                    </div>
                    <div className="mini-order-right">
                      <span className="mini-order-price mono">{formatRupiah(o.harga)}</span>
                      <Link to={`/transaksi/${o.id}`} className="mini-order-badge success">
                        Invoice
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
