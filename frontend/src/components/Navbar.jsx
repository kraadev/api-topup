import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatRupiah } from '../utils/formatters';
import {
  IconSearch,
  IconHistory,
  IconPlus,
  IconTag,
  IconCalculator,
  IconMenu,
  IconClose,
  IconGamepad,
  IconShield,
} from './Icons';
import logoImg from '../assets/logo.png';

export const Navbar = ({ user, onOpenTopUpModal, onOpenSearchModal }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="top-bar">
        <div className="top-bar-inner">
          {/* Brand Logo */}
          <Link to="/" className="brand-section-link" onClick={closeMobileMenu}>
            <img src={logoImg} alt="Triple S Logo" className="brand-logo-img" />
            <div className="brand-text-block">
              <span className="brand-name">Triple S Top-Up</span>
              <span className="brand-tag">PORTAL TRANSAKSI RESMI</span>
            </div>
          </Link>

          {/* Desktop Search Trigger */}
          <button
            type="button"
            className="navbar-search-btn"
            onClick={onOpenSearchModal}
            title="Cari game (Ctrl+K)"
          >
            <IconSearch size={16} className="search-btn-icon" />
            <span className="search-btn-text">Cari game favoritmu...</span>
            <kbd className="search-btn-kbd">Ctrl K</kbd>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="nav-menu">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Katalog Game
            </Link>

            <Link
              to="/cek-transaksi"
              className={`nav-link ${location.pathname === '/cek-transaksi' ? 'active' : ''}`}
            >
              Cek Pesanan
            </Link>

            <Link
              to="/transaksi"
              className={`nav-link ${location.pathname.startsWith('/transaksi') && location.pathname !== '/cek-transaksi' ? 'active' : ''}`}
            >
              Riwayat
            </Link>

            <Link
              to="/promo"
              className={`nav-link ${location.pathname === '/promo' ? 'active' : ''}`}
            >
              Promo
            </Link>

            <Link
              to="/kalkulator"
              className={`nav-link ${location.pathname === '/kalkulator' ? 'active' : ''}`}
            >
              Kalkulator
            </Link>
          </nav>

          {/* User Balance & Actions */}
          <div className="top-bar-actions">
            <div className="user-wallet-pill">
              <div className="wallet-meta">
                <span className="wallet-label">Saldo Akun</span>
                <span className="wallet-amount">{formatRupiah(user?.saldo)}</span>
              </div>
              <button
                type="button"
                onClick={onOpenTopUpModal}
                className="btn-topup-trigger"
                title="Isi Saldo Akun"
              >
                <IconPlus size={14} />
                <span>Isi Saldo</span>
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer">
            <button
              type="button"
              className="mobile-search-trigger"
              onClick={() => {
                closeMobileMenu();
                onOpenSearchModal();
              }}
            >
              <IconSearch size={16} />
              <span>Cari game atau voucher...</span>
            </button>

            <div className="mobile-nav-links">
              <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <IconGamepad size={18} />
                <span>Katalog Game</span>
              </Link>
              <Link to="/cek-transaksi" className={`mobile-nav-item ${location.pathname === '/cek-transaksi' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <IconSearch size={18} />
                <span>Cek Status Pesanan</span>
              </Link>
              <Link to="/transaksi" className={`mobile-nav-item ${location.pathname.startsWith('/transaksi') && location.pathname !== '/cek-transaksi' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <IconHistory size={18} />
                <span>Riwayat Transaksi</span>
              </Link>
              <Link to="/promo" className={`mobile-nav-item ${location.pathname === '/promo' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <IconTag size={18} />
                <span>Promo & Kupon Diskon</span>
              </Link>
              <Link to="/kalkulator" className={`mobile-nav-item ${location.pathname === '/kalkulator' ? 'active' : ''}`} onClick={closeMobileMenu}>
                <IconCalculator size={18} />
                <span>Kalkulator Diamond</span>
              </Link>
            </div>

            <div className="mobile-drawer-footer">
              <div className="mobile-wallet-box">
                <div>
                  <span className="mobile-wallet-label">Saldo Akun Anda:</span>
                  <div className="mobile-wallet-val">{formatRupiah(user?.saldo)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    onOpenTopUpModal();
                  }}
                  className="btn-solid"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                >
                  <IconPlus size={14} />
                  <span>Isi Saldo</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <IconGamepad size={20} />
          <span>Home</span>
        </Link>
        <button
          type="button"
          className="bottom-nav-item"
          onClick={onOpenSearchModal}
        >
          <IconSearch size={20} />
          <span>Cari</span>
        </button>
        <Link to="/cek-transaksi" className={`bottom-nav-item ${location.pathname === '/cek-transaksi' ? 'active' : ''}`}>
          <IconShield size={20} />
          <span>Cek Order</span>
        </Link>
        <Link to="/transaksi" className={`bottom-nav-item ${location.pathname.startsWith('/transaksi') && location.pathname !== '/cek-transaksi' ? 'active' : ''}`}>
          <IconHistory size={20} />
          <span>Riwayat</span>
        </Link>
        <button
          type="button"
          className="bottom-nav-item"
          onClick={onOpenTopUpModal}
        >
          <IconPlus size={20} />
          <span>Isi Saldo</span>
        </button>
      </nav>
    </>
  );
};
