import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ACTIVE_PROMOS } from '../data/promos';
import { formatRupiah } from '../utils/formatters';
import { IconTag, IconCopy, IconCheck, IconArrowRight, IconSparkles } from '../components/Icons';

export const PromoPage = () => {
  const [copiedCode, setCopiedCode] = useState(null);

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="promo-page">
      <div className="page-header text-center">
        <div className="status-icon-box success" style={{ margin: '0 auto 1rem' }}>
          <IconTag size={32} />
        </div>
        <h1 className="page-title">Promo & Kupon Diskon Aktif</h1>
        <p className="page-desc" style={{ maxWidth: '600px', margin: '0.4rem auto 0' }}>
          Gunakan kode promo resmi di bawah saat checkout transaksi untuk mendapatkan potongan harga spesial.
        </p>
      </div>

      <div className="promo-cards-grid">
        {ACTIVE_PROMOS.map((promo) => {
          const isCopied = copiedCode === promo.code;
          return (
            <div key={promo.code} className="promo-item-card">
              <div className="promo-card-top">
                <span className="promo-badge-tag">{promo.badge}</span>
                <span className="promo-expiry">Berlaku s.d. {promo.expiresAt}</span>
              </div>

              <div className="promo-card-content">
                <h3 className="promo-item-title">{promo.title}</h3>
                <p className="promo-item-desc">{promo.description}</p>
                
                <div className="promo-term-box">
                  <span>Minimal transaksi: <strong>{formatRupiah(promo.minTransaction)}</strong></span>
                </div>
              </div>

              <div className="promo-card-footer">
                <div className="promo-code-container">
                  <span className="promo-code-text">{promo.code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(promo.code)}
                    className="btn-copy-promo"
                    title="Salin Kode Promo"
                  >
                    {isCopied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    <span>{isCopied ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                <Link to="/" className="btn-solid promo-use-btn">
                  <span>Gunakan</span>
                  <IconArrowRight size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
