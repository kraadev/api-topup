import React, { useEffect, useState, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';

export const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders(userId || 1);
      // Response Golang: { success: true, data: [ ...orders ] }
      const list = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setOrders(list);
    } catch (err) {
      console.warn('Gagal memuat riwayat order:', err.message);
      setError('Belum ada riwayat order atau server offline.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="card history-card">
      <div className="card-header">
        <h2 className="section-title">Riwayat Transaksi</h2>
        <button type="button" onClick={fetchOrders} className="btn-icon" disabled={loading}>
          🔄 Refresh
        </button>
      </div>

      {loading && <p className="text-muted">Memuat daftar transaksi...</p>}
      {error && <div className="alert alert-info">ℹ️ {error}</div>}

      {!loading && orders.length === 0 && !error && (
        <div className="empty-state">
          <p>Belum ada transaksi pembelian. Yuk coba beli produk di tab Order!</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID Order</th>
                <th>Item Produk</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td><strong>#{order.id}</strong></td>
                  <td>{order.item}</td>
                  <td><span className="price-tag">{formatRupiah(order.harga)}</span></td>
                  <td>
                    <span className={`status-badge status-${(order.status || 'success').toLowerCase()}`}>
                      {order.status || 'Success'}
                    </span>
                  </td>
                  <td><small className="text-muted">{formatDate(order.created_at)}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
