"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = exports.validateUsername = void 0;
const validateUsername = (username) => {
    if (/\s/.test(username)) {
        return {
            isValid: false,
            message: "Username tidak boleh mengandung spasi.",
        };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            isValid: false,
            message: "Username hanya boleh huruf, angka, dan underscore.",
        };
    }
    if (username.length < 5) {
        return { isValid: false, message: "Username minimal 5 karakter." };
    }
    if (!/[A-Z]/.test(username)) {
        return {
            isValid: false,
            message: "Username harus memiliki minimal 1 huruf kapital.",
        };
    }
    return { isValid: true };
};
exports.validateUsername = validateUsername;
const validatePassword = (password) => {
    if (password.length < 8) {
        return {
            isValid: false,
            message: "Password minimal harus 8 karakter.",
        };
    }
    const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
    const lowercaseCount = (password.match(/[a-z]/g) || []).length;
    const numberCount = (password.match(/[0-9]/g) || []).length;
    const specialCharCount = (password.match(/[^a-zA-Z0-9]/g) || []).length;
    if (uppercaseCount < 1 ||
        lowercaseCount < 1 ||
        numberCount < 1 ||
        specialCharCount < 1) {
        return {
            isValid: false,
            message: "Password harus mengandung minimal 1 huruf kapital, huruf kecil, angka, dan karakter spesial",
        };
    }
    return { isValid: true };
};
exports.validatePassword = validatePassword;
