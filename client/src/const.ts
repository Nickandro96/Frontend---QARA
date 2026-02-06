
export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Generate login URL at runtime.
 * MODIFIED: Forcing local login instead of Manus OAuth to resolve access issues.
 */
export const getLoginUrl = () => {
  return "/login";
};
