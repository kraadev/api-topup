import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GAME_PRODUCTS } from '../data/products';
import { formatRupiah } from '../utils/formatters';
import { IconShield, IconCheck, IconAlert, IconArrowRight, IconWallet, IconUser } from '../components/Icons';

export const GameDetailPage = ({ user, onOrderSubmit, onOpenTopUpModal }) => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Cari game berdasarkan slug / id
  const game = useMemo(() => {
    return GAME_PRODUCTS.find((g) => g.slug === gameId || g.id === gameId) || GAME_PRODUCTS[0];
  }, [gameId]);

  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedItem, setSelectedItem] = useState(null);
  const [userIdInput, setUserIdInput] = useState('');
  const [zoneIdInput, setZoneIdInput] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Filter denominasi berdasarkan kategori game
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') return game.items;
    return game.items.filter((item) => item.category === selectedCategory);
  }, [game, selectedCategory]);

  const isBalanceEnough = user ? (user.saldo >= (selectedItem?.price || 0)) : true;
  const balanceDeficit = (selectedItem?.price || 0) - (user?.saldo || 0);

  const handleOpenConfirmation = (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!userIdInput.trim()) {
      setErrorMsg('Silakan masukkan User ID akun game Anda.');
      return;
    }

    if (!selectedItem) {
      setErrorMsg('Silakan pilih nominal produk yang ingin dibeli.');
      return;
    }

    if (user && user.saldo < selectedItem.price) {
      setErrorMsg(`Saldo tidak mencukupi! Saldo Anda: ${formatRupiah(user.saldo)}, Total transaksi: ${formatRupiah(selectedItem.price)}.`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleExecuteOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const zoneText = game.hasZoneId && zoneIdInput.trim() ? ` (${zoneIdInput.trim()})` : '';
    const fullItemName = `${game.name} - ${selectedItem.name} [ID: ${userIdInput.trim()}${zoneText}]`;

    const payload = {
      userId: user?.id || 1,
      item: fullItemName,
      harga: selectedItem.price,
    };

    try {
      const response = await onOrderSubmit(payload);
      setShowConfirmModal(false);
      // Arahkan ke halaman Invoice transaksi
      const createdOrderId = response?.data?.order?.id || response?.order?.id || 1;
      navigate(`/transaksi/${createdOrderId}`, { state: { orderData: response?.data || response } });
    } catch (err) {
      setErrorMsg(err.message || 'Transaksi gagal diproses oleh sistem backend.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="game-detail-page">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-nav">
        <Link to="/" className="breadcrumb-link">Katalog</Link>
        <span className="breadcrumb-sep">&gt;</span>
        <span className="breadcrumb-current">{game.name}</span>
      </div>

      {errorMsg && (
        <div className="toast-notice toast-error" style={{ marginBottom: '1.5rem' }}>
          <IconAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="game-detail-layout">
        {/* Left Column: Game Meta & Guide */}
        <aside className="game-info-sidebar">
          <div className="game-info-card">
            <div className="game-banner-box" style={{ background: game.bannerGradient }}>
              <span className="game-code-badge">{game.code}</span>
              <span className="game-publisher-tag">{game.publisher}</span>
            </div>

            <div className="game-info-body">
              <h1 className="game-detail-title">{game.name}</h1>
              <p className="game-detail-desc">{game.description}</p>

              <div className="trust-features-list">
                <div className="trust-item">
                  <IconCheck size={16} className="text-emerald" />
                  <span>Proses Otomatis 1-3 Detik</span>
                </div>
                <div className="trust-item">
                  <IconCheck size={16} className="text-emerald" />
                  <span>100% Legal & Bergaransi</span>
                </div>
                <div className="trust-item">
                  <IconCheck size={16} className="text-emerald" />
                  <span>Layanan Aktif 24 Jam Nonstop</span>
                </div>
              </div>

              <div className="id-guide-box">
                <h4 className="id-guide-title">Panduan Mencari ID Akun</h4>
                <p className="id-guide-text">{game.helperText}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Column: 4-Step Top-Up Form */}
        <main className="topup-form-main">
          <form onSubmit={handleOpenConfirmation}>
            {/* STEP 1: Masukkan Data Akun */}
            <div className="form-card-step">
              <div className="step-card-header">
                <div className="step-number-circle">1</div>
                <div>
                  <h3 className="step-title">Masukkan Data Akun</h3>
                  <p className="step-subtitle">Pastikan User ID dan Zone ID akun game Anda sudah benar</p>
                </div>
              </div>

              <div className="step-card-content">
                <div className="account-inputs-grid">
                  <div className="input-field-group">
                    <label className="field-label">User ID Game *</label>
                    <input
                      type="text"
                      className="text-input"
                      placeholder={game.userPlaceholder}
                      value={userIdInput}
                      onChange={(e) => setUserIdInput(e.target.value)}
                      required
                    />
                  </div>

                  {game.hasZoneId && (
                    <div className="input-field-group zone-input-group">
                      <label className="field-label">Zone / Server ID *</label>
                      <input
                        type="text"
                        className="text-input"
                        placeholder={game.zonePlaceholder}
                        value={zoneIdInput}
                        onChange={(e) => setZoneIdInput(e.target.value)}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STEP 2: Pilih Nominal Produk */}
            <div className="form-card-step">
              <div className="step-card-header">
                <div className="step-number-circle">2</div>
                <div>
                  <h3 className="step-title">Pilih Nominal Top-Up</h3>
                  <p className="step-subtitle">Pilih item atau paket denominasi yang ingin Anda beli</p>
                </div>
              </div>

              <div className="step-card-content">
                {/* Category Filter Tabs */}
                {game.categories && (
                  <div className="denom-category-tabs">
                    {game.categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`denom-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {/* Denomination Tiles Grid */}
                <div className="denom-tiles-grid">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`denom-tile ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="denom-tile-top">
                          <span className="denom-title">{item.name}</span>
                          {item.bonus && <span className="denom-badge-bonus">{item.bonus}</span>}
                        </div>
                        <div className="denom-tile-price">{formatRupiah(item.price)}</div>
                        <div className="denom-tile-tag">Instant Delivery</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: Pilih Metode Pembayaran */}
            <div className="form-card-step">
              <div className="step-card-header">
                <div className="step-number-circle">3</div>
                <div>
                  <h3 className="step-title">Pilih Metode Pembayaran</h3>
                  <p className="step-subtitle">Pilih sumber pembayaran untuk memproses pesanan ini</p>
                </div>
              </div>

              <div className="step-card-content">
                <div className="payment-methods-grid">
                  {/* Primary Wallet Option */}
                  <div className={`payment-method-card active-method ${!isBalanceEnough && selectedItem ? 'insufficient-funds' : ''}`}>
                    <div className="payment-card-left">
                      <div className="payment-icon-box">
                        <IconWallet size={20} />
                      </div>
                      <div>
                        <strong className="payment-name">Saldo Dompet Akun Triple S</strong>
                        <div className="payment-desc">
                          Sisa Saldo: <span className="mono-balance">{formatRupiah(user?.saldo)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="payment-card-right">
                      {selectedItem && (
                        <span className="payment-price-tag">{formatRupiah(selectedItem.price)}</span>
                      )}
                      {!isBalanceEnough && selectedItem && (
                        <button
                          type="button"
                          onClick={onOpenTopUpModal}
                          className="btn-topup-alert"
                        >
                          + Top Up Saldo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {!isBalanceEnough && selectedItem && (
                  <div className="insufficient-alert-banner">
                    <IconAlert size={16} />
                    <span>
                      Saldo akun Anda kurang <strong>{formatRupiah(balanceDeficit)}</strong>. Silakan isi saldo terlebih dahulu.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* STEP 4: Nomor Kontak WhatsApp (Opsional) */}
            <div className="form-card-step">
              <div className="step-card-header">
                <div className="step-number-circle">4</div>
                <div>
                  <h3 className="step-title">Nomor WhatsApp (Opsional)</h3>
                  <p className="step-subtitle">Kirimkan salinan struk dan bukti pembayaran ke WhatsApp</p>
                </div>
              </div>

              <div className="step-card-content">
                <div className="input-field-group">
                  <input
                    type="tel"
                    className="text-input"
                    placeholder="Contoh: 081234567890"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                  <small className="field-hint">Bukti pembayaran dan nomor invoice akan otomatis tercatat di sistem.</small>
                </div>
              </div>
            </div>

            {/* Action Bar / Submit Button */}
            <div className="checkout-action-box">
              <div className="checkout-summary-col">
                <span className="summary-tiny-label">Total Pembayaran:</span>
                <span className="summary-big-price">{formatRupiah(selectedItem?.price || 0)}</span>
                {selectedItem && (
                  <span className="summary-selected-item">{selectedItem.name}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn-solid btn-order-large"
                disabled={!selectedItem || !userIdInput.trim() || (game.hasZoneId && !zoneIdInput.trim()) || !isBalanceEnough}
              >
                <span>Beli Sekarang</span>
                <IconArrowRight size={18} />
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Modal Konfirmasi Pesanan */}
      {showConfirmModal && (
        <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Pesanan</h3>
              <button type="button" onClick={() => setShowConfirmModal(false)} className="modal-close-btn">&times;</button>
            </div>

            <div className="modal-body">
              <p className="confirm-notice">Mohon pastikan seluruh data pesanan Anda sudah sesuai sebelum melanjutkan:</p>

              <div className="confirm-details-table">
                <div className="confirm-row">
                  <span className="confirm-label">Layanan Game:</span>
                  <span className="confirm-val">{game.name}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">User ID Akun:</span>
                  <span className="confirm-val mono-val">{userIdInput} {zoneIdInput ? `(${zoneIdInput})` : ''}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Item Produk:</span>
                  <span className="confirm-val">{selectedItem?.name}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Metode Pembayaran:</span>
                  <span className="confirm-val">Saldo Dompet Akun</span>
                </div>
                <div className="confirm-divider" />
                <div className="confirm-row total-row">
                  <span className="confirm-label">Total Harga:</span>
                  <span className="confirm-val highlight-val">{formatRupiah(selectedItem?.price)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="btn-secondary-flat"
                  disabled={isSubmitting}
                >
                  Periksa Kembali
                </button>
                <button
                  type="button"
                  onClick={handleExecuteOrder}
                  className="btn-solid"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Memproses Transaksi...' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
