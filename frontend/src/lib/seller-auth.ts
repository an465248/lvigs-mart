const SELLER_AUTH_KEY = "lvigs_seller_auth";

export function isSellerLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SELLER_AUTH_KEY) === "true";
}

export function sellerLogin() {
  localStorage.setItem(SELLER_AUTH_KEY, "true");
}

export function sellerLogout() {
  localStorage.removeItem(SELLER_AUTH_KEY);
}
