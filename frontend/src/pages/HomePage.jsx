import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { GAME_PRODUCTS } from '../data/products';
import { PromoBannerSlider } from '../components/PromoBannerSlider';
import { FlashSaleSection } from '../components/FlashSaleSection';
import { RecentTransactionsFeed } from '../components/RecentTransactionsFeed';
import { IconGamepad, IconShield, IconCheck, IconArrowRight, IconSearch, IconSparkles } from '../components/Icons';

export const HomePage = ({ user, onOpenSearchModal }) => {
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
      {/* 1. Announcement Strip */}
      <div className="announcement-strip">
        <div className="strip-inner">
          <span className="strip-badge">
            <IconSparkles size={13} />
            <span>PENGUMUMAN</span>
          </span>
          <p className="strip-text">
            Sistem pengiriman instan aktif 24 jam nonstop. Gunakan kupon <strong>TRIPLESNEW</strong> untuk diskon 10% transaksi pertamamu!
          </p>
        </div>
      </div>

      {/* 2. Interactive Hero Banner Slider */}
      <div className="hero-slider-wrapper">
        <PromoBannerSlider />
      </div>

      {/* 3. Flash Sale Hot Deals */}
      <FlashSaleSection />

      {/* 4. Game Catalog Search & Category Filters */}
      <section className="catalog-header-section" id="katalog">
        <div className="catalog-title-group">
          <h2 className="catalog-heading">Katalog Produk & Game Populer</h2>
          <p className="catalog-subheading">Pilih game favoritmu untuk memulai pengisian saldo akun secara instan</p>
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <IconSearch size={16} className="catalog-search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari game (MLBB, Free Fire, Valorant, dll)..."
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
              Semua
            </button>
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'mobile' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('mobile')}
            >
              Mobile Game
            </button>
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'pc' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('pc')}
            >
              PC Game
            </button>
            <button
              type="button"
              className={`cat-pill ${selectedCategory === 'voucher' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('voucher')}
            >
              Voucher
            </button>
          </div>
        </div>
      </section>

      {/* 5. Game Cards Grid */}
      <section className="game-grid-section">
        {filteredGames.length === 0 ? (
          <div className="empty-search">
            <IconGamepad size={42} className="text-muted" />
            <h3 className="empty-title">Game Tidak Ditemukan</h3>
            <p className="empty-desc">Tidak ada game yang cocok dengan kata kunci "{searchQuery}".</p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn-secondary-flat"
              style={{ marginTop: '1rem' }}
            >
              Reset Pencarian
            </button>
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
                    <span className="game-publisher">{game.publisher} &bull; {game.categoryLabel}</span>
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

      {/* 6. Realtime Recent Transactions Feed */}
      <RecentTransactionsFeed />

      {/* 7. Authentic Trust & Security Value Proposition */}
      <section className="features-section">
        <div className="feature-card">
          <div className="feature-icon-box">
            <IconShield size={24} />
          </div>
          <div className="feature-text">
            <h4 className="feature-title">100% Resmi & Legal</h4>
            <p className="feature-desc">Mata uang game resmi langsung dari publisher terpercaya tanpa risiko akun di-banned.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box">
            <IconGamepad size={24} />
          </div>
          <div className="feature-text">
            <h4 className="feature-title">Eksekusi Instan 1-3 Detik</h4>
            <p className="feature-desc">Sistem backend database transaction memproses pesanan Anda secara otomatis tanpa antre.</p>
          </div>
        </div>

        <div className="feature-card">
          <div className="feature-icon-box">
            <IconCheck size={24} />
          </div>
          <div className="feature-text">
            <h4 className="feature-title">Layanan Aktif 24 Jam</h4>
            <p className="feature-desc">Sistem otomatis berjalan penuh setiap hari siap melayani transaksi kapan pun Anda butuhkan.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
