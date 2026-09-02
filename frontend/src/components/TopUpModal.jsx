import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { IconWallet, IconPlus, IconCheck, IconAlert } from './Icons';

export const TopUpModal = ({ isOpen, onClose, user, onTopUp }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  if (!isOpen) return null;

  const quickAmounts = [20000, 50000, 100000, 250000, 500000, 1000000];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      setFeedback({ type: 'error', text: 'Masukkan nominal saldo yang valid (min. Rp 10.000)' });
      return;
    }

    setLoading(true);
    setFeedback(null);
    try {
      await onTopUp(num);
      setFeedback({ type: 'success', text: `Saldo berhasil ditambahkan sebesar ${formatRupiah(num)}.` });
      setAmount('');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal menambahkan saldo.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <IconWallet size={20} />
            <h3 className="modal-title">Top-Up Saldo Akun</h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          <div className="current-balance-banner">
            <span className="banner-label">Saldo Aktif Saat Ini</span>
            <span className="banner-figure">{formatRupiah(user?.saldo)}</span>
          </div>

          {feedback && (
            <div className={`toast-notice toast-${feedback.type}`} style={{ margin: '1rem 0' }}>
              {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlert size={16} />}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="field-group">
              <label className="field-label">Nominal Deposit (Rp)</label>
              <input
                type="number"
                className="text-input"
                placeholder="Contoh: 100000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="10000"
                step="5000"
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label className="field-label">Pilihan Cepat</label>
              <div className="deposit-chips">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={`chip-action ${Number(amount) === q ? 'active' : ''}`}
                    onClick={() => setAmount(q.toString())}
                    disabled={loading}
                  >
                    +{formatRupiah(q)}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn-secondary-flat" disabled={loading}>
                Batal
              </button>
              <button type="submit" className="btn-solid" disabled={loading || !amount} style={{ width: 'auto', minWidth: '140px' }}>
                {loading ? 'Memproses...' : 'Konfirmasi Top-Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
