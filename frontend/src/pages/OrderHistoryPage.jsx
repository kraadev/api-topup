import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import { IconHistory, IconRefresh, IconCheck, IconAlert, IconArrowRight } from '../components/Icons';

export const OrderHistoryPage = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

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
      return (
        o.id.toString().includes(query) ||
        (o.item && o.item.toLowerCase().includes(query)) ||
        (o.status && o.status.toLowerCase().includes(query))
      );
    });
  }, [orders, searchFilter]);

  return (
    <div className="history-page">
      <div className="history-page-header">
        <div>
          <h1 className="page-title">Riwayat Transaksi</h1>
          <p className="page-desc">Daftar seluruh catatan pembelian produk digital yang telah diproses.</p>
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
          <input
            type="text"
            className="search-input"
            placeholder="Cari transaksi berdasarkan nama game, item, atau ID order..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            style={{ maxWidth: '400px' }}
          />
          <span className="record-count-tag">{filteredOrders.length} Catatan Transaksi</span>
        </div>

        {loading && <p className="text-muted" style={{ padding: '2rem' }}>Memuat data riwayat transaksi...</p>}

        {!loading && filteredOrders.length === 0 && (
          <div className="empty-ledger">
            <p>Tidak ada transaksi yang cocok dengan filter pencarian.</p>
            <div style={{ marginTop: '1rem' }}>
              <Link to="/" className="btn-solid" style={{ display: 'inline-flex', width: 'auto' }}>
                Beli Produk Game
              </Link>
            </div>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>ID Order</th>
                  <th>Item Produk & Tujuan</th>
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
        )}
      </div>
    </div>
  );
};
