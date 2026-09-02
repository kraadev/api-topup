import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import { IconCheck, IconAlert, IconHistory, IconArrowRight, IconShield, IconCopy, IconQrCode } from '../components/Icons';

export const InvoicePage = () => {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.orderData?.order || location.state?.orderData || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

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
          } else {
            // Coba ambil dari list orders
            const listRes = await orderService.getOrders();
            const list = Array.isArray(listRes.data) ? listRes.data : (Array.isArray(listRes) ? listRes : []);
            const found = list.find((o) => o.id.toString() === orderId.toString());
            if (found) {
              setOrder(found);
            } else {
              setError('Nomor order transaksi tidak ditemukan.');
            }
          }
        } catch (err) {
          setError(err.message || 'Gagal memuat detail transaksi.');
        } finally {
          setLoading(false);
        }
      };
      fetchOrderDetail();
    }
  }, [orderId, order]);

  const handleCopyInvoice = () => {
    if (order?.id) {
      navigator.clipboard.writeText(`#TRX-${order.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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

  return (
    <div className="invoice-page">
      <div className="invoice-card">
        {/* Status Header */}
        <div className="invoice-header">
          <div className="status-icon-box success">
            <IconCheck size={36} />
          </div>
          <span className="invoice-status-pill success">TRANSAKSI BERHASIL</span>
          <h1 className="invoice-status-title">Pesanan Selesai</h1>
          <p className="invoice-status-desc">
            Transaksi top-up produk digital telah sukses dieksekusi secara otomatis ke akun Anda.
          </p>
        </div>

        {/* 4-Stage Transaction Timeline */}
        <div className="timeline-container">
          <div className="timeline-step completed">
            <div className="timeline-dot">
              <IconCheck size={12} />
            </div>
            <span className="timeline-label">Pesanan Dibuat</span>
          </div>

          <div className="timeline-line completed" />

          <div className="timeline-step completed">
            <div className="timeline-dot">
              <IconCheck size={12} />
            </div>
            <span className="timeline-label">Pembayaran Diterima</span>
          </div>

          <div className="timeline-line completed" />

          <div className="timeline-step completed">
            <div className="timeline-dot">
              <IconCheck size={12} />
            </div>
            <span className="timeline-label">Diproses Otomatis</span>
          </div>

          <div className="timeline-line completed" />

          <div className="timeline-step completed">
            <div className="timeline-dot">
              <IconCheck size={12} />
            </div>
            <span className="timeline-label">Selesai (Success)</span>
          </div>
        </div>

        {/* Invoice Meta Bar */}
        <div className="invoice-meta-bar">
          <div className="meta-col">
            <span className="meta-label">Nomor Invoice</span>
            <div className="invoice-copy-group">
              <span className="meta-val mono">#TRX-{order.id}</span>
              <button type="button" onClick={handleCopyInvoice} className="btn-copy">
                {copied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
          </div>

          <div className="meta-col">
            <span className="meta-label">Waktu Eksekusi</span>
            <span className="meta-val">{formatDate(order.created_at)}</span>
          </div>

          <div className="meta-col">
            <span className="meta-label">Metode Pembayaran</span>
            <span className="meta-val text-emerald">Saldo Dompet Triple S</span>
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
              <span className="receipt-col-label">Kecepatan Pengiriman</span>
              <span className="receipt-col-val text-emerald">Instan (1-3 Detik)</span>
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
          <span>Transaksi ini diproses melalui PostgreSQL Atomic Transaction yang aman dan terenkripsi.</span>
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
