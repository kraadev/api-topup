import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatRupiah } from '../utils/formatters';
import { IconWallet, IconHistory, IconPlus } from './Icons';
import logoImg from '../assets/logo.png';

export const Navbar = ({ user, onOpenTopUpModal }) => {
  const location = useLocation();

  return (
    <header className="top-bar">
      <div className="top-bar-inner">
        {/* Brand Logo & Name */}
        <Link to="/" className="brand-section-link">
          <img src={logoImg} alt="Triple S Logo" className="brand-logo-img" />
          <div className="brand-text-block">
            <span className="brand-name">Triple S Top-Up</span>
            <span className="brand-tag">PORTAL TRANSAKSI RESMI</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-menu">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Katalog Game
          </Link>
          <Link
            to="/transaksi"
            className={`nav-link ${location.pathname.startsWith('/transaksi') ? 'active' : ''}`}
          >
            <IconHistory size={15} />
            <span>Riwayat Pesanan</span>
          </Link>
        </nav>

        {/* User Balance & Top-Up Trigger */}
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
        </div>
      </div>
    </header>
  );
};
