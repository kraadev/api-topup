import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRupiah } from '../utils/formatters';
import { PAYMENT_CATEGORIES } from '../data/paymentMethods';
import { IconWallet, IconPlus, IconCheck, IconAlert, IconQrCode, IconArrowRight } from './Icons';

export const TopUpModal = ({ isOpen, onClose, user, onTopUp }) => {
  const [amount, setAmount] = useState('50000');
  const [selectedMethodId, setSelectedMethodId] = useState('qris');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const quickAmounts = [20000, 50000, 100000, 250000, 500000, 1000000];

  // Saring metode pembayaran (hanya QRIS dan Virtual Account, tanpa Saldo Dompet)
  const depositCategories = PAYMENT_CATEGORIES.map((cat) => ({
    ...cat,
    methods: cat.methods.filter((m) => !m.isWallet),
  })).filter((cat) => cat.methods.length > 0);

  const selectedMethod = depositCategories
    .flatMap((c) => c.methods)
    .find((m) => m.id === selectedMethodId) || {
    id: 'qris',
    name: 'QRIS Instant Pay (Semua E-Wallet & Bank)',
    type: 'QRIS',
    processingTime: 'Instan 1-3 detik',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num < 10000) {
      setFeedback({ type: 'error', text: 'Minimal nominal deposit saldo adalah Rp 10.000' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const depositOrderId = `DEP-${Math.floor(100000 + Math.random() * 900000)}`;
      const depositOrder = {
        id: depositOrderId,
        user_id: user?.id || 1,
        item: `Deposit Saldo Dompet Triple S (${formatRupiah(num)})`,
        harga: num,
        status: 'Pending',
        isDeposit: true,
        depositAmount: num,
        paymentMethod: selectedMethod,
        created_at: new Date().toISOString(),
      };

      onClose();
      // Redirect ke Invoice Page untuk menampilkan QRIS atau Nomor Virtual Account
      navigate(`/transaksi/${depositOrderId}`, {
        state: {
          orderData: depositOrder,
          paymentMethod: selectedMethod,
        },
      });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Gagal memproses deposit.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-deposit-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <IconWallet size={20} />
            <h3 className="modal-title">Top-Up Saldo Dompet</h3>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">&times;</button>
        </div>

        <div className="modal-body">
          <div className="current-balance-banner">
            <span className="banner-label">Saldo Aktif Saat Ini:</span>
            <span className="banner-figure">{formatRupiah(user?.saldo || 0)}</span>
          </div>

          {feedback && (
            <div className={`toast-notice toast-${feedback.type}`} style={{ margin: '0.75rem 0' }}>
              {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlert size={16} />}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="field-group">
              <label className="field-label">Nominal Deposit Saldo (Rp)</label>
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

            <div className="field-group" style={{ marginTop: '0.85rem' }}>
              <label className="field-label">Pilihan Cepat Nominal</label>
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

            {/* Pilihan Metode Pembayaran Deposit */}
            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label className="field-label">Pilih Metode Pembayaran Deposit</label>
              <div className="deposit-methods-list">
                {depositCategories.map((cat) => (
                  <div key={cat.id} className="deposit-cat-block">
                    <span className="deposit-cat-label">{cat.name}</span>
                    <div className="deposit-methods-grid">
                      {cat.methods.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        return (
                          <div
                            key={method.id}
                            className={`deposit-method-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedMethodId(method.id)}
                          >
                            <div className="deposit-method-info">
                              <span className="deposit-method-name">{method.name}</span>
                              <span className="deposit-method-tag">{method.processingTime}</span>
                            </div>
                            {isSelected && <IconCheck size={14} className="text-emerald" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.25rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary-flat" disabled={loading}>
                Batal
              </button>
              <button
                type="submit"
                className="btn-solid"
                disabled={loading || !amount || Number(amount) < 10000}
                style={{ width: 'auto', minWidth: '170px' }}
              >
                <span>Lanjut Pembayaran</span>
                <IconArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
