/**
 * Format angka ke format mata uang Rupiah (IDR)
 * @param {number} number
 * @returns {string} contoh: Rp 50.000
 */
export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);
};

/**
 * Format tanggal ISO ke format Indonesia yang mudah dibaca
 * @param {string|Date} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
