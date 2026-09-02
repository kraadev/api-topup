import React, { useState } from 'react';
import { GAME_PRODUCTS } from '../data/products';
import { formatRupiah } from '../utils/formatters';

export const OrderForm = ({ user, onOrderSubmit }) => {
  const [selectedGameId, setSelectedGameId] = useState(GAME_PRODUCTS[0].id);
  const [gameUserId, setGameUserId] = useState('');
  const [gameZoneId, setGameZoneId] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const currentGame = GAME_PRODUCTS.find((g) => g.id === selectedGameId) || GAME_PRODUCTS[0];
  const isBalanceEnough = user ? user.saldo >= (selectedItem?.price || 0) : true;

  const handleGameSelect = (gameId) => {
    setSelectedGameId(gameId);
    setSelectedItem(null);
    setNotification(null);
  };

  const handleBuy = async (e) => {
    e.preventDefault();
    setNotification(null);

    // Validasi User ID Game
    if (!gameUserId.trim()) {
      setNotification({ type: 'error', text: 'Silakan isi User ID akun game Anda!' });
      return;
    }

    // Validasi Item Pilihan
    if (!selectedItem) {
      setNotification({ type: 'error', text: 'Silakan pilih nominal produk yang ingin dibeli!' });
      return;
    }

    // Validasi Kecukupan Saldo
    if (user && user.saldo < selectedItem.price) {
      setNotification({
        type: 'error',
        text: `Saldo akun tidak mencukupi! Sisa saldo: ${formatRupiah(user.saldo)}, Total harga: ${formatRupiah(selectedItem.price)}. Silakan isi saldo di tab Profil & Saldo.`,
      });
      return;
    }

    // Susun payload sesuai kebutuhan backend Golang
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
        text: `Transaksi Berhasil! Pembelian ${selectedItem.name} untuk ${currentGame.name} berhasil diproses.`,
      });
      // Reset form setelah berhasil
      setGameUserId('');
      setGameZoneId('');
      setSelectedItem(null);
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Transaksi gagal diproses oleh server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card order-card">
      <div className="order-header">
        <div>
          <h2 className="section-title">Form Order & Transaksi</h2>
          <p className="section-desc">Pilih game, masukkan ID akun, dan beli produk digital secara instan.</p>
        </div>
        <div className="user-saldo-pill">
          <span>Saldo Anda:</span>
          <strong>{formatRupiah(user?.saldo)}</strong>
        </div>
      </div>

      {notification && (
        <div className={`alert alert-${notification.type}`}>
          {notification.type === 'success' ? '🎉 ' : '⚠️ '}
          {notification.text}
        </div>
      )}

      {/* 1. Pilih Game */}
      <div className="form-step">
        <label className="step-label">
          <span className="step-num">1</span> Pilih Kategori / Game
        </label>
        <div className="games-grid">
          {GAME_PRODUCTS.map((game) => {
            const isActive = selectedGameId === game.id;
            return (
              <button
                key={game.id}
                type="button"
                className={`game-btn ${isActive ? 'game-btn-active' : ''}`}
                onClick={() => handleGameSelect(game.id)}
              >
                <div className="game-btn-top">
                  <span className="game-icon">{game.icon}</span>
                  {game.badge && <span className="game-badge">{game.badge}</span>}
                </div>
                <div className="game-info">
                  <strong className="game-title">{game.name}</strong>
                  <span className="game-category">{game.category}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleBuy}>
        {/* 2. Masukkan Akun Game */}
        <div className="form-step">
          <label className="step-label">
            <span className="step-num">2</span> Masukkan Data Akun {currentGame.name}
          </label>
          <div className="inputs-row">
            <div className="input-field">
              <label className="input-label">User ID Game *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 12345678"
                value={gameUserId}
                onChange={(e) => setGameUserId(e.target.value)}
                required
              />
            </div>

            {currentGame.hasZoneId && (
              <div className="input-field zone-field">
                <label className="input-label">Zone ID (Server)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: 2123"
                  value={gameZoneId}
                  onChange={(e) => setGameZoneId(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 3. Pilih Nominal Top-Up */}
        <div className="form-step">
          <label className="step-label">
            <span className="step-num">3</span> Pilih Nominal Produk
          </label>
          <div className="items-grid">
            {currentGame.items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`item-box ${isSelected ? 'item-selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="item-name">{item.name}</div>
                  <div className="item-cost">{formatRupiah(item.price)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Konfirmasi & Tombol Checkout */}
        <div className="checkout-bar">
          <div className="checkout-summary">
            <span className="summary-label">Total Harga:</span>
            <div className="summary-price">{formatRupiah(selectedItem?.price || 0)}</div>
            {!isBalanceEnough && selectedItem && (
              <small className="insufficient-warning">Saldo tidak cukup!</small>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-buy"
            disabled={loading || !selectedItem || !isBalanceEnough}
          >
            {loading ? 'Memproses Transaksi...' : 'Beli Sekarang 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
};
