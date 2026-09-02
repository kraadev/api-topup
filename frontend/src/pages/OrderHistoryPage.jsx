import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import { IconHistory, IconRefresh, IconCheck, IconAlert, IconArrowRight, IconSearch } from '../components/Icons';

export const OrderHistoryPage = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders(userId || 1);
      const list = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setOrders(list);
    } catch (err) {
      setError('Belum dapat terhubung ke server untuk memuat riwayat.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const query = searchFilter.toLowerCase();
      const matchSearch =
        o.id.toString().includes(query) ||
        (o.item && o.item.toLowerCase().includes(query)) ||
        (o.status && o.status.toLowerCase().includes(query));

      const status = (o.status || 'success').toUpperCase();
      const matchStatus = statusFilter === 'ALL' || status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [orders, searchFilter, statusFilter]);

  return (
    <div className="history-page">
      <div className="history-page-header">
        <div>
          <h1 className="page-title">Riwayat Transaksi Akun</h1>
          <p className="page-desc">Daftar seluruh catatan pembelian produk digital yang telah diproses di akun Anda.</p>
        </div>

        <button
          type="button"
          onClick={fetchOrders}
          className="btn-secondary-flat"
          disabled={loading}
        >
          <IconRefresh size={14} className={loading ? 'spin' : ''} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {error && (
        <div className="toast-notice toast-warning" style={{ marginBottom: '1.5rem' }}>
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="history-table-card">
        <div className="table-filter-bar">
          <div className="search-box" style={{ maxWidth: '380px' }}>
            <IconSearch size={16} className="catalog-search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari item, nama game, atau nomor ID order..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>

          <div className="status-filter-pills">
            <button
              type="button"
              className={`status-pill-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Semua ({orders.length})
            </button>
            <button
              type="button"
              className={`status-pill-btn ${statusFilter === 'SUCCESS' ? 'active' : ''}`}
              onClick={() => setStatusFilter('SUCCESS')}
            >
              Sukses
            </button>
          </div>
        </div>

        {loading && <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Memuat riwayat transaksi...</p>}

        {!loading && filteredOrders.length === 0 && (
          <div className="empty-ledger">
            <IconHistory size={36} className="text-muted" style={{ margin: '0 auto 0.75rem' }} />
            <p>Tidak ada transaksi yang cocok dengan filter pencarian.</p>
            <div style={{ marginTop: '1.25rem' }}>
              <Link to="/" className="btn-solid" style={{ display: 'inline-flex', width: 'auto' }}>
                Mulai Belanja Game
              </Link>
            </div>
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && filteredOrders.length > 0 && (
          <>
            <div className="table-responsive desktop-only-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '110px' }}>ID Order</th>
                    <th>Item Produk & Akun</th>
                    <th style={{ width: '140px' }}>Nominal</th>
                    <th style={{ width: '110px' }}>Status</th>
                    <th style={{ width: '180px' }}>Waktu Transaksi</th>
                    <th style={{ width: '110px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="mono-id">#TRX-{o.id}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.item}</td>
                      <td className="mono-price">{formatRupiah(o.harga)}</td>
                      <td>
                        <span className={`status-pill ${(o.status || 'success').toLowerCase()}`}>
                          <IconCheck size={11} />
                          <span>{o.status || 'Success'}</span>
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                        {formatDate(o.created_at)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/transaksi/${o.id}`}
                          state={{ orderData: o }}
                          className="btn-invoice-link"
                        >
                          <span>Invoice</span>
                          <IconArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="mobile-only-order-cards">
              {filteredOrders.map((o) => (
                <div key={o.id} className="mobile-order-card">
                  <div className="mobile-card-top">
                    <span className="mono-id">#TRX-{o.id}</span>
                    <span className={`status-pill ${(o.status || 'success').toLowerCase()}`}>
                      <IconCheck size={11} />
                      <span>{o.status || 'Success'}</span>
                    </span>
                  </div>

                  <h4 className="mobile-order-item">{o.item}</h4>

                  <div className="mobile-card-meta">
                    <span className="mono-price">{formatRupiah(o.harga)}</span>
                    <span className="mobile-order-time">{formatDate(o.created_at)}</span>
                  </div>

                  <div className="mobile-card-action">
                    <Link
                      to={`/transaksi/${o.id}`}
                      state={{ orderData: o }}
                      className="btn-invoice-link"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <span>Lihat Detail Invoice Struk</span>
                      <IconArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
