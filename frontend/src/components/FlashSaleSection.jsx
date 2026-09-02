import React from 'react';
import { Link } from 'react-router-dom';
import { GAME_PRODUCTS } from '../data/products';
import { formatRupiah } from '../utils/formatters';
import { IconSparkles, IconArrowRight, IconTag } from './Icons';

export const FlashSaleSection = () => {
  // Ambil produk yang memiliki potongan harga originalPrice > price
  const flashSaleItems = [];
  GAME_PRODUCTS.forEach((game) => {
    game.items.forEach((item) => {
      if (item.originalPrice && item.originalPrice > item.price) {
        const discountPct = Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100);
        flashSaleItems.push({
          game,
          item,
          discountPct,
        });
      }
    });
  });

  const displayDeals = flashSaleItems.slice(0, 4);

  if (displayDeals.length === 0) return null;

  return (
    <section className="flash-sale-section">
      <div className="section-header-row">
        <div className="section-title-with-badge">
          <div className="flash-badge">
            <IconSparkles size={14} />
            <span>FLASH DEALS</span>
          </div>
          <h2 className="section-main-title">Penawaran Spesial Hari Ini</h2>
        </div>
        <Link to="/promo" className="view-all-link">
          <span>Lihat Semua Promo</span>
          <IconArrowRight size={14} />
        </Link>
      </div>

      <div className="flash-deals-grid">
        {displayDeals.map(({ game, item, discountPct }) => (
          <Link
            key={`${game.id}-${item.id}`}
            to={`/game/${game.slug}`}
            className="deal-card"
          >
            <div
              className="deal-card-header"
              style={{
                backgroundImage: game.image ? `url(${game.image})` : game.bannerGradient,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="game-card-banner-overlay" />
              <span className="deal-game-tag">{game.code}</span>
              <span className="deal-discount-badge">Hemat {discountPct}%</span>
            </div>

            <div className="deal-card-body">
              <span className="deal-game-name">{game.name}</span>
              <h4 className="deal-item-name">{item.name}</h4>

              <div className="deal-pricing">
                <span className="deal-original-price">{formatRupiah(item.originalPrice)}</span>
                <span className="deal-final-price">{formatRupiah(item.price)}</span>
              </div>

              <div className="deal-card-action">
                <span className="deal-btn-label">Beli Sekarang</span>
                <IconArrowRight size={14} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
