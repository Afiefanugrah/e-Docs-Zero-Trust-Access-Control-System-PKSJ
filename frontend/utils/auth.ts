/**
 * Utility functions for session management and JWT handling
 */

/**
 * Checks if a JWT token is expired on the client side.
 * @param token JWT token string
 * @returns boolean true if expired, false otherwise
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const payloadBase64 = parts[1];
    // Safe Base64 decoding supporting unicode characters and URL-safe base64
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      )
    );

    if (decodedPayload.exp) {
      const expirationTime = decodedPayload.exp * 1000;
      // Buffer of 5 seconds to prevent race conditions on edge expiration
      return expirationTime < Date.now() - 5000;
    }
    return false;
  } catch (error) {
    console.error("Error decoding token:", error);
    return true; // Assume expired/invalid on error
  }
};

/**
 * Clears all auth data from sessionStorage and localStorage.
 */
export const clearSession = (): void => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userRole");
    sessionStorage.removeItem("userId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
  }
};

/**
 * Handles expired session state: clears storage, displays warning, and redirects.
 * @param router Next.js router instance
 * @param Swal SweetAlert2 instance
 */
export const handleSessionExpired = (router: any, Swal: any): void => {
  clearSession();
  
  if (Swal) {
    Swal.fire({
      icon: "warning",
      title: "Sesi Kedaluwarsa",
      text: "Sesi Anda telah berakhir. Harap login ulang.",
      confirmButtonText: "OK",
    }).then(() => {
      router.push("/login");
    });
  } else {
    router.push("/login");
  }
};
