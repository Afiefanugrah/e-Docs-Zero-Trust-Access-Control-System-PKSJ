export interface PasswordResult {
  valid: boolean;
  message?: string;
}

export const validatePassword = (password: string): PasswordResult => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password minimal harus 8 karakter.",
    };
  }

  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  const specialCharCount = (password.match(/[^a-zA-Z0-9]/g) || []).length;

  if (
    uppercaseCount < 1 ||
    lowercaseCount < 1 ||
    numberCount < 1 ||
    specialCharCount < 1
  ) {
    return {
      valid: false,
      message:
        "Password harus mengandung minimal 1 huruf kapital, huruf kecil, angka, dan karakter spesial",
    };
  }

  return { valid: true };
};
