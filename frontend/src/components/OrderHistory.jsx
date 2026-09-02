import React, { useEffect, useState, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import { IconHistory, IconRefresh, IconCheck, IconAlert } from './Icons';

export const OrderHistory = ({ userId, triggerRefresh }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await orderService.getOrders(userId || 1);
      const list = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
      setOrders(list);
    } catch (err) {
      setError('Belum dapat memuat riwayat transaksi dari server.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, triggerRefresh]);

  return (
    <div className="ledger-card">
      <div className="section-panel-header">
        <div className="section-heading">
          <IconHistory size={18} />
          <span>Ledger Riwayat Transaksi</span>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="btn-secondary-flat"
          disabled={loading}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
        >
          <IconRefresh size={13} className={loading ? 'spin' : ''} />
          <span>Segarkan</span>
        </button>
      </div>

      {loading && <p className="text-muted" style={{ padding: '1rem 0' }}>Memuat data ledger...</p>}
      
      {error && (
        <div className="toast-notice toast-warning" style={{ margin: '1rem 0' }}>
          <IconAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && orders.length === 0 && !error && (
        <div className="empty-ledger">
          <p>Belum ada catatan transaksi pada akun ini.</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>ID Transaksi</th>
                <th>Item Produk & Tujuan</th>
                <th style={{ width: '130px' }}>Nominal</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '170px' }}>Waktu Eksekusi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="mono-id">#{order.id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{order.item}</td>
                  <td className="mono-price">{formatRupiah(order.harga)}</td>
                  <td>
                    <span className={`status-pill ${(order.status || 'success').toLowerCase()}`}>
                      <IconCheck size={11} />
                      <span>{order.status || 'Success'}</span>
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {formatDate(order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
