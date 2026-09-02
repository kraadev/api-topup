import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import { IconSearch, IconShield, IconCheck, IconAlert, IconArrowRight, IconHistory } from '../components/Icons';

export const CheckTransactionPage = () => {
  const [invoiceInput, setInvoiceInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultOrder, setResultOrder] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  const handleSearchOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setResultOrder(null);

    const cleanInput = invoiceInput.trim().replace(/^#?TRX-?/i, '');

    if (!cleanInput) {
      setErrorMessage('Silakan masukkan nomor invoice atau Order ID transaksi.');
      return;
    }

    setLoading(true);
    try {
      // Cari detail order dari backend API
      const res = await orderService.getOrderById(cleanInput);
      const data = res.data || res;
      if (data && data.id) {
        setResultOrder(data);
      } else {
        // Coba cari dari daftar order
        const listRes = await orderService.getOrders();
        const list = Array.isArray(listRes.data) ? listRes.data : (Array.isArray(listRes) ? listRes : []);
        const found = list.find((o) => o.id.toString() === cleanInput);
        if (found) {
          setResultOrder(found);
        } else {
          setErrorMessage(`Pesanan dengan nomor invoice #TRX-${cleanInput} tidak ditemukan di database.`);
        }
      }
    } catch (err) {
      // Coba fallback cek di list
      try {
        const listRes = await orderService.getOrders();
        const list = Array.isArray(listRes.data) ? listRes.data : (Array.isArray(listRes) ? listRes : []);
        const found = list.find((o) => o.id.toString() === cleanInput);
        if (found) {
          setResultOrder(found);
        } else {
          setErrorMessage(`Pesanan dengan nomor invoice #TRX-${cleanInput} tidak ditemukan.`);
        }
      } catch (listErr) {
        setErrorMessage('Gagal mencari transaksi. Pastikan koneksi ke server backend aktif.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="check-order-page">
      <div className="page-header text-center">
        <div className="status-icon-box success" style={{ margin: '0 auto 1rem' }}>
          <IconShield size={32} />
        </div>
        <h1 className="page-title">Lacak Status Pesanan</h1>
        <p className="page-desc" style={{ maxWidth: '540px', margin: '0.4rem auto 0' }}>
          Masukkan nomor invoice transaksi untuk melacak status pembayaran dan proses pengiriman produk digital Anda.
        </p>
      </div>

      {/* Search Box */}
      <div className="check-search-card">
        <form onSubmit={handleSearchOrder} className="check-search-form">
          <div className="check-input-wrapper">
            <IconSearch size={20} className="check-input-icon" />
            <input
              type="text"
              className="check-input"
              placeholder="Masukkan Nomor Invoice (Contoh: #TRX-101 atau 101)"
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn-solid btn-check-submit"
            disabled={loading || !invoiceInput.trim()}
          >
            {loading ? 'Mencari...' : 'Cek Status'}
          </button>
        </form>

        <div className="check-guide-hints">
          <span>Contoh format: <strong>#TRX-101</strong> atau cukup ketik angka <strong>101</strong></span>
          <Link to="/transaksi" className="check-history-link">
            <IconHistory size={14} />
            <span>Lihat Semua Riwayat Pesanan</span>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="toast-notice toast-error" style={{ maxWidth: '680px', margin: '1.5rem auto' }}>
          <IconAlert size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Result Order Card */}
      {resultOrder && (
        <div className="order-found-card">
          <div className="found-header">
            <div>
              <span className="found-pill success">STATUS: SUKSES (SELESAI)</span>
              <h3 className="found-title">Pesanan #TRX-{resultOrder.id}</h3>
              <span className="found-date">{formatDate(resultOrder.created_at)}</span>
            </div>
            <div className="found-price-badge">
              <span className="found-price-label">Total Pembayaran</span>
              <span className="found-price-val">{formatRupiah(resultOrder.harga)}</span>
            </div>
          </div>

          <div className="found-details-table">
            <div className="found-row">
              <span className="found-label">Item Produk:</span>
              <span className="found-val font-semibold">{resultOrder.item}</span>
            </div>
            <div className="found-row">
              <span className="found-label">Metode Pembayaran:</span>
              <span className="found-val">Saldo Dompet Akun Triple S</span>
            </div>
            <div className="found-row">
              <span className="found-label">Status Pengiriman:</span>
              <span className="found-val text-emerald">
                <IconCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                Terkirim Otomatis ke Akun Game
              </span>
            </div>
          </div>

          <div className="found-actions">
            <button
              type="button"
              onClick={() => navigate(`/transaksi/${resultOrder.id}`, { state: { orderData: resultOrder } })}
              className="btn-solid"
            >
              <span>Buka Halaman Invoice Lengkap</span>
              <IconArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
