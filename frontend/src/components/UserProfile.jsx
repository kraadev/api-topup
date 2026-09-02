import React, { useState } from 'react';
import { formatRupiah } from '../utils/formatters';
import { IconWallet, IconRefresh, IconPlus, IconCheck, IconAlert } from './Icons';

export const UserProfile = ({ user, loading, onTopUp, onRefresh, feedback, setFeedback }) => {
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(topUpAmount);

    if (!amount || amount <= 0) {
      setFeedback({ type: 'error', text: 'Masukkan nominal saldo yang valid (min. Rp 10.000)' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onTopUp(amount);
      setFeedback({
        type: 'success',
        text: `Saldo berhasil ditambahkan sebesar ${formatRupiah(amount)}.`,
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
    <div className="wallet-card">
      <div className="wallet-header">
        <div className="wallet-title">Dompet Akun</div>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-secondary-flat"
          title="Sinkronkan saldo dengan database"
          disabled={loading}
          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
        >
          <IconRefresh size={13} className={loading ? 'spin' : ''} />
          <span>{loading ? 'Sinkron...' : 'Sync'}</span>
        </button>
      </div>

      <div className="wallet-balance">
        {loading ? '...' : formatRupiah(user?.saldo)}
      </div>

      <div className="deposit-widget">
        <div className="field-label" style={{ marginBottom: '0.5rem' }}>Top-Up Saldo Dompet</div>
        <form onSubmit={handleTopUpSubmit}>
          <div className="deposit-input-row">
            <input
              type="number"
              className="text-input"
              placeholder="Nominal (Rp)"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              min="10000"
              step="5000"
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="btn-secondary-flat"
              disabled={isSubmitting || !topUpAmount}
              style={{ whiteSpace: 'nowrap' }}
            >
              <IconPlus size={14} />
              <span>{isSubmitting ? 'Proses...' : 'Isi Saldo'}</span>
            </button>
          </div>

          <div className="deposit-chips">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                className="chip-action"
                onClick={() => setTopUpAmount(amt.toString())}
                disabled={isSubmitting}
              >
                +{formatRupiah(amt)}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
};
