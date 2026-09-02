import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('triple_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('triple_token') || null;
  });

  const [loading, setLoading] = useState(false);

  // Sync user profile dari backend
  const refreshUser = useCallback(async () => {
    const targetId = user?.id || 1;
    try {
      const res = await userService.getUserById(targetId);
      const userData = res.data?.data || res.data || res;
      if (userData && userData.id) {
        setUser((prev) => {
          const updated = prev ? { ...prev, ...userData } : userData;
          localStorage.setItem('triple_user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (err) {
      console.warn('Gagal sinkron data user dari server:', err.message);
    }
  }, [user?.id]);

  // Inisialisasi awal saat load
  useEffect(() => {
    if (user?.id) {
      refreshUser();
    } else {
      // Ambil user default #1 jika belum login
      const initGuest = async () => {
        try {
          const res = await userService.getUserById(1);
          const userData = res.data?.data || res.data || res;
          if (userData && userData.id) {
            setUser(userData);
            localStorage.setItem('triple_user', JSON.stringify(userData));
          }
        } catch {
          // fallback jika backend belum running
        }
      };
      initGuest();
    }
  }, [refreshUser, user?.id]);

  // Login Email & Password
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const userData = res.data?.user || res.data?.data || res.data || res;
      const userToken = res.data?.token || `token_${Date.now()}`;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('triple_user', JSON.stringify(userData));
      localStorage.setItem('triple_token', userToken);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Registrasi Akun Baru
  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const username = email.split('@')[0];
      const res = await authService.register({ name, email, password, username });
      const userData = res.data?.data || res.data || res;
      const userToken = `token_${Date.now()}`;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('triple_user', JSON.stringify(userData));
      localStorage.setItem('triple_token', userToken);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const loginWithGoogle = async (googleUser) => {
    setLoading(true);
    try {
      const res = await authService.googleLogin({
        email: googleUser.email,
        name: googleUser.name || googleUser.email.split('@')[0],
        google_id: googleUser.google_id || `google_${Date.now()}`,
        avatar_url: googleUser.avatar_url || '',
      });
      const userData = res.data?.user || res.data?.data || res.data || res;
      const userToken = res.data?.token || `google_token_${Date.now()}`;
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('triple_user', JSON.stringify(userData));
      localStorage.setItem('triple_token', userToken);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('triple_user');
    localStorage.removeItem('triple_token');
  };

  // Lupa Password (Minta OTP)
  const forgotPassword = async (email) => {
    return await authService.forgotPassword(email);
  };

  // Verifikasi OTP
  const verifyOTP = async (email, otpCode) => {
    return await authService.verifyOTP({ email, otp_code: otpCode });
  };

  // Reset Password dengan OTP
  const resetPassword = async (email, otpCode, newPassword) => {
    return await authService.resetPassword({ email, otp_code: otpCode, new_password: newPassword });
  };

  // Top Up Saldo Helper (Mendukung user login & guest user #1)
  const topUpSaldo = async (amount) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    const targetUserId = user?.id || 1;

    try {
      const res = await userService.topUpSaldo(targetUserId, numAmount);
      const updatedUser = res.data?.data || res.data || res;

      if (updatedUser && updatedUser.saldo !== undefined) {
        setUser((prev) => {
          const merged = prev ? { ...prev, ...updatedUser } : updatedUser;
          localStorage.setItem('triple_user', JSON.stringify(merged));
          return merged;
        });
      } else {
        setUser((prev) => {
          const currentSaldo = prev?.saldo || 0;
          const merged = prev
            ? { ...prev, saldo: currentSaldo + numAmount }
            : { id: 1, name: 'User Triple S', username: 'user1', saldo: numAmount };
          localStorage.setItem('triple_user', JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.warn('Backend top up notice (updating local state):', err.message);
      setUser((prev) => {
        const currentSaldo = prev?.saldo || 0;
        const merged = prev
          ? { ...prev, saldo: currentSaldo + numAmount }
          : { id: 1, name: 'User Triple S', username: 'user1', saldo: numAmount };
        localStorage.setItem('triple_user', JSON.stringify(merged));
        return merged;
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        forgotPassword,
        verifyOTP,
        resetPassword,
        refreshUser,
        topUpSaldo,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
