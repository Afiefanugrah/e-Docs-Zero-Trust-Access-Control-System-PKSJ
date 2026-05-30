import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Menghasilkan hash bcrypt untuk password yang diberikan.
 * @param password Password teks biasa
 * @returns Promise berisi password hash
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Membandingkan password teks biasa dengan hash bcrypt yang tersimpan.
 * @param password Password teks biasa
 * @param hash Hash password yang disimpan
 * @returns Promise boolean (true jika cocok, false jika tidak)
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
