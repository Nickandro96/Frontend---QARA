import { describe, expect, it } from "vitest";
import { buildLoginUrl, sanitizeReturnTo } from "./session";

describe("auth returnTo", () => {
  it("preserves an internal destination", () => {
    expect(sanitizeReturnTo("/audits/42?tab=capa")).toBe("/audits/42?tab=capa");
    expect(buildLoginUrl("/audits/42")).toBe("/login?returnTo=%2Faudits%2F42");
  });

  it("rejects external and authentication-loop destinations", () => {
    expect(sanitizeReturnTo("https://evil.test")).toBe("/dashboard");
    expect(sanitizeReturnTo("//evil.test/path")).toBe("/dashboard");
    expect(sanitizeReturnTo("/login?returnTo=/login")).toBe("/dashboard");
    expect(sanitizeReturnTo("/signup")).toBe("/dashboard");
  });
});
