import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GAME_PRODUCTS } from '../data/products';
import { IconGamepad, IconShield, IconCheck, IconArrowRight } from '../components/Icons';

export const HomePage = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredGames = useMemo(() => {
    return GAME_PRODUCTS.filter((game) => {
      const matchSearch =
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.publisher.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory =
        selectedCategory === 'all' || game.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="home-page">
      {/* Hero Banner Section */}
      <section className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="live-indicator" />
            <span>SERVER AKTIF &bull; PROSES INSTAN 1-3 DETIK</span>
          </div>
          <h1 className="hero-title">
            Top Up Game Favoritmu <br />
            <span className="highlight-text">Cepat, Legal & Terpercaya</span>
          </h1>
          <p className="hero-desc">
            Nikmati kemudahan top-up diamond, voucher, dan mata uang game resmi dengan konfirmasi otomatis langsung masuk ke akun Anda.
          </p>

          <div className="hero-stats">
            <div className="stat-box">
              <span className="stat-number">1-3 Detik</span>
              <span className="stat-label">Kecepatan Proses</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">100% Legal</span>
              <span className="stat-label">Garansi Aman</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">24/7 Nonstop</span>
              <span className="stat-label">Layanan Otomatis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Search & Category Filters */}
      <section className="catalog-header-section">
        <div className="catalog-title-group">
          <h2 className="catalog-heading">Katalog Produk Populer</h2>
          <p className="catalog-subheading">Pilih game favoritmu untuk memulai pengisian saldo akun</p>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Cari game (Mobile Legends, Free Fire, Valorant)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-pills">
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              Semua Game
            </button>
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'mobile' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('mobile')}
            >
              Mobile Games
            </button>
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'pc' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('pc')}
            >
              PC & Console
            </button>
          </div>
        </div>
      </section>

      {/* Game Cards Grid */}
      <section className="game-grid-section">
        {filteredGames.length === 0 ? (
          <div className="empty-search">
            <p>Game dengan kata kunci "{searchQuery}" tidak ditemukan.</p>
          </div>
        ) : (
          <div className="game-cards-grid">
            {filteredGames.map((game) => (
              <Link
                key={game.id}
                to={`/game/${game.slug}`}
                className="game-catalog-card"
                style={{ '--card-accent': game.accentColor }}
              >
                <div
                  className="game-card-banner"
                  style={{ background: game.bannerGradient }}
                >
                  <span className="game-card-code">{game.code}</span>
                  {game.badge && <span className="game-card-badge">{game.badge}</span>}
                </div>

                <div className="game-card-body">
                  <div className="game-meta-group">
                    <span className="game-publisher">{game.publisher}</span>
                    <h3 className="game-name">{game.name}</h3>
                  </div>

                  <div className="game-card-footer">
                    <span className="delivery-tag">Instant Delivery</span>
                    <span className="arrow-btn">
                      <IconArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Value Proposition Highlights */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon-box">
            <IconShield size={24} />
          </div>
          <div className="feature-text">
            <h4 className="feature-title">100% Resmi & Bergaransi</h4>
            <p className="feature-desc">Mata uang game resmi langsung dari publisher terpercaya tanpa risiko banned.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box">
            <IconGamepad size={24} />
          </div>
          <div className="feature-text">
            <h4 className="feature-title">Eksekusi Instan Otomatis</h4>
            <p className="feature-desc">Sistem backend database transaction memproses pesanan Anda dalam 1-3 detik.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box">
            <IconCheck size={24} />
          </div>
          <div className="feature-text">
            <h4 className="feature-title">Harga Terbaik & Promo</h4>
            <p className="feature-desc">Dapatkan harga termurah dengan promo dan diskon eksklusif setiap hari.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
