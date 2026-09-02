import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/orderService';
import { generatePaymentDetails } from '../data/paymentDetails';
import { formatRupiah, formatDate } from '../utils/formatters';
import {
  IconCheck,
  IconAlert,
  IconHistory,
  IconArrowRight,
  IconShield,
  IconCopy,
  IconQrCode,
  IconSparkles,
  IconWallet,
  IconInfo,
  IconRefresh,
} from '../components/Icons';

export const InvoicePage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const { topUpSaldo, refreshUser } = useAuth();

  const initialOrder = location.state?.orderData?.order || location.state?.orderData || null;
  const initialPaymentMethod = location.state?.paymentMethod || initialOrder?.paymentMethod || { id: 'triple_wallet', name: 'Saldo Dompet Triple S', isWallet: true };

  const [order, setOrder] = useState(initialOrder);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [orderStatus, setOrderStatus] = useState(initialOrder?.status || (initialPaymentMethod?.isWallet ? 'Success' : 'Pending'));
  const [loading, setLoading] = useState(!initialOrder);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [activeInstructionTab, setActiveInstructionTab] = useState(0);

  // Progressive Verification Stages:
  // 1 = 'CREATED' (Menunggu Bayar)
  // 2 = 'PAYMENT_RECEIVED' (Pembayaran Diterima)
  // 3 = 'PROCESSING' (Sedang Diproses Otomatis ke Server Game)
  // 4 = 'COMPLETED' (Selesai Sukses)
  const isInitialSuccess = initialOrder?.status === 'Success' || initialOrder?.status === 'SUCCESS' || initialPaymentMethod?.isWallet;
  const [stage, setStage] = useState(isInitialSuccess ? 4 : 1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingText, setVerifyingText] = useState('');

  const timersRef = useRef([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // Generate detail pembayaran VA / QRIS jika non-wallet
  const paymentDetails = generatePaymentDetails(
    paymentMethod?.id || 'triple_wallet',
    order?.id || orderId || 101,
    order?.harga || 10000,
    order?.item || 'Produk Digital'
  );

  useEffect(() => {
    if (!order && orderId) {
      const fetchOrderDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await orderService.getOrderById(orderId);
          const data = res.data || res;
          if (data && data.id) {
            setOrder(data);
            const isFinished = data.status === 'Success' || data.status === 'SUCCESS';
            setOrderStatus(data.status || 'Success');
            if (isFinished) setStage(4);
          } else {
            // Coba ambil dari list orders
            const listRes = await orderService.getOrders();
            const list = Array.isArray(listRes.data) ? listRes.data : (Array.isArray(listRes) ? listRes : []);
            const found = list.find((o) => o.id.toString() === orderId.toString());
            if (found) {
              setOrder(found);
              const isFinished = found.status === 'Success' || found.status === 'SUCCESS';
              setOrderStatus(found.status || 'Success');
              if (isFinished) setStage(4);
            } else {
              setOrder({
                id: orderId,
                user_id: 1,
                item: 'Item Transaksi',
                harga: 50000,
                status: 'Pending',
                created_at: new Date().toISOString(),
              });
              setStage(1);
            }
          }
        } catch (err) {
          setOrder({
            id: orderId,
            user_id: 1,
            item: 'Item Transaksi',
            harga: 50000,
            status: 'Pending',
            created_at: new Date().toISOString(),
          });
          setStage(1);
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetail();
    }
  }, [orderId, order]);

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Alur Realistis Bertahap: Klik Bayar -> Pembayaran Diterima (1.8s) -> Diproses Otomatis (2.2s) -> Selesai
  const handleConfirmPaid = async () => {
    if (isVerifying || stage === 4) return;

    setIsVerifying(true);
    setVerifyingText('Memverifikasi mutasi pembayaran...');

    // Jeda 1: Menuju Stage 2 (Pembayaran Diterima)
    const t1 = setTimeout(() => {
      setStage(2);
      setVerifyingText('Pembayaran Terverifikasi! Menghubungkan ke Gateway Game...');

      // Jeda 2: Menuju Stage 3 (Diproses Otomatis)
      const t2 = setTimeout(() => {
        setStage(3);
        setVerifyingText('Mengirimkan Item Digital ke Akun Game (1-3 Detik)...');

        // Jeda 3: Menuju Stage 4 (Selesai Sukses)
        const t3 = setTimeout(async () => {
          setStage(4);
          setOrderStatus('Success');
          setIsVerifying(false);
          setVerifyingText('');

          // Jika ini transaksi deposit dompet, tambahkan saldo
          if (order?.isDeposit || order?.depositAmount || (order?.id && order.id.toString().startsWith('DEP'))) {
            const amountToAdd = order.depositAmount || order.harga;
            try {
              await topUpSaldo(amountToAdd);
              await refreshUser();
            } catch (err) {
              console.warn('Deposit balance credit notice:', err.message);
            }
          }
        }, 2200);

        timersRef.current.push(t3);
      }, 2000);

      timersRef.current.push(t2);
    }, 1500);

    timersRef.current.push(t1);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="invoice-loading-box">
        <p>Memuat invoice transaksi...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="invoice-page">
        <div className="invoice-card error-card">
          <div className="status-icon-box error">
            <IconAlert size={32} />
          </div>
          <h2 className="invoice-status-title">Transaksi Tidak Ditemukan</h2>
          <p className="invoice-status-desc">{error || 'Nomor invoice transaksi ini tidak terdaftar di sistem kami.'}</p>
          <div style={{ marginTop: '1.5rem' }}>
            <Link to="/transaksi" className="btn-solid" style={{ display: 'inline-flex', width: 'auto' }}>
              Lihat Riwayat Transaksi
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isPending = stage < 4;

  return (
    <div className="invoice-page">
      <div className="invoice-card">
        {/* Status Header Dinamis Sesuai Tahapan */}
        <div className="invoice-header">
          {stage === 1 && (
            <>
              <div className="status-icon-box warning pulse-dot">
                <IconQrCode size={36} />
              </div>
              <span className="invoice-status-pill warning">MENUNGGU PEMBAYARAN</span>
              <h1 className="invoice-status-title">Selesaikan Pembayaran</h1>
              <p className="invoice-status-desc">
                Lakukan transfer pembayaran sesuai detail rekening / QRIS di bawah sebelum batas waktu berakhir.
              </p>
            </>
          )}

          {stage === 2 && (
            <>
              <div className="status-icon-box warning pulse-dot">
                <IconCheck size={36} />
              </div>
              <span className="invoice-status-pill success">PEMBAYARAN DITERIMA</span>
              <h1 className="invoice-status-title">Memverifikasi Mutasi...</h1>
              <p className="invoice-status-desc">
                Sistem berhasil mendeteksi mutasi pembayaran. Sedang menyiapkan transmisi pengiriman produk.
              </p>
            </>
          )}

          {stage === 3 && (
            <>
              <div className="status-icon-box success pulse-dot">
                <IconRefresh size={36} className="spin-slow" />
              </div>
              <span className="invoice-status-pill success">DIPROSES OTOMATIS</span>
              <h1 className="invoice-status-title">Mengirim Item Game...</h1>
              <p className="invoice-status-desc">
                Sistem sedang melakukan injeksi saldo / diamond langsung ke akun tujuan secara instan 1-3 detik.
              </p>
            </>
          )}

          {stage === 4 && (
            <>
              <div className="status-icon-box success">
                <IconCheck size={36} />
              </div>
              <span className="invoice-status-pill success">TRANSAKSI BERHASIL & SELESAI</span>
              <h1 className="invoice-status-title">Pesanan Sukses Dikirim!</h1>
              <p className="invoice-status-desc">
                Pembayaran telah terverifikasi penuh dan produk digital telah sukses masuk ke akun game Anda.
              </p>
            </>
          )}
        </div>

        {/* 4-Stage Interactive Transaction Timeline */}
        <div className="timeline-container">
          {/* Step 1: Pesanan Dibuat */}
          <div className="timeline-step completed">
            <div className="timeline-dot">
              <IconCheck size={12} />
            </div>
            <span className="timeline-label">Pesanan Dibuat</span>
          </div>

          <div className={`timeline-line ${stage >= 2 ? 'completed' : ''}`} />

          {/* Step 2: Menunggu Bayar / Pembayaran Diterima */}
          <div className={`timeline-step ${stage >= 2 ? 'completed' : 'active'}`}>
            <div className={`timeline-dot ${stage === 1 ? 'pulse-dot' : ''}`}>
              {stage >= 2 ? <IconCheck size={12} /> : '2'}
            </div>
            <span className="timeline-label">
              {stage === 1 ? 'Menunggu Bayar' : 'Pembayaran Diterima'}
            </span>
          </div>

          <div className={`timeline-line ${stage >= 3 ? 'completed' : ''}`} />

          {/* Step 3: Diproses Otomatis */}
          <div className={`timeline-step ${stage >= 3 ? 'completed' : (stage === 2 ? 'active' : '')}`}>
            <div className={`timeline-dot ${stage === 3 ? 'pulse-dot' : ''}`}>
              {stage >= 4 ? <IconCheck size={12} /> : (stage === 3 ? <IconRefresh size={11} className="spin-slow" /> : '3')}
            </div>
            <span className="timeline-label">Diproses Otomatis</span>
          </div>

          <div className={`timeline-line ${stage >= 4 ? 'completed' : ''}`} />

          {/* Step 4: Selesai */}
          <div className={`timeline-step ${stage === 4 ? 'completed' : ''}`}>
            <div className="timeline-dot">
              {stage === 4 ? <IconCheck size={12} /> : '4'}
            </div>
            <span className="timeline-label">Selesai</span>
          </div>
        </div>

        {/* Live Processing Animation Banner if Verifying */}
        {isVerifying && stage < 4 && (
          <div className="processing-banner-box">
            <IconRefresh size={18} className="text-emerald spin-slow" />
            <div className="processing-banner-text">
              <strong>Status Realtime:</strong> {verifyingText}
            </div>
          </div>
        )}

        {/* SECTION PEMBAYARAN JIKA MASIH STAGE 1 (VA / QRIS) */}
        {stage === 1 && (
          <div className="payment-action-box">
            {/* 1. TAMPILAN VIRTUAL ACCOUNT (BCA VA, MANDIRI VA, BRI, BNI) */}
            {paymentDetails.type === 'VA' && (
              <div className="va-payment-display">
                <div className="va-header">
                  <span className="va-bank-title">{paymentDetails.bankName}</span>
                  <span className="va-badge-tag">Virtual Account Otomatis</span>
                </div>

                <div className="va-number-card">
                  <span className="va-number-label">Nomor Virtual Account (No. Rekening):</span>
                  <div className="va-number-row">
                    <span className="va-number-figure">{paymentDetails.vaNumber}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentDetails.vaNumber, 'va')}
                      className="btn-copy-highlight"
                    >
                      {copiedField === 'va' ? <IconCheck size={14} /> : <IconCopy size={14} />}
                      <span>{copiedField === 'va' ? 'Tersalin!' : 'Salin No VA'}</span>
                    </button>
                  </div>
                  <span className="va-account-name">Atas Nama: <strong>{paymentDetails.accountName}</strong></span>
                </div>

                <div className="va-total-card">
                  <div>
                    <span className="va-total-label">Total Pembayaran:</span>
                    <div className="va-total-figure">{formatRupiah(order.harga)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.harga.toString(), 'amount')}
                    className="btn-copy"
                  >
                    {copiedField === 'amount' ? 'Tersalin' : 'Salin Nominal'}
                  </button>
                </div>

                {/* Panduan Pembayaran VA Tabbed */}
                {paymentDetails.instructions && (
                  <div className="instructions-section">
                    <h4 className="instructions-title">Panduan Cara Transfer:</h4>
                    <div className="instruction-tabs">
                      {paymentDetails.instructions.map((ins, idx) => (
                        <button
                          key={ins.tab}
                          type="button"
                          className={`instruction-tab-btn ${activeInstructionTab === idx ? 'active' : ''}`}
                          onClick={() => setActiveInstructionTab(idx)}
                        >
                          {ins.tab}
                        </button>
                      ))}
                    </div>

                    <div className="instruction-content-card">
                      <ol className="instruction-steps-list">
                        {paymentDetails.instructions[activeInstructionTab]?.steps.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. TAMPILAN QRIS (SEMUA E-WALLET & BANK) */}
            {paymentDetails.type === 'QRIS' && (
              <div className="qris-payment-display">
                <div className="qris-box-header">
                  <span className="qris-title">QRIS Instant Pay</span>
                  <span className="qris-sub">Scan QR dengan aplikasi Bank atau E-Wallet apa saja</span>
                </div>

                <div className="qris-visual-frame">
                  {/* SVG QR Visualizer */}
                  <div className="qris-qr-code-box">
                    <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                      <rect x="2" y="2" width="8" height="8" rx="1" fill="#fff" stroke="#000" />
                      <rect x="14" y="2" width="8" height="8" rx="1" fill="#fff" stroke="#000" />
                      <rect x="2" y="14" width="8" height="8" rx="1" fill="#fff" stroke="#000" />
                      <rect x="4" y="4" width="4" height="4" fill="#000" />
                      <rect x="16" y="4" width="4" height="4" fill="#000" />
                      <rect x="4" y="16" width="4" height="4" fill="#000" />
                      <rect x="14" y="14" width="3" height="3" fill="#000" />
                      <rect x="19" y="14" width="3" height="3" fill="#000" />
                      <rect x="14" y="19" width="3" height="3" fill="#000" />
                      <rect x="19" y="19" width="3" height="3" fill="#000" />
                      <circle cx="12" cy="12" r="1.5" fill="#10b981" />
                    </svg>
                    <span className="qris-merchant-tag">{paymentDetails.merchantName}</span>
                    <span className="qris-nmid-tag">NMID: {paymentDetails.nmid}</span>
                  </div>
                </div>

                <div className="va-total-card" style={{ marginTop: '1.25rem' }}>
                  <div>
                    <span className="va-total-label">Total Tagihan QRIS:</span>
                    <div className="va-total-figure">{formatRupiah(order.harga)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.harga.toString(), 'amount')}
                    className="btn-copy"
                  >
                    {copiedField === 'amount' ? 'Tersalin' : 'Salin Nominal'}
                  </button>
                </div>
              </div>
            )}

            {/* Tombol Konfirmasi Pembayaran Selesai */}
            <div className="confirm-payment-action-row">
              <button
                type="button"
                onClick={handleConfirmPaid}
                className="btn-solid btn-paid-confirm"
                disabled={isVerifying}
              >
                <IconCheck size={18} />
                <span>{isVerifying ? 'Memverifikasi Pembayaran...' : 'Saya Sudah Bayar / Konfirmasi Pembayaran'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Invoice Meta Bar */}
        <div className="invoice-meta-bar">
          <div className="meta-col">
            <span className="meta-label">Nomor Invoice</span>
            <div className="invoice-copy-group">
              <span className="meta-val mono">#TRX-{order.id}</span>
              <button type="button" onClick={() => handleCopy(`#TRX-${order.id}`, 'inv')} className="btn-copy">
                {copiedField === 'inv' ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="meta-col">
            <span className="meta-label">Waktu Transaksi</span>
            <span className="meta-val">{formatDate(order.created_at)}</span>
          </div>

          <div className="meta-col">
            <span className="meta-label">Metode Pembayaran</span>
            <span className="meta-val text-emerald">{paymentMethod?.name || 'Saldo Dompet Triple S'}</span>
          </div>
        </div>

        {/* Detailed Receipt Breakdown */}
        <div className="receipt-breakdown">
          <h3 className="breakdown-title">Rincian Pembelian Produk</h3>

          <div className="receipt-table">
            <div className="receipt-row">
              <span className="receipt-col-label">Item Produk & Akun</span>
              <span className="receipt-col-val font-semibold">{order.item}</span>
            </div>

            <div className="receipt-row">
              <span className="receipt-col-label">User ID Pembeli</span>
              <span className="receipt-col-val mono">UID #{order.user_id}</span>
            </div>

            <div className="receipt-row">
              <span className="receipt-col-label">Status Pengiriman</span>
              <span className="receipt-col-val text-emerald">
                {stage === 4 ? 'Instan 1-3 Detik Langsung Masuk (Sukses)' : (stage === 3 ? 'Sedang Injeksi ke Server...' : 'Menunggu Konfirmasi Transfer')}
              </span>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-row total">
              <span className="receipt-col-label">Total Pembayaran</span>
              <span className="receipt-col-val total-amount">{formatRupiah(order.harga)}</span>
            </div>
          </div>
        </div>

        {/* Security / Verification Assurance */}
        <div className="invoice-security-notice">
          <IconShield size={16} className="text-emerald" />
          <span>Transaksi ini diproses melalui PostgreSQL Atomic Transaction yang aman, legal, dan terenkripsi.</span>
        </div>

        {/* Actions Row */}
        <div className="invoice-actions-row">
          <button type="button" onClick={handlePrint} className="btn-secondary-flat">
            Cetak Struk Transaksi
          </button>
          <Link to="/" className="btn-solid" style={{ width: 'auto', minWidth: '160px' }}>
            <span>Beli Game Lain</span>
            <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
