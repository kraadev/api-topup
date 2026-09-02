import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatRupiah } from '../utils/formatters';
import {
  IconGamepad,
  IconSearch,
  IconWallet,
  IconUser,
  IconMenu,
  IconClose,
  IconHistory,
  IconCalculator,
  IconTag,
  IconPlus,
  IconSun,
  IconMoon,
  IconLogOut,
  IconShield,
  IconChevronDown,
} from './Icons';

export const Navbar = ({ onOpenSearch, onOpenTopUp, onOpenAuth }) => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, resolvedTheme } = useTheme();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { label: 'Beranda', path: '/' },
    { label: 'Promo & Diskon', path: '/promo' },
    { label: 'Kalkulator MLBB', path: '/kalkulator' },
    { label: 'Cek Pesanan', path: '/cek-transaksi' },
    { label: 'Riwayat Transaksi', path: '/transaksi' },
  ];

  const userInitial = (user?.name || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <header className="header-navbar">
      <div className="navbar-container">
        {/* Left: Brand Logo */}
        <div className="navbar-left">
          <Link to="/" className="brand-logo-link" aria-label="Beranda Triple S">
            <img
              src="/logo.png"
              alt="Triple S Logo"
              className="brand-logo-img"
            />
            <div className="brand-text-block">
              <span className="brand-name">TRIPLE S</span>
              <span className="brand-tag">TOP-UP STORE</span>
            </div>
          </Link>
        </div>

        {/* Center: Main Navigation */}
        <nav className="navbar-center" aria-label="Navigasi Utama">
          <ul className="nav-links-list">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`nav-item-link ${isActive ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right: Actions (Search, Theme, Balance, Auth/Profile) */}
        <div className="navbar-right">
          {/* Quick Search Palette Trigger */}
          <button
            type="button"
            className="navbar-search-btn"
            onClick={onOpenSearch}
            title="Cari Game (Ctrl+K)"
          >
            <IconSearch size={15} />
            <span className="search-btn-text">Cari game...</span>
            <kbd className="search-btn-kbd">Ctrl K</kbd>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            type="button"
            className="navbar-theme-btn"
            onClick={toggleTheme}
            title={`Ganti ke mode ${resolvedTheme === 'dark' ? 'Terang' : 'Gelap'}`}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
          </button>

          {/* Saldo Dompet Pill */}
          <div className="user-balance-pill">
            <div className="balance-icon-wrap">
              <IconWallet size={14} className="text-emerald" />
            </div>
            <div className="balance-info-wrap">
              <span className="balance-caption">Saldo Dompet</span>
              <span className="balance-figure">{formatRupiah(user?.saldo || 0)}</span>
            </div>
            <button
              type="button"
              className="balance-topup-trigger"
              onClick={onOpenTopUp}
              title="Isi Saldo Dompet"
            >
              <IconPlus size={12} />
              <span>Isi</span>
            </button>
          </div>

          {/* Auth & Profile Actions */}
          {isAuthenticated ? (
            <div className="profile-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="profile-trigger-btn"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
              >
                <div className="profile-avatar-circle">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="avatar-img" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <span className="profile-username-label">{user?.name || user?.username}</span>
                <IconChevronDown size={14} className={`chevron-icon ${profileDropdownOpen ? 'rotated' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <div className="dropdown-user-header">
                    <span className="dropdown-name">{user?.name || user?.username}</span>
                    <span className="dropdown-email">{user?.email || `UID #${user?.id}`}</span>
                  </div>

                  <div className="dropdown-divider" />

                  <Link to="/profile" className="dropdown-item">
                    <IconUser size={15} />
                    <span>Profil & Akun</span>
                  </Link>

                  <Link to="/transaksi" className="dropdown-item">
                    <IconHistory size={15} />
                    <span>Riwayat Transaksi</span>
                  </Link>

                  <Link to="/kalkulator" className="dropdown-item">
                    <IconCalculator size={15} />
                    <span>Kalkulator Game</span>
                  </Link>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    onClick={logout}
                    className="dropdown-item text-danger"
                  >
                    <IconLogOut size={15} />
                    <span>Keluar / Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btn-group">
              <button
                type="button"
                className="btn-auth-login"
                onClick={() => onOpenAuth('login')}
              >
                Masuk
              </button>
              <button
                type="button"
                className="btn-auth-register"
                onClick={() => onOpenAuth('register')}
              >
                Daftar
              </button>
            </div>
          )}

          {/* Mobile Hamburger Menu Trigger */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen((p) => !p)}
            aria-label="Buka Menu"
          >
            {mobileMenuOpen ? <IconClose size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <span className="drawer-title">Menu Navigasi</span>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setMobileMenuOpen(false)}
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Mobile Auth/Balance Info */}
            <div className="mobile-drawer-auth-box">
              {isAuthenticated ? (
                <div className="mobile-user-card">
                  <div className="profile-avatar-circle">
                    <span>{userInitial}</span>
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{user?.name || user?.username}</span>
                    <span className="mobile-user-balance">Saldo: {formatRupiah(user?.saldo || 0)}</span>
                  </div>
                </div>
              ) : (
                <div className="mobile-auth-actions">
                  <button
                    type="button"
                    className="btn-auth-login"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('login');
                    }}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    className="btn-auth-register"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth('register');
                    }}
                  >
                    Daftar
                  </button>
                </div>
              )}
            </div>

            <ul className="mobile-nav-list">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={`mobile-nav-item ${location.pathname === link.path ? 'active' : ''}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {isAuthenticated && (
                <li>
                  <Link to="/profile" className="mobile-nav-item">
                    Profil & Akun
                  </Link>
                </li>
              )}
            </ul>

            <div className="mobile-drawer-footer">
              <button
                type="button"
                className="btn-theme-toggle-mobile"
                onClick={toggleTheme}
              >
                {resolvedTheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                <span>Mode {resolvedTheme === 'dark' ? 'Terang' : 'Gelap'}</span>
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  className="btn-logout-mobile"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <IconLogOut size={16} />
                  <span>Keluar dari Akun</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (Thumb Friendly) */}
      <nav className="mobile-bottom-nav" aria-label="Navigasi Bawah">
        <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <IconGamepad size={18} />
          <span>Beranda</span>
        </Link>
        <button type="button" className="bottom-nav-item" onClick={onOpenSearch}>
          <IconSearch size={18} />
          <span>Cari</span>
        </button>
        <button type="button" className="bottom-nav-item highlight" onClick={onOpenTopUp}>
          <IconPlus size={18} />
          <span>Isi Saldo</span>
        </button>
        <Link to="/transaksi" className={`bottom-nav-item ${location.pathname.startsWith('/transaksi') ? 'active' : ''}`}>
          <IconHistory size={18} />
          <span>Pesanan</span>
        </Link>
        {isAuthenticated ? (
          <Link to="/profile" className={`bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
            <IconUser size={18} />
            <span>Akun</span>
          </Link>
        ) : (
          <button type="button" className="bottom-nav-item" onClick={() => onOpenAuth('login')}>
            <IconUser size={18} />
            <span>Masuk</span>
          </button>
        )}
      </nav>
    </header>
  );
};
