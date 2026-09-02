import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconSparkles, IconShield } from './Icons';

const BANNERS = [
  {
    id: 1,
    title: 'Weekly Diamond Pass MLBB',
    highlight: 'Diskon Spesial 15%',
    subtitle: 'Klaim 210 Diamonds + 70 Starlight Point selama 7 hari berturut-turut.',
    ctaText: 'Beli Sekarang',
    link: '/game/mobile-legends',
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 60%, #0f172a 100%)',
    badge: 'FLASH SALE',
    badgeColor: '#3b82f6',
  },
  {
    id: 2,
    title: 'Cashback Akun Baru',
    highlight: 'Kupon TRIPLESNEW',
    subtitle: 'Gunakan kode promo TRIPLESNEW saat checkout untuk potongan langsung hingga Rp 10.000.',
    ctaText: 'Lihat Promo',
    link: '/promo',
    gradient: 'linear-gradient(135deg, #047857 0%, #064e3b 60%, #0f172a 100%)',
    badge: 'NEW USER',
    badgeColor: '#10b981',
  },
  {
    id: 3,
    title: 'Valorant Points SEA',
    highlight: 'Pengiriman 1-3 Detik',
    subtitle: 'Beli VP resmi Riot Games server Indonesia tanpa antre langsung aktif di inventory.',
    ctaText: 'Top Up VP',
    link: '/game/valorant',
    gradient: 'linear-gradient(135deg, #be123c 0%, #881337 60%, #0f172a 100%)',
    badge: 'INSTANT DELIVERY',
    badgeColor: '#f43f5e',
  },
];

export const PromoBannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const currentBanner = BANNERS[currentIndex];

  return (
    <div
      className="promo-slider-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="promo-banner-slide"
        style={{ background: currentBanner.gradient }}
      >
        <div className="promo-slide-content">
          <div className="promo-slide-badge" style={{ color: currentBanner.badgeColor }}>
            <IconSparkles size={14} />
            <span>{currentBanner.badge}</span>
          </div>

          <h2 className="promo-slide-title">
            {currentBanner.title} <br />
            <span className="promo-slide-highlight">{currentBanner.highlight}</span>
          </h2>

          <p className="promo-slide-desc">{currentBanner.subtitle}</p>

          <Link to={currentBanner.link} className="btn-solid promo-slide-cta">
            <span>{currentBanner.ctaText}</span>
            <IconArrowRight size={16} />
          </Link>
        </div>

        <div className="promo-slide-decoration">
          <div className="deco-glow" style={{ backgroundColor: currentBanner.badgeColor }} />
        </div>
      </div>

      {/* Pagination Dots */}
      <div className="slider-dots-row">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(idx)}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
