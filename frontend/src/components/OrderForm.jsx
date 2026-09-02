import React, { useState } from 'react';
import { GAME_PRODUCTS } from '../data/products';
import { formatRupiah } from '../utils/formatters';
import { IconGamepad, IconUser, IconShield, IconArrowRight, IconCheck, IconAlert } from './Icons';

export const OrderForm = ({ user, onOrderSubmit, notification, setNotification }) => {
  const [selectedGameId, setSelectedGameId] = useState(GAME_PRODUCTS[0].id);
  const [gameUserId, setGameUserId] = useState('');
  const [gameZoneId, setGameZoneId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentGame = GAME_PRODUCTS.find((g) => g.id === selectedGameId) || GAME_PRODUCTS[0];
  const isBalanceEnough = user ? (user.saldo >= (selectedItem?.price || 0)) : true;
  const remainingAfterOrder = (user?.saldo || 0) - (selectedItem?.price || 0);

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
    setSelectedItem(null);
    setNotification(null);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setNotification(null);

    if (!gameUserId.trim()) {
      setNotification({ type: 'error', text: 'Masukkan ID akun game tujuan transaksi.' });
      return;
    }

    if (!selectedItem) {
      setNotification({ type: 'error', text: 'Pilih denominasi produk yang ingin dibeli.' });
      return;
    }

    if (user && user.saldo < selectedItem.price) {
      setNotification({
        type: 'error',
        text: `Saldo tidak mencukupi (${formatRupiah(user.saldo)}). Total harga transaksi: ${formatRupiah(selectedItem.price)}.`,
      });
      return;
    }

    const zoneInfo = currentGame.hasZoneId && gameZoneId.trim() ? ` (Zone: ${gameZoneId.trim()})` : '';
    const itemString = `${currentGame.name} - ${selectedItem.name} [ID: ${gameUserId.trim()}${zoneInfo}]`;

    const payload = {
      userId: user?.id || 1,
      item: itemString,
      harga: selectedItem.price,
    };

    setLoading(true);
    try {
      await onOrderSubmit(payload);
      setNotification({
        type: 'success',
        text: `Transaksi berhasil. Pembelian ${selectedItem.name} untuk ${currentGame.name} telah diproses.`,
      });
      setSelectedItem(null);
      setGameUserId('');
      setGameZoneId('');
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Transaksi gagal diproses oleh sistem.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 1. Pilih Game */}
      <div className="section-panel">
        <div className="section-panel-header">
          <div className="section-heading">
            <span className="step-indicator">1</span>
            <span>Pilih Layanan</span>
          </div>
          <span className="brand-tag">{GAME_PRODUCTS.length} Layanan Aktif</span>
        </div>

        <div className="service-grid">
          {GAME_PRODUCTS.map((game) => {
            const isSelected = selectedGameId === game.id;
            return (
              <div
                key={game.id}
                className={`service-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleGameSelect(game.id)}
              >
                <div className="service-card-top">
                  <span className="service-code">{game.code}</span>
                  {game.badge && <span className="service-badge">{game.badge}</span>}
                </div>
                <strong className="service-title">{game.name}</strong>
                <span className="service-publisher">{game.publisher}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Masukkan ID Akun */}
      <div className="section-panel">
        <div className="section-panel-header">
          <div className="section-heading">
            <span className="step-indicator">2</span>
            <span>Identitas Akun {currentGame.name}</span>
          </div>
          <span className="brand-tag">Verifikasi Otomatis</span>
        </div>

        <div className="account-fields-row">
          <div className="field-group">
            <label className="field-label">User ID Akun *</label>
            <input
              type="text"
              className="text-input"
              placeholder={currentGame.userPlaceholder}
              value={gameUserId}
              onChange={(e) => setGameUserId(e.target.value)}
              required
            />
          </div>

          {currentGame.hasZoneId && (
            <div className="field-group" style={{ maxWidth: '160px' }}>
              <label className="field-label">Server / Zone ID</label>
              <input
                type="text"
                className="text-input"
                placeholder={currentGame.zonePlaceholder}
                value={gameZoneId}
                onChange={(e) => setGameZoneId(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Pilih Denominasi */}
      <div className="section-panel">
        <div className="section-panel-header">
          <div className="section-heading">
            <span className="step-indicator">3</span>
            <span>Pilih Denominasi</span>
          </div>
          <span className="brand-tag">{currentGame.items.length} Opsi</span>
        </div>

        <div className="denom-grid">
          {currentGame.items.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <div
                key={item.id}
                className={`denom-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="denom-name">{item.name}</div>
                <div className="denom-price">{formatRupiah(item.price)}</div>
                {item.bonus && <div className="denom-bonus">{item.bonus}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded / Floating Checkout Panel on Mobile or Right Column Container */}
      <div className="checkout-panel">
        <div className="section-panel-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem' }}>
          <div className="section-heading">
            <IconShield size={16} />
            <span>Ringkasan Transaksi</span>
          </div>
          <span className="brand-tag">Instant Delivery</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Layanan</span>
          <span className="summary-value">{currentGame.name}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Item Pilihan</span>
          <span className="summary-value">{selectedItem ? selectedItem.name : '-'}</span>
        </div>

        <div className="summary-row">
          <span className="summary-label">Tujuan Akun</span>
          <span className="summary-value">
            {gameUserId ? `${gameUserId}${gameZoneId ? ` (${gameZoneId})` : ''}` : '-'}
          </span>
        </div>

        <div className="summary-divider" />

        <div className="summary-row">
          <span className="summary-label">Saldo Saat Ini</span>
          <span className="summary-value">{formatRupiah(user?.saldo)}</span>
        </div>

        {selectedItem && (
          <div className="summary-row">
            <span className="summary-label">Estimasi Sisa Saldo</span>
            <span
              className="summary-value"
              style={{ color: remainingAfterOrder < 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}
            >
              {remainingAfterOrder < 0 ? `Kurang ${formatRupiah(Math.abs(remainingAfterOrder))}` : formatRupiah(remainingAfterOrder)}
            </span>
          </div>
        )}

        <div className="summary-total-row">
          <span className="summary-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Pembayaran</span>
          <div className="total-figure">{formatRupiah(selectedItem?.price || 0)}</div>
        </div>

        <button
          type="button"
          onClick={handleBuy}
          className="btn-solid"
          disabled={loading || !selectedItem || !gameUserId.trim() || !isBalanceEnough}
        >
          {loading ? (
            <span>Memproses Transaksi...</span>
          ) : (
            <>
              <span>Konfirmasi & Bayar</span>
              <IconArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
