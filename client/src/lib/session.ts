Exit code: 0
Wall time: 1 seconds
Output:
const RUNTIME_USER_INFO_KEY = "manus-runtime-user-info";
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/contact",
  "/faq",
  "/404",
]);

function currentPath() {
  if (typeof window === "undefined") return "/dashboard";
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (value.startsWith("/login") || value.startsWith("/signup")) return "/dashboard";
  return value;
}

export function buildLoginUrl(returnTo = currentPath()) {
  const target = sanitizeReturnTo(returnTo);
  return `/login?returnTo=${encodeURIComponent(target)}`;
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(RUNTIME_USER_INFO_KEY);
}

export function redirectToLogin(returnTo = currentPath()) {
  if (typeof window === "undefined") return;
  if (PUBLIC_ROUTES.has(window.location.pathname)) return;
  window.location.assign(buildLoginUrl(returnTo));
}

