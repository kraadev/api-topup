import apiClient from './api';

export const authService = {
  // Login dengan Email & Password
  login: async ({ email, password }) => {
    return await apiClient.post('/auth/login', {
      email,
      password,
    });
  },

  // Registrasi Akun Baru
  register: async ({ name, email, password, username }) => {
    return await apiClient.post('/auth/register', {
      name,
      email,
      password,
      username,
      saldo: 100000, // Bonus saldo awal untuk akun baru
    });
  },

  // Login dengan Google OAuth
  googleLogin: async ({ email, name, google_id, avatar_url }) => {
    return await apiClient.post('/auth/google', {
      email,
      name,
      google_id,
      avatar_url,
    });
  },

  // Kirim Kode OTP Lupa Password
  forgotPassword: async (email) => {
    return await apiClient.post('/auth/forgot-password', {
      email,
    });
  },

  // Verifikasi Kode OTP 6-Digit
  verifyOTP: async ({ email, otp_code }) => {
    return await apiClient.post('/auth/verify-otp', {
      email,
      otp_code,
    });
  },

  // Ganti Kata Sandi Baru dengan OTP
  resetPassword: async ({ email, otp_code, new_password }) => {
    return await apiClient.post('/auth/reset-password', {
      email,
      otp_code,
      new_password,
    });
  },
};
