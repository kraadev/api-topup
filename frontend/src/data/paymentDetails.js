// Generator Data Pembayaran (VA, QRIS, E-Wallet)

export const generatePaymentDetails = (methodId, orderId, totalAmount, itemName) => {
  const cleanId = String(orderId || Date.now()).slice(-6);
  const now = new Date();
  const expiredAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 Jam

  switch (methodId) {
    case 'bca_va':
      return {
        type: 'VA',
        bankName: 'BCA (Bank Central Asia)',
        code: 'BCA',
        vaNumber: `80012${cleanId}8912`,
        accountName: 'TRIPLE S TOP-UP',
        totalAmount,
        expiredAt: expiredAt.toISOString(),
        instructions: [
          {
            tab: 'BCA Mobile (m-BCA)',
            steps: [
              'Buka aplikasi BCA mobile dan pilih menu m-BCA.',
              'Pilih menu m-Transfer, lalu klik BCA Virtual Account.',
              'Masukkan nomor Virtual Account: 80012' + cleanId + '8912.',
              'Periksa rincian pembayaran ' + itemName + ' dan total tagihan.',
              'Masukkan PIN m-BCA Anda untuk menyelesaikan transaksi.',
            ],
          },
          {
            tab: 'KlikBCA (Internet Banking)',
            steps: [
              'Login ke KlikBCA Individual.',
              'Pilih menu Transfer Dana, lalu Transfer ke BCA Virtual Account.',
              'Masukkan nomor Virtual Account 80012' + cleanId + '8912.',
              'Validasi nominal transaksi dan gunakan KeyBCA untuk konfirmasi.',
            ],
          },
          {
            tab: 'ATM BCA',
            steps: [
              'Masukkan Kartu ATM BCA dan PIN Anda.',
              'Pilih menu Transaksi Lainnya > Transfer > Ke Rek BCA Virtual Account.',
              'Masukkan nomor Virtual Account 80012' + cleanId + '8912.',
              'Pastikan nominal sudah sesuai, lalu pilih YA.',
            ],
          },
        ],
      };

    case 'mandiri_va':
      return {
        type: 'VA',
        bankName: 'Bank Mandiri',
        code: 'MANDIRI',
        vaNumber: `89508${cleanId}5678`,
        accountName: 'TRIPLE S TOP-UP',
        totalAmount,
        expiredAt: expiredAt.toISOString(),
        instructions: [
          {
            tab: 'Livin by Mandiri',
            steps: [
              'Buka aplikasi Livin by Mandiri dan Login.',
              'Pilih menu Bayar > Buat Pembayaran Baru > Multipayment.',
              'Pilih penyedia jasa TRIPLE S atau masukkan kode 89508.',
              'Masukkan Nomor VA: 89508' + cleanId + '5678.',
              'Konfirmasi tagihan dan masukkan PIN Livin Anda.',
            ],
          },
          {
            tab: 'ATM Mandiri',
            steps: [
              'Masukkan Kartu ATM dan PIN Mandiri.',
              'Pilih menu Bayar/Beli > Lainnya > Multi Payment.',
              'Masukkan kode perusahaan atau nomor VA 89508' + cleanId + '5678.',
              'Periksa detail tagihan lalu tekan YA.',
            ],
          },
        ],
      };

    case 'bri_va':
      return {
        type: 'VA',
        bankName: 'Bank BRI (BRIVA)',
        code: 'BRI',
        vaNumber: `12800${cleanId}4321`,
        accountName: 'TRIPLE S TOP-UP',
        totalAmount,
        expiredAt: expiredAt.toISOString(),
        instructions: [
          {
            tab: 'BRImo',
            steps: [
              'Buka aplikasi BRImo dan login akun Anda.',
              'Pilih menu Tagihan > BRIVA.',
              'Pilih Pembayaran Baru dan masukkan nomor BRIVA: 12800' + cleanId + '4321.',
              'Periksa nama pelanggan dan total bayar.',
              'Masukkan PIN BRImo untuk konfirmasi pembayaran.',
            ],
          },
          {
            tab: 'ATM BRI',
            steps: [
              'Masukkan Kartu ATM dan PIN BRI.',
              'Pilih menu Transaksi Lain > Pembayaran > Lainnya > BRIVA.',
              'Masukkan nomor BRIVA 12800' + cleanId + '4321.',
              'Pilih YA untuk eksekusi pembayaran.',
            ],
          },
        ],
      };

    case 'bni_va':
      return {
        type: 'VA',
        bankName: 'Bank BNI',
        code: 'BNI',
        vaNumber: `98801${cleanId}9876`,
        accountName: 'TRIPLE S TOP-UP',
        totalAmount,
        expiredAt: expiredAt.toISOString(),
        instructions: [
          {
            tab: 'BNI Mobile Banking',
            steps: [
              'Buka BNI Mobile Banking dan login.',
              'Pilih menu Transfer > Virtual Account Billing.',
              'Pilih Input Baru dan masukkan nomor: 98801' + cleanId + '9876.',
              'Konfirmasi nominal dan masukkan Password Transaksi.',
            ],
          },
        ],
      };

    case 'qris_all':
    case 'gopay':
    case 'dana':
    case 'ovo':
    case 'shopeepay':
      return {
        type: 'QRIS',
        merchantName: 'TRIPLE S TOP-UP GATEWAY',
        nmid: 'ID1020030040050',
        totalAmount,
        expiredAt: expiredAt.toISOString(),
        instructions: [
          {
            tab: 'Cara Bayar QRIS',
            steps: [
              'Buka aplikasi Mobile Banking atau E-Wallet pilihan Anda (GoPay, OVO, DANA, ShopeePay, BCA Mobile, dll).',
              'Pilih menu Scan QR / Bayar dengan QRIS.',
              'Arahkan kamera ke kode QRIS yang tertera di layar.',
              'Pastikan nama merchant adalah TRIPLE S TOP-UP GATEWAY.',
              'Periksa nominal pembayaran dan selesaikan transaksi dengan PIN Anda.',
            ],
          },
        ],
      };

    default:
      return {
        type: 'WALLET',
        accountName: 'Saldo Dompet Triple S',
        totalAmount,
        expiredAt: expiredAt.toISOString(),
      };
  }
};
