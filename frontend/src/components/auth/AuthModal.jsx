import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  IconClose,
  IconGoogle,
  IconEye,
  IconEyeOff,
  IconAlert,
  IconCheck,
  IconArrowRight,
  IconShield,
  IconRefresh,
} from '../Icons';

export const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
  const { login, register, loginWithGoogle, forgotPassword, verifyOTP, resetPassword } = useAuth();

  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Forgot Password / OTP States
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialView]);

  // Timer Countdown for Resend OTP
  useEffect(() => {
    let timer;
    if (view === 'otp' && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [view, resendCountdown]);

  if (!isOpen) return null;

  // Handler Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      onClose();
    } catch (err) {
      setError(err.message || 'Email atau password salah');
    } finally {
      setLoading(false);
    }
  };

  // Handler Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (regPassword.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mendaftarkan akun.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Google Login
  const handleGoogleClick = async () => {
    setError(null);
    setLoading(true);
    try {
      // Simulasi autentikasi Google OAuth
      const sampleEmail = 'player.google@gmail.com';
      await loginWithGoogle({
        email: sampleEmail,
        name: 'Player Google',
        google_id: `google_${Date.now()}`,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Kirim OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPassword(forgotEmail);
      const hint = res.data?.dev_otp_hint || null;
      setDevOtpHint(hint);
      setSuccessMsg(res.message);
      setView('otp');
      setResendCountdown(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message || 'Gagal mengirimkan kode OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Handler OTP Digit Input
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto advance focus
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtpDigits(digits);
      otpInputsRef.current[5]?.focus();
    }
  };

  // Handler Verifikasi OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await verifyOTP(forgotEmail, fullOtp);
      setView('reset');
    } catch (err) {
      setError(err.message || 'Kode OTP tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Reset Password
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const fullOtp = otpDigits.join('');
      await resetPassword(forgotEmail, fullOtp, newPassword);
      setView('success');
    } catch (err) {
      setError(err.message || 'Gagal memperbarui kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-header-text">
            {view === 'login' && <h3 className="auth-title">Masuk ke Akun</h3>}
            {view === 'register' && <h3 className="auth-title">Daftar Akun Baru</h3>}
            {view === 'forgot' && <h3 className="auth-title">Lupa Kata Sandi</h3>}
            {view === 'otp' && <h3 className="auth-title">Verifikasi Kode OTP</h3>}
            {view === 'reset' && <h3 className="auth-title">Buat Kata Sandi Baru</h3>}
            {view === 'success' && <h3 className="auth-title">Kata Sandi Diperbarui</h3>}
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" title="Tutup">
            <IconClose size={18} />
          </button>
        </div>

        <div className="auth-modal-body">
          {/* Error Alert */}
          {error && (
            <div className="toast-notice toast-error" style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem' }}>
              <IconAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && view !== 'success' && (
            <div className="toast-notice toast-success" style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem' }}>
              <IconCheck size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: LOGIN */}
          {/* ======================================================== */}
          {view === 'login' && (
            <>
              <button
                type="button"
                className="btn-google-auth"
                onClick={handleGoogleClick}
                disabled={loading}
              >
                <IconGoogle size={18} />
                <span>Lanjutkan dengan Google</span>
              </button>

              <div className="auth-divider">
                <span>atau masuk dengan email</span>
              </div>

              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="input-field-group">
                  <label className="field-label">Email atau Username</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="nama@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="input-field-group">
                  <div className="label-with-action">
                    <label className="field-label">Kata Sandi</label>
                    <button
                      type="button"
                      className="auth-link-btn"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setView('forgot');
                        setError(null);
                      }}
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      className="text-input"
                      placeholder="Masukkan kata sandi"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowLoginPassword((p) => !p)}
                    >
                      {showLoginPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-solid auth-submit-btn"
                  disabled={loading || !loginEmail || !loginPassword}
                >
                  {loading ? 'Memproses...' : 'Masuk ke Akun'}
                </button>
              </form>

              <div className="auth-footer-switch">
                <span>Belum memiliki akun?</span>
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setView('register');
                    setError(null);
                  }}
                >
                  Daftar Sekarang
                </button>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: REGISTER */}
          {/* ======================================================== */}
          {view === 'register' && (
            <>
              <button
                type="button"
                className="btn-google-auth"
                onClick={handleGoogleClick}
                disabled={loading}
              >
                <IconGoogle size={18} />
                <span>Daftar dengan Google</span>
              </button>

              <div className="auth-divider">
                <span>atau daftar dengan email</span>
              </div>

              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="input-field-group">
                  <label className="field-label">Nama Lengkap</label>
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Contoh: Alex Pratama"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="input-field-group">
                  <label className="field-label">Alamat Email</label>
                  <input
                    type="email"
                    className="text-input"
                    placeholder="nama@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="input-field-group">
                  <label className="field-label">Kata Sandi (Min. 6 Karakter)</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      className="text-input"
                      placeholder="Buat kata sandi aman"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowRegPassword((p) => !p)}
                    >
                      {showRegPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="input-field-group">
                  <label className="field-label">Konfirmasi Kata Sandi</label>
                  <input
                    type="password"
                    className="text-input"
                    placeholder="Ulangi kata sandi"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-solid auth-submit-btn"
                  disabled={loading || !regEmail || !regPassword || !regName}
                >
                  {loading ? 'Mendaftarkan...' : 'Buat Akun'}
                </button>
              </form>

              <div className="auth-footer-switch">
                <span>Sudah memiliki akun?</span>
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setView('login');
                    setError(null);
                  }}
                >
                  Masuk di Sini
                </button>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: FORGOT PASSWORD */}
          {/* ======================================================== */}
          {view === 'forgot' && (
            <form onSubmit={handleSendOtp} className="auth-form">
              <p className="auth-subtext">
                Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan 6 digit kode OTP verifikasi.
              </p>

              <div className="input-field-group">
                <label className="field-label">Alamat Email</label>
                <input
                  type="email"
                  className="text-input"
                  placeholder="nama@email.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-solid auth-submit-btn"
                disabled={loading || !forgotEmail}
              >
                {loading ? 'Mengirim OTP...' : 'Kirim Kode OTP'}
              </button>

              <div className="auth-footer-switch">
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => setView('login')}
                >
                  &larr; Kembali ke Halaman Masuk
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: OTP VERIFICATION */}
          {/* ======================================================== */}
          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="auth-form">
              <p className="auth-subtext">
                Masukkan 6 digit kode OTP yang telah dikirimkan ke <strong>{forgotEmail}</strong>.
              </p>

              {devOtpHint && (
                <div className="dev-otp-badge">
                  <span>Kode OTP Dev: <strong>{devOtpHint}</strong></span>
                </div>
              )}

              <div className="otp-inputs-row" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="otp-digit-input"
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="otp-resend-row">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="btn-resend-otp"
                    disabled={loading}
                  >
                    <IconRefresh size={14} />
                    <span>Kirim Ulang Kode OTP</span>
                  </button>
                ) : (
                  <span className="resend-countdown-text">
                    Kirim ulang kode dalam <strong>{resendCountdown} detik</strong>
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn-solid auth-submit-btn"
                disabled={loading || otpDigits.some((d) => !d)}
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi OTP'}
              </button>

              <div className="auth-footer-switch">
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => setView('forgot')}
                >
                  &larr; Ubah Alamat Email
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: RESET PASSWORD */}
          {/* ======================================================== */}
          {view === 'reset' && (
            <form onSubmit={handleResetPasswordSubmit} className="auth-form">
              <p className="auth-subtext">
                Kode OTP terverifikasi! Silakan buat kata sandi baru untuk akun Anda.
              </p>

              <div className="input-field-group">
                <label className="field-label">Kata Sandi Baru (Min. 6 Karakter)</label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="text-input"
                    placeholder="Masukkan kata sandi baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword((p) => !p)}
                  >
                    {showNewPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                  </button>
                </div>
              </div>

              <div className="input-field-group">
                <label className="field-label">Konfirmasi Kata Sandi Baru</label>
                <input
                  type="password"
                  className="text-input"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="btn-solid auth-submit-btn"
                disabled={loading || !newPassword || !confirmNewPassword}
              >
                {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 6: SUCCESS */}
          {/* ======================================================== */}
          {view === 'success' && (
            <div className="auth-success-box">
              <div className="status-icon-box success" style={{ margin: '0 auto 1rem' }}>
                <IconCheck size={32} />
              </div>
              <h4 className="success-heading">Kata Sandi Berhasil Diperbarui</h4>
              <p className="auth-subtext" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                Kata sandi baru Anda telah aktif. Silakan masuk menggunakan kata sandi baru tersebut.
              </p>
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setError(null);
                }}
                className="btn-solid"
                style={{ width: '100%' }}
              >
                Masuk Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
