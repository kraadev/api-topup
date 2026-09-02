import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { IconShield } from './Icons';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <img src={logoImg} alt="Triple S" className="footer-logo" />
            <p className="footer-desc">
              Triple S Top-Up adalah portal resmi penyedia layanan top-up game dan produk digital terpercaya dengan sistem pemrosesan transaksi instan 24/7.
            </p>
            <div className="security-badge">
              <IconShield size={16} />
              <span>Sistem Transaksi Terenkripsi & Legal 100%</span>
            </div>
          </div>

          <div className="footer-links-grid">
            <div className="footer-col">
              <h4 className="footer-heading">Navigasi</h4>
              <ul className="footer-list">
                <li><Link to="/">Katalog Game</Link></li>
                <li><Link to="/transaksi">Riwayat Pesanan</Link></li>
                <li><Link to="/game/mobile-legends">Mobile Legends</Link></li>
                <li><Link to="/game/valorant">Valorant Points</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Layanan Pembayaran</h4>
              <ul className="footer-list">
                <li>Saldo Akun Triple S</li>
                <li>QRIS (Semua E-Wallet)</li>
                <li>Virtual Account Bank</li>
                <li>Transfer Otomatis</li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-heading">Informasi & Bantuan</h4>
              <ul className="footer-list">
                <li>Syarat & Ketentuan</li>
                <li>Kebijakan Privasi</li>
                <li>Pusat Bantuan 24/7</li>
                <li>Status Server API :8080</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Triple S Top-Up. All rights reserved &middot; Backend Golang PostgreSQL</p>
        </div>
      </div>
    </footer>
  );
};
