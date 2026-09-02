import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';

export const UserProfile = ({ user, loading, onTopUp, error, onRefresh }) => {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);

    if (!amount || amount <= 0) {
      setFeedback({ type: 'error', text: 'Masukkan nominal saldo yang valid (min. Rp 10.000)' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await onTopUp(amount);
      setFeedback({
        type: 'success',
        text: `Top-up berhasil! Saldo sebesar ${formatRupiah(amount)} telah ditambahkan.`,
      });
      setTopUpAmount('');
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Gagal menambahkan saldo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [20000, 50000, 100000, 250000, 500000];

  return (
    <div className="card user-card">
      <div className="card-header">
        <div className="user-profile-info">
          <div className="avatar-badge">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="user-title">{user?.username || 'User Akun'}</h2>
            <p className="user-id-text">ID Pengguna: #{user?.id || 1}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-icon"
          title="Segarkan data dari server"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Saldo Display Box */}
      <div className="saldo-banner">
        <div className="saldo-content">
          <span className="saldo-tag">Sisa Saldo Anda</span>
          <h3 className="saldo-figure">
            {loading ? 'Memuat...' : formatRupiah(user?.saldo)}
          </h3>
        </div>
        <div className="saldo-icon">💳</div>
      </div>

      {error && <div className="alert alert-warning">⚠️ {error}</div>}
      {feedback && (
        <div className={`alert alert-${feedback.type}`}>
          {feedback.type === 'success' ? '✅ ' : '❌ '}
          {feedback.text}
        </div>
      )}

      {/* Form Top Up Saldo */}
      <div className="topup-container">
        <h3 className="section-title">Isi Saldo (Top-Up Dompet)</h3>
        <p className="section-desc">
          Tambahkan saldo akun untuk melakukan pembelian produk game dan digital.
        </p>

        <form onSubmit={handleTopUpSubmit} className="topup-form">
          <div className="input-group">
            <span className="input-prefix">Rp</span>
            <input
              type="number"
              className="form-input with-prefix"
              placeholder="Contoh: 50000"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              min="10000"
              step="5000"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isSubmitting || !topUpAmount}
            >
              {isSubmitting ? 'Memproses...' : '+ Isi Saldo'}
            </button>
          </div>

          <div className="quick-selection">
            <span className="quick-label">Pilihan Cepat:</span>
            <div className="chips-wrapper">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`chip-btn ${Number(topUpAmount) === amt ? 'chip-active' : ''}`}
                  onClick={() => setTopUpAmount(amt.toString())}
                  disabled={isSubmitting}
                >
                  +{formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
