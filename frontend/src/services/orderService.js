import apiClient from './api';

export const orderService = {
  // Buat transaksi baru (Beli Produk)
  createOrder: async ({ userId, item, harga }) => {
    return await apiClient.post('/orders', {
      user_id: Number(userId),
      item,
      harga: Number(harga),
    });
  },

  // Ambil daftar riwayat transaksi
  getOrders: async (userId) => {
    const url = userId ? `/orders?user_id=${userId}` : '/orders';
    return await apiClient.get(url);
  },

  // Ambil detail transaksi berdasarkan order ID
  getOrderById: async (orderId) => {
    return await apiClient.get(`/orders?id=${orderId}`);
  },
};
