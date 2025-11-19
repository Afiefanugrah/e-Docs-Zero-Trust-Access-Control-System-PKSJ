// src/utils/validators.ts

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// --- VALIDASI USERNAME ---
export const validateUsername = (username: string): ValidationResult => {
  // 1. Cek Spasi (Haram hukumnya username ada spasi)
  if (/\s/.test(username)) {
    return {
      isValid: false,
      message: "Username tidak boleh mengandung spasi.",
    };
  }

  // 2. Cek Simbol Aneh (Opsional, tapi disarankan biar URL aman)
  // Hanya boleh Huruf, Angka, dan Underscore (_)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      isValid: false,
      message: "Username hanya boleh huruf, angka, dan underscore.",
    };
  }

  // 3. Cek Panjang
  if (username.length < 5) {
    return { isValid: false, message: "Username minimal 5 karakter." };
  }

  // 4. Cek Huruf Kapital (Sesuai request kamu)
  // Tapi ingat peringatan saya soal UX di atas ya :)
  if (!/[A-Z]/.test(username)) {
    return {
      isValid: false,
      message: "Username harus memiliki minimal 1 huruf kapital.",
    };
  }

  return { isValid: true };
};
