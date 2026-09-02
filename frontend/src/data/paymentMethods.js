// Data Metode Pembayaran Terstruktur

export const PAYMENT_CATEGORIES = [
  {
    id: 'wallet',
    name: 'Saldo Dompet Akun',
    badge: 'BEBAS BIAYA ADMIN',
    methods: [
      {
        id: 'triple_wallet',
        name: 'Saldo Dompet Triple S',
        category: 'wallet',
        feeFixed: 0,
        feePercent: 0,
        processingTime: 'Instan 1 Detik',
        isWallet: true,
        logoText: '3S WALLET',
        description: 'Potong langsung dari saldo akun terdaftar. Tanpa biaya admin tambahan.',
      },
    ],
  },
  {
    id: 'qris',
    name: 'QRIS (Semua E-Wallet & Mobile Banking)',
    badge: 'OTOMATIS',
    methods: [
      {
        id: 'qris_all',
        name: 'QRIS Instant Pay',
        category: 'qris',
        feeFixed: 0,
        feePercent: 0.007, // 0.7%
        processingTime: 'Instan 1-3 Detik',
        logoText: 'QRIS',
        description: 'BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja.',
      },
    ],
  },
  {
    id: 'ewallet',
    name: 'E-Wallet Langsung',
    methods: [
      { id: 'gopay', name: 'GoPay Direct', category: 'ewallet', feeFixed: 1000, feePercent: 0.015, processingTime: 'Instan', logoText: 'GOPAY' },
      { id: 'dana', name: 'DANA', category: 'ewallet', feeFixed: 1000, feePercent: 0.015, processingTime: 'Instan', logoText: 'DANA' },
      { id: 'ovo', name: 'OVO', category: 'ewallet', feeFixed: 1000, feePercent: 0.015, processingTime: 'Instan', logoText: 'OVO' },
      { id: 'shopeepay', name: 'ShopeePay', category: 'ewallet', feeFixed: 1000, feePercent: 0.015, processingTime: 'Instan', logoText: 'SHOPEEPAY' },
    ],
  },
  {
    id: 'va',
    name: 'Virtual Account Bank',
    methods: [
      { id: 'bca_va', name: 'BCA Virtual Account', category: 'va', feeFixed: 2500, feePercent: 0, processingTime: '1 Menit', logoText: 'BCA VA' },
      { id: 'mandiri_va', name: 'Mandiri Virtual Account', category: 'va', feeFixed: 2500, feePercent: 0, processingTime: '1 Menit', logoText: 'MANDIRI VA' },
      { id: 'bri_va', name: 'BRI Virtual Account (BRIVA)', category: 'va', feeFixed: 2500, feePercent: 0, processingTime: '1 Menit', logoText: 'BRIVA' },
      { id: 'bni_va', name: 'BNI Virtual Account', category: 'va', feeFixed: 2500, feePercent: 0, processingTime: '1 Menit', logoText: 'BNI VA' },
    ],
  },
];

export const calculatePaymentFee = (method, subtotal) => {
  if (!method || !subtotal) return 0;
  const percentFee = Math.round(subtotal * (method.feePercent || 0));
  return (method.feeFixed || 0) + percentFee;
};
