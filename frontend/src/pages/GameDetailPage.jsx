import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GAME_PRODUCTS } from '../data/products';
import { PAYMENT_CATEGORIES, calculatePaymentFee } from '../data/paymentMethods';
import { validatePromoCode } from '../data/promos';
import { formatRupiah } from '../utils/formatters';
import {
  IconShield,
  IconCheck,
  IconAlert,
  IconArrowRight,
  IconWallet,
  IconUser,
  IconTag,
  IconPlus,
  IconMinus,
  IconQrCode,
  IconInfo,
  IconChevronDown,
  IconClose,
} from '../components/Icons';

export const GameDetailPage = ({ user, onOrderSubmit, onOpenTopUpModal }) => {
  const { gameId } = useParams();
  const navigate = useNavigate();

  // Temukan game berdasarkan slug / id
  const game = useMemo(() => {
    return GAME_PRODUCTS.find((g) => g.slug === gameId || g.id === gameId) || GAME_PRODUCTS[0];
  }, [gameId]);

  // States Alur Top-Up
  const [formData, setFormData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedItem, setSelectedItem] = useState(game.items?.[0] || null);
  const [quantity, setQuantity] = useState(1);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoFeedback, setPromoFeedback] = useState(null);
  const [selectedMethodId, setSelectedMethodId] = useState('triple_wallet');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Modals & Bottom Sheets
  const [showIdGuideModal, setShowIdGuideModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showMobileSummarySheet, setShowMobileSummarySheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Field change handler
  const handleFieldChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // Filter denominasi berdasarkan tab kategori
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Semua') return game.items;
    return game.items.filter((item) => item.category === selectedCategory);
  }, [game, selectedCategory]);

  // Cari metode pembayaran yang dipilih
  const allPaymentMethods = useMemo(() => {
    const list = [];
    PAYMENT_CATEGORIES.forEach((cat) => list.push(...cat.methods));
    return list;
  }, []);

  const currentPaymentMethod = allPaymentMethods.find((m) => m.id === selectedMethodId) || allPaymentMethods[0];

  // Perhitungan Harga & Diskon
  const itemUnitPrice = selectedItem?.price || 0;
  const subtotal = itemUnitPrice * quantity;
  const discountAmount = appliedPromo?.discountAmount || 0;
  const adminFee = calculatePaymentFee(currentPaymentMethod, subtotal - discountAmount);
  const finalTotal = Math.max(0, subtotal - discountAmount + adminFee);

  // Status kecukupan saldo dompet
  const isWalletPayment = currentPaymentMethod.isWallet;
  const userBalance = user?.saldo || 0;
  const isBalanceSufficient = isWalletPayment ? userBalance >= finalTotal : true;
  const balanceDeficit = Math.max(0, finalTotal - userBalance);

  // Cek apakah data akun lengkap
  const isAccountComplete = useMemo(() => {
    if (!game.fields || game.fields.length === 0) return true;
    return game.fields.every((f) => !f.required || (formData[f.id] && formData[f.id].trim().length > 0));
  }, [game, formData]);

  // Handler Apply Promo
  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) {
      setPromoFeedback({ type: 'error', text: 'Masukkan kode promo terlebih dahulu.' });
      return;
    }
    const result = validatePromoCode(promoCodeInput, subtotal, game.slug);
    if (result.valid) {
      setAppliedPromo(result);
      setPromoFeedback({ type: 'success', text: result.message });
    } else {
      setAppliedPromo(null);
      setPromoFeedback({ type: 'error', text: result.message });
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoFeedback(null);
  };

  // CTA Button Text and Disabled Logic
  const getCtaState = () => {
    if (!selectedItem) return { disabled: true, text: 'Pilih Nominal Terlebih Dahulu' };
    if (!isAccountComplete) return { disabled: true, text: 'Lengkapi Data Akun Game' };
    if (isWalletPayment && !isBalanceSufficient) return { disabled: true, text: `Saldo Kurang ${formatRupiah(balanceDeficit)}` };
    return { disabled: false, text: 'Bayar Sekarang' };
  };

  const ctaState = getCtaState();

  // Validasi sebelum membuka modal konfirmasi
  const handleOpenConfirmation = (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!selectedItem) {
      setErrorMsg('Silakan pilih nominal produk.');
      return;
    }

    if (!isAccountComplete) {
      setErrorMsg('Silakan lengkapi seluruh data akun game yang bertanda bintang (*).');
      return;
    }

    if (isWalletPayment && !isBalanceSufficient) {
      setErrorMsg(`Saldo dompet Anda tidak mencukupi (${formatRupiah(userBalance)}). Total tagihan: ${formatRupiah(finalTotal)}.`);
      return;
    }

    setShowConfirmModal(true);
  };

  // Eksekusi pesanan ke backend API
  const handleExecuteOrder = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    const accountParts = Object.entries(formData)
      .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
      .join(', ');

    const fullItemName = `${game.name} - ${selectedItem.name} ${quantity > 1 ? `(${quantity}x)` : ''} [${accountParts}]`;

    const payload = {
      userId: user?.id || 1,
      item: fullItemName,
      harga: finalTotal,
    };

    try {
      const response = await onOrderSubmit(payload);
      setShowConfirmModal(false);
      const createdOrderId = response?.data?.order?.id || response?.order?.id || Date.now();
      navigate(`/transaksi/${createdOrderId}`, { state: { orderData: response?.data || response } });
    } catch (err) {
      setErrorMsg(err.message || 'Transaksi gagal diproses oleh sistem.');
      setShowConfirmModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="game-detail-page">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-link">Katalog Game</Link>
        <span className="breadcrumb-sep">&gt;</span>
        <span className="breadcrumb-current">{game.name}</span>
      </nav>

      {errorMsg && (
        <div className="toast-notice toast-error" style={{ marginBottom: '1.5rem' }}>
          <IconAlert size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="game-detail-layout">
        {/* Left Sticky Sidebar: Game Meta Info & Guide */}
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

              {/* ID Guide Helper Trigger */}
              <div className="id-guide-box">
                <div className="id-guide-header">
                  <IconInfo size={16} className="text-cyan" />
                  <h4 className="id-guide-title">Butuh Bantuan Cari ID?</h4>
                </div>
                <p className="id-guide-text">{game.helperText}</p>
                <button
                  type="button"
                  onClick={() => setShowIdGuideModal(true)}
                  className="btn-guide-modal-trigger"
                >
                  Lihat Gambar Petunjuk
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Column: 6-Step Top-Up Form */}
        <main className="topup-form-main">
          {/* STEP 1: Masukkan Data Akun */}
          <section className="form-card-step">
            <div className="step-card-header">
              <div className="step-number-circle">1</div>
              <div>
                <h3 className="step-title">Masukkan Data Akun</h3>
                <p className="step-subtitle">Pastikan data akun tujuan di bawah ini sudah benar</p>
              </div>
            </div>

            <div className="step-card-content">
              <div className="account-inputs-grid">
                {game.fields.map((field) => (
                  <div key={field.id} className="input-field-group">
                    <label className="field-label">
                      {field.label} {field.required && <span className="text-rose">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        className="text-input"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                      >
                        <option value="">-- {field.placeholder} --</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        className="text-input"
                        placeholder={field.placeholder}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    )}
                    {field.hint && <small className="field-hint">{field.hint}</small>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* STEP 2: Pilih Nominal Top-Up */}
          <section className="form-card-step">
            <div className="step-card-header">
              <div className="step-number-circle">2</div>
              <div>
                <h3 className="step-title">Pilih Nominal Produk</h3>
                <p className="step-subtitle">Pilih item atau paket denominasi yang ingin dibeli</p>
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

              {/* Denomination Cards Grid */}
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

                      <div className="denom-pricing-row">
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="denom-strike-price">{formatRupiah(item.originalPrice)}</span>
                        )}
                        <div className="denom-tile-price">{formatRupiah(item.price)}</div>
                      </div>

                      <div className="denom-tile-footer">
                        <span className="denom-tile-tag">Instant Delivery</span>
                        {isSelected && <IconCheck size={14} className="text-emerald" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* STEP 3: Jumlah Pembelian */}
          <section className="form-card-step">
            <div className="step-card-header">
              <div className="step-number-circle">3</div>
              <div>
                <h3 className="step-title">Jumlah Pembelian</h3>
                <p className="step-subtitle">Tentukan kuantitas pesanan yang ingin dibeli</p>
              </div>
            </div>

            <div className="step-card-content">
              <div className="quantity-control-row">
                <span className="quantity-label">Kuantitas Item:</span>
                <div className="quantity-stepper">
                  <button
                    type="button"
                    className="btn-qty"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    title="Kurang"
                  >
                    <IconMinus size={14} />
                  </button>
                  <span className="quantity-value">{quantity}</span>
                  <button
                    type="button"
                    className="btn-qty"
                    onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                    disabled={quantity >= 20}
                    title="Tambah"
                  >
                    <IconPlus size={14} />
                  </button>
                </div>
                <span className="quantity-subtotal-hint">
                  Subtotal: <strong>{formatRupiah(subtotal)}</strong>
                </span>
              </div>
            </div>
          </section>

          {/* STEP 4: Kupon & Kode Promo */}
          <section className="form-card-step">
            <div className="step-card-header">
              <div className="step-number-circle">4</div>
              <div>
                <h3 className="step-title">Kupon & Kode Promo</h3>
                <p className="step-subtitle">Masukkan kode promo untuk mendapatkan potongan harga</p>
              </div>
            </div>

            <div className="step-card-content">
              {!appliedPromo ? (
                <form onSubmit={handleApplyPromo} className="promo-input-form">
                  <div className="promo-input-box">
                    <IconTag size={16} className="text-muted" />
                    <input
                      type="text"
                      className="promo-input"
                      placeholder="Masukkan kode (Contoh: TRIPLESNEW)"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    />
                  </div>
                  <button type="submit" className="btn-secondary-flat" disabled={!promoCodeInput.trim()}>
                    Terapkan
                  </button>
                </form>
              ) : (
                <div className="applied-promo-card">
                  <div className="applied-promo-info">
                    <IconTag size={18} className="text-emerald" />
                    <div>
                      <span className="applied-promo-code">{appliedPromo.promo.code}</span>
                      <p className="applied-promo-desc">{appliedPromo.promo.title} &bull; Hemat {formatRupiah(appliedPromo.discountAmount)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleRemovePromo} className="btn-remove-promo">
                    Hapus
                  </button>
                </div>
              )}

              {promoFeedback && (
                <div className={`toast-notice toast-${promoFeedback.type}`} style={{ marginTop: '0.75rem' }}>
                  {promoFeedback.type === 'success' ? <IconCheck size={16} /> : <IconAlert size={16} />}
                  <span>{promoFeedback.text}</span>
                </div>
              )}
            </div>
          </section>

          {/* STEP 5: Pilih Metode Pembayaran */}
          <section className="form-card-step">
            <div className="step-card-header">
              <div className="step-number-circle">5</div>
              <div>
                <h3 className="step-title">Pilih Metode Pembayaran</h3>
                <p className="step-subtitle">Pilih metode pembayaran yang paling nyaman untuk Anda</p>
              </div>
            </div>

            <div className="step-card-content">
              <div className="payment-categories-accordion">
                {PAYMENT_CATEGORIES.map((category) => (
                  <div key={category.id} className="payment-category-block">
                    <div className="category-block-header">
                      <span className="category-block-title">{category.name}</span>
                      {category.badge && <span className="category-badge">{category.badge}</span>}
                    </div>

                    <div className="payment-options-grid">
                      {category.methods.map((method) => {
                        const isSelected = selectedMethodId === method.id;
                        const methodFee = calculatePaymentFee(method, subtotal - discountAmount);
                        const methodTotal = subtotal - discountAmount + methodFee;

                        return (
                          <div
                            key={method.id}
                            className={`payment-method-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => setSelectedMethodId(method.id)}
                          >
                            <div className="payment-card-left">
                              <div className="payment-icon-box">
                                {method.isWallet ? <IconWallet size={20} /> : <IconQrCode size={20} />}
                              </div>
                              <div>
                                <strong className="payment-name">{method.name}</strong>
                                {method.isWallet ? (
                                  <span className="payment-desc">
                                    Sisa Saldo: <span className="mono-balance">{formatRupiah(userBalance)}</span>
                                  </span>
                                ) : (
                                  <span className="payment-desc">Proses: {method.processingTime}</span>
                                )}
                              </div>
                            </div>

                            <div className="payment-card-right">
                              <span className="payment-price-tag">{formatRupiah(methodTotal)}</span>
                              {isSelected && <IconCheck size={16} className="text-emerald" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Insufficient balance alert if wallet is selected */}
              {isWalletPayment && !isBalanceSufficient && (
                <div className="insufficient-alert-banner">
                  <div className="alert-left">
                    <IconAlert size={18} />
                    <span>
                      Saldo akun kurang <strong>{formatRupiah(balanceDeficit)}</strong> untuk menyelesaikan pesanan ini.
                    </span>
                  </div>
                  <button type="button" onClick={onOpenTopUpModal} className="btn-topup-alert">
                    + Isi Saldo
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* STEP 6: Kontak WhatsApp (Opsional) */}
          <section className="form-card-step">
            <div className="step-card-header">
              <div className="step-number-circle">6</div>
              <div>
                <h3 className="step-title">Nomor WhatsApp (Opsional)</h3>
                <p className="step-subtitle">Kirimkan salinan struk bukti transaksi ke nomor WhatsApp Anda</p>
              </div>
            </div>

            <div className="step-card-content">
              <div className="input-field-group">
                <input
                  type="tel"
                  className="text-input"
                  placeholder="Contoh: 081234567890"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                <small className="field-hint">
                  Kami menggunakan nomor ini untuk mengirimkan salinan struk transaksi dan bantuan layanan pelanggan 24/7.
                </small>
              </div>
            </div>
          </section>

          {/* Desktop Sticky Order Summary Box */}
          <div className="checkout-summary-container">
            <div className="checkout-summary-header">
              <h3 className="summary-title">Ringkasan Pembayaran</h3>
              <span className="summary-item-badge">{selectedItem?.name} ({quantity}x)</span>
            </div>

            <div className="summary-breakdown-list">
              <div className="summary-row">
                <span className="summary-label">Harga Satuan ({quantity}x)</span>
                <span className="summary-val">{formatRupiah(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="summary-row text-emerald">
                  <span className="summary-label">Diskon Kupon Promo</span>
                  <span className="summary-val">- {formatRupiah(discountAmount)}</span>
                </div>
              )}

              <div className="summary-row">
                <span className="summary-label">Biaya Admin ({currentPaymentMethod.name})</span>
                <span className="summary-val">{adminFee === 0 ? 'GRATIS' : formatRupiah(adminFee)}</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-total-line">
                <div>
                  <span className="total-label">Total Pembayaran</span>
                  <div className="total-price-figure">{formatRupiah(finalTotal)}</div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenConfirmation}
                  className="btn-solid btn-checkout-main"
                  disabled={ctaState.disabled}
                >
                  <span>{ctaState.text}</span>
                  <IconArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Action Bar */}
      <div className="mobile-sticky-checkout-bar">
        <div className="mobile-bar-summary" onClick={() => setShowMobileSummarySheet(true)}>
          <span className="mobile-bar-label">Total Bayar:</span>
          <span className="mobile-bar-price">{formatRupiah(finalTotal)}</span>
          <span className="mobile-bar-details-link">
            <span>Rincian</span>
            <IconChevronDown size={14} />
          </span>
        </div>

        <button
          type="button"
          onClick={handleOpenConfirmation}
          className="btn-solid btn-mobile-checkout"
          disabled={ctaState.disabled}
        >
          {ctaState.text}
        </button>
      </div>

      {/* Mobile Bottom Sheet for Full Summary */}
      {showMobileSummarySheet && (
        <div className="modal-backdrop" onClick={() => setShowMobileSummarySheet(false)}>
          <div className="bottom-sheet-card" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle-bar" />
            <div className="modal-header">
              <h3 className="modal-title">Rincian Pesanan</h3>
              <button type="button" onClick={() => setShowMobileSummarySheet(false)} className="modal-close-btn">&times;</button>
            </div>

            <div className="modal-body">
              <div className="confirm-details-table">
                <div className="confirm-row">
                  <span className="confirm-label">Layanan Game:</span>
                  <span className="confirm-val">{game.name}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Item Produk:</span>
                  <span className="confirm-val">{selectedItem?.name} ({quantity}x)</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-label">Subtotal:</span>
                  <span className="confirm-val">{formatRupiah(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="confirm-row text-emerald">
                    <span className="confirm-label">Diskon Promo:</span>
                    <span className="confirm-val">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div className="confirm-row">
                  <span className="confirm-label">Biaya Admin:</span>
                  <span className="confirm-val">{adminFee === 0 ? 'GRATIS' : formatRupiah(adminFee)}</span>
                </div>
                <div className="confirm-divider" />
                <div className="confirm-row total-row">
                  <span className="confirm-label font-bold">Total Pembayaran:</span>
                  <span className="confirm-val highlight-val">{formatRupiah(finalTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowMobileSummarySheet(false);
                  handleOpenConfirmation();
                }}
                className="btn-solid"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={ctaState.disabled}
              >
                {ctaState.text}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ID Guide Tutorial */}
      {showIdGuideModal && (
        <div className="modal-backdrop" onClick={() => setShowIdGuideModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Panduan Mencari ID Akun</h3>
              <button type="button" onClick={() => setShowIdGuideModal(false)} className="modal-close-btn">&times;</button>
            </div>
            <div className="modal-body">
              <div className="guide-illustration-box">
                <div className="guide-box-header">
                  <IconGamepad size={24} className="text-emerald" />
                  <strong>{game.name}</strong>
                </div>
                <p className="guide-box-desc">{game.helperText}</p>
                <div className="guide-example-badge">
                  <span>Contoh Format User ID: <strong>12345678</strong></span>
                  {game.hasZoneId && <span>Zone ID: <strong>2123</strong></span>}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowIdGuideModal(false)} className="btn-solid">
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Pesanan */}
      {showConfirmModal && (
        <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Konfirmasi Pembayaran</h3>
              <button type="button" onClick={() => setShowConfirmModal(false)} className="modal-close-btn">&times;</button>
            </div>

            <div className="modal-body">
              <p className="confirm-notice">Mohon periksa kembali detail pesanan Anda sebelum melanjutkan:</p>

              <div className="confirm-details-table">
                <div className="confirm-row">
                  <span className="confirm-label">Layanan Game:</span>
                  <span className="confirm-val">{game.name}</span>
                </div>

                {Object.entries(formData).map(([k, v]) => (
                  <div key={k} className="confirm-row">
                    <span className="confirm-label">{k.toUpperCase()}:</span>
                    <span className="confirm-val mono-val">{v}</span>
                  </div>
                ))}

                <div className="confirm-row">
                  <span className="confirm-label">Item Produk:</span>
                  <span className="confirm-val">{selectedItem?.name} ({quantity}x)</span>
                </div>

                <div className="confirm-row">
                  <span className="confirm-label">Metode Pembayaran:</span>
                  <span className="confirm-val">{currentPaymentMethod.name}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="confirm-row text-emerald">
                    <span className="confirm-label">Potongan Promo:</span>
                    <span className="confirm-val">- {formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="confirm-divider" />

                <div className="confirm-row total-row">
                  <span className="confirm-label font-bold">Total Pembayaran:</span>
                  <span className="confirm-val highlight-val">{formatRupiah(finalTotal)}</span>
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
                  {isSubmitting ? 'Memproses Transaksi...' : 'Konfirmasi & Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
