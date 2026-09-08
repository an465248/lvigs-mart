const AUTH_KEY = "lvigs_admin_auth";

export function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function adminLogin() {
  localStorage.setItem(AUTH_KEY, "true");
}

export function adminLogout() {
  localStorage.removeItem(AUTH_KEY);
}
