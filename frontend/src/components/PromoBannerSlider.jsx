import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconSparkles, IconChevronLeft, IconChevronRight } from './Icons';
import bannerMlbbFlash from '../assets/banners/mlbb-flashsale.png';
import bannerNewUser from '../assets/banners/newuser.png';
import bannerValo from '../assets/banners/valo.png';
import bannerMlbb from '../assets/banners/mlbb.png';

const BANNERS = [
  {
    id: 1,
    image: bannerMlbbFlash,
    title: 'Weekly Diamond Pass MLBB',
    highlight: 'Diskon Flash Sale Spesial',
    subtitle: 'Klaim 210 Diamonds + 70 Starlight Point harga termurah se-Indonesia.',
    ctaText: 'Beli Sekarang',
    link: '/game/mobile-legends',
    gradient: 'linear-gradient(90deg, rgba(8, 14, 26, 0.92) 0%, rgba(8, 14, 26, 0.75) 50%, rgba(8, 14, 26, 0.2) 100%)',
    badge: 'FLASH SALE',
    badgeColor: '#38bdf8',
  },
  {
    id: 2,
    image: bannerNewUser,
    title: 'Bonus Pengguna Baru',
    highlight: 'Kupon TRIPLESNEW',
    subtitle: 'Gunakan kode promo TRIPLESNEW saat checkout untuk potongan langsung hingga Rp 10.000.',
    ctaText: 'Klaim Kupon',
    link: '/promo',
    gradient: 'linear-gradient(90deg, rgba(4, 30, 24, 0.92) 0%, rgba(4, 30, 24, 0.75) 50%, rgba(4, 30, 24, 0.2) 100%)',
    badge: 'NEW USER BONUS',
    badgeColor: '#10b981',
  },
  {
    id: 3,
    image: bannerValo,
    title: 'Valorant Points SEA',
    highlight: 'Pengiriman 1-3 Detik',
    subtitle: 'Beli VP resmi Riot Games server Indonesia tanpa antre langsung aktif di inventory.',
    ctaText: 'Top Up VP',
    link: '/game/valorant',
    gradient: 'linear-gradient(90deg, rgba(30, 8, 16, 0.92) 0%, rgba(30, 8, 16, 0.75) 50%, rgba(30, 8, 16, 0.2) 100%)',
    badge: 'INSTANT DELIVERY',
    badgeColor: '#f43f5e',
  },
  {
    id: 4,
    image: bannerMlbb,
    title: 'Mobile Legends: Bang Bang',
    highlight: 'Layanan Terlengkap & Resmi',
    subtitle: 'Top-up Diamond MLBB, Twilight Pass, dan Weekly Pass proses instan 24/7.',
    ctaText: 'Top Up MLBB',
    link: '/game/mobile-legends',
    gradient: 'linear-gradient(90deg, rgba(18, 10, 32, 0.92) 0%, rgba(18, 10, 32, 0.75) 50%, rgba(18, 10, 32, 0.2) 100%)',
    badge: 'POPULAR GAME',
    badgeColor: '#a855f7',
  },
];

export const PromoBannerSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
  };

  const currentBanner = BANNERS[currentIndex];

  return (
    <div
      className="promo-slider-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        className="promo-banner-slide"
        style={{
          backgroundImage: `${currentBanner.gradient}, url(${currentBanner.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          backgroundRepeat: 'no-repeat',
        }}
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

        {/* Thumbnail Preview di pojok kanan (desktop) */}
        <div className="promo-banner-art-frame">
          <img src={currentBanner.image} alt={currentBanner.title} className="banner-art-thumb" />
        </div>

        {/* Tombol Navigasi Panah Kiri & Kanan */}
        <button
          type="button"
          onClick={handlePrev}
          className="slider-nav-btn prev"
          aria-label="Previous Slide"
        >
          <IconChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="slider-nav-btn next"
          aria-label="Next Slide"
        >
          <IconChevronRight size={18} />
        </button>
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
