import apiClient from './api';

export const userService = {
  // Ambil profil user & sisa saldo berdasarkan user ID
  getUserById: async (userId = 1) => {
    return await apiClient.get(`/users?id=${userId}`);
  },

  // Top Up Saldo Akun
  topUpSaldo: async (userId, amount) => {
    return await apiClient.post('/users/saldo', {
      id: Number(userId),
      amount: Number(amount),
    });
  },

  // Registrasi User Baru (opsional)
  registerUser: async (username, initialSaldo = 0) => {
    return await apiClient.post('/users/register', {
      username,
      saldo: Number(initialSaldo),
    });
  },
};
