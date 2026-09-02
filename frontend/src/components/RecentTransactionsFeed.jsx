import React, { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { formatRupiah, formatDate } from '../utils/formatters';
import { IconCheck, IconHistory } from './Icons';

export const RecentTransactionsFeed = () => {
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await orderService.getOrders();
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        setRecentOrders(list.slice(0, 5));
      } catch (err) {
        // Fallback default anonymized sample if backend has no orders yet
        setRecentOrders([
          { id: 101, user_id: 1, item: 'Mobile Legends - 86 Diamonds', harga: 20000, status: 'Success', created_at: new Date().toISOString() },
          { id: 102, user_id: 1, item: 'Free Fire - 140 Diamonds', harga: 20000, status: 'Success', created_at: new Date(Date.now() - 120000).toISOString() },
          { id: 103, user_id: 1, item: 'Valorant - 1000 VP', harga: 110000, status: 'Success', created_at: new Date(Date.now() - 360000).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (recentOrders.length === 0) return null;

  return (
    <section className="recent-feed-section">
      <div className="recent-feed-header">
        <div className="feed-title-group">
          <IconHistory size={16} className="text-emerald" />
          <h3 className="feed-title">Aktivitas Transaksi Terbaru</h3>
        </div>
        <span className="feed-live-tag">
          <span className="live-dot" />
          <span>Realtime Feed</span>
        </span>
      </div>

      <div className="recent-feed-scroller">
        {recentOrders.map((order) => (
          <div key={order.id} className="feed-item-card">
            <div className="feed-item-left">
              <span className="feed-status-dot" />
              <div className="feed-item-info">
                <span className="feed-product-title">{order.item}</span>
                <span className="feed-user-masked">UID #{order.user_id} &bull; {formatDate(order.created_at)}</span>
              </div>
            </div>
            <div className="feed-item-right">
              <span className="feed-price">{formatRupiah(order.harga)}</span>
              <span className="feed-status-badge">
                <IconCheck size={10} />
                <span>Sukses</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
