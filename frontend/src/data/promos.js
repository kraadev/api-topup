// Data Kupon & Promo Aktif

export const ACTIVE_PROMOS = [
  {
    code: 'TRIPLESNEW',
    title: 'Diskon Pengguna Baru 10%',
    description: 'Potongan harga 10% (maksimal Rp 10.000) untuk seluruh layanan game & voucher.',
    discountPercent: 10,
    maxDiscount: 10000,
    minTransaction: 20000,
    expiresAt: '2026-12-31',
    badge: 'NEW USER',
  },
  {
    code: 'MLBBHEMAT',
    title: 'Cashback Diamond MLBB',
    description: 'Potongan langsung Rp 5.000 untuk pembelian minimal 257 Diamonds atau Weekly Pass.',
    discountFixed: 5000,
    minTransaction: 50000,
    gameFilter: ['mobile-legends'],
    expiresAt: '2026-12-31',
    badge: 'MLBB SPECIAL',
  },
  {
    code: 'PASSHARI',
    title: 'Potongan Weekly Pass',
    description: 'Potongan hemat Rp 3.000 khusus untuk pembelian Weekly Diamond Pass & Membership.',
    discountFixed: 3000,
    minTransaction: 25000,
    expiresAt: '2026-12-31',
    badge: 'PASS HEMAT',
  },
];

export const validatePromoCode = (inputCode, subtotal, gameSlug) => {
  if (!inputCode) return { valid: false, message: 'Masukkan kode promo.' };
  
  const cleanCode = inputCode.trim().toUpperCase();
  const promo = ACTIVE_PROMOS.find((p) => p.code === cleanCode);

  if (!promo) {
    return { valid: false, message: 'Kode promo tidak ditemukan atau sudah kedaluwarsa.' };
  }

  if (subtotal < promo.minTransaction) {
    return {
      valid: false,
      message: `Minimal transaksi untuk kode ini adalah Rp ${promo.minTransaction.toLocaleString('id-ID')}.`,
    };
  }

  if (promo.gameFilter && !promo.gameFilter.includes(gameSlug)) {
    return {
      valid: false,
      message: 'Kode promo ini tidak berlaku untuk game yang dipilih.',
    };
  }

  let discountAmount = 0;
  if (promo.discountFixed) {
    discountAmount = promo.discountFixed;
  } else if (promo.discountPercent) {
    discountAmount = Math.round((subtotal * promo.discountPercent) / 100);
    if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
      discountAmount = promo.maxDiscount;
    }
  }

  return {
    valid: true,
    promo,
    discountAmount,
    message: `Promo ${promo.code} berhasil diterapkan! Hemat Rp ${discountAmount.toLocaleString('id-ID')}.`,
  };
};
