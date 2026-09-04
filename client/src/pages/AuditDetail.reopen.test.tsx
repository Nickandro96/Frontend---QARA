import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  audit: { id: 10, status: "completed", reference: "AUD-10", referentialIds: [] } as any,
  mutateAsync: vi.fn(),
  refetch: vi.fn(),
  navigate: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  isPending: false,
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1 }, isAuthenticated: true, loading: false }) }));
vi.mock("@/const", () => ({ getLoginUrl: () => "/login" }));
vi.mock("@/lib/auditLabels", () => ({ auditTypeLabel: () => "Interne" }));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (value: string) => value }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));
vi.mock("wouter", () => ({
  useParams: () => ({ id: "10" }),
  useLocation: () => ["/audits/10", mocks.navigate],
  Link: ({ children }: any) => children,
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    audit: {
      getById: { useQuery: () => ({ data: mocks.audit, isLoading: false, refetch: mocks.refetch }) },
      reopen: { useMutation: () => ({ mutateAsync: mocks.mutateAsync, isPending: mocks.isPending }) },
      updateReportFields: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
    referentials: { list: { useQuery: () => ({ data: [] }) } },
    findings: { list: { useQuery: () => ({ data: [] }) } },
    actions: { list: { useQuery: () => ({ data: [] }) } },
  },
}));

import AuditDetail from "./AuditDetail";

function renderPage(status: string) {
  mocks.audit = { id: 10, status, reference: "AUD-10", referentialIds: [] };
  return render(<AuditDetail />);
}

beforeEach(() => {
  mocks.audit = { id: 10, status: "completed", reference: "AUD-10", referentialIds: [] };
  mocks.isPending = false;
  vi.clearAllMocks();
  mocks.mutateAsync.mockResolvedValue({ success: true });
  mocks.refetch.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe("réouverture d’un audit", () => {
  it("affiche le bouton uniquement pour completed et ouvre le dialogue sans mutation", () => {
    renderPage("completed");
    fireEvent.click(screen.getByRole("button", { name: "Réouvrir l'audit" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Réouvrir cet audit ?")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("refuse le vide et les espaces, avec minimum 5 et maximum 2000 caractères", () => {
    renderPage("completed");
    fireEvent.click(screen.getByRole("button", { name: "Réouvrir l'audit" }));
    const confirm = screen.getByRole("button", { name: "Confirmer la réouverture" });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Motif de la réouverture"), { target: { value: "    " } });
    expect(confirm).toBeDisabled();
    expect(screen.getByLabelText("Motif de la réouverture")).toHaveAttribute("maxlength", "2000");
  });

  it("envoie auditId et le motif trimé uniquement à la confirmation", async () => {
    renderPage("completed");
    fireEvent.click(screen.getByRole("button", { name: "Réouvrir l'audit" }));
    fireEvent.change(screen.getByLabelText("Motif de la réouverture"), { target: { value: "  Preuves complémentaires  " } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la réouverture" }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({ auditId: 10, reason: "Preuves complémentaires" }));
  });

  it("empêche une double soumission pendant le chargement", () => {
    mocks.isPending = true;
    renderPage("completed");
    expect(screen.getByRole("button", { name: "Réouvrir l'audit" })).toBeDisabled();
  });

  it("au succès actualise, confirme, ferme le dialogue et reprend le questionnaire", async () => {
    renderPage("completed");
    fireEvent.click(screen.getByRole("button", { name: "Réouvrir l'audit" }));
    fireEvent.change(screen.getByLabelText("Motif de la réouverture"), { target: { value: "Correction documentée" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la réouverture" }));
    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledOnce());
    expect(mocks.success).toHaveBeenCalledWith("Audit réouvert avec succès");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.navigate).toHaveBeenCalledWith("/audit/10/questionnaire");
  });

  it("en cas d’erreur conserve le dialogue et le motif, avec un message neutre", async () => {
    mocks.mutateAsync.mockRejectedValueOnce(new Error("secret interne"));
    renderPage("completed");
    fireEvent.click(screen.getByRole("button", { name: "Réouvrir l'audit" }));
    const field = screen.getByLabelText("Motif de la réouverture");
    fireEvent.change(field, { target: { value: "Correction documentée" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmer la réouverture" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(field).toHaveValue("Correction documentée");
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain("secret interne");
  });

  it("closed ne propose rien ; draft et in_progress reprennent sans réouverture", () => {
    const closed = renderPage("closed");
    expect(screen.queryByRole("button", { name: /Réouvrir|Reprendre/ })).not.toBeInTheDocument();
    closed.unmount();
    for (const status of ["draft", "in_progress"]) {
      const page = renderPage(status);
      fireEvent.click(screen.getByRole("button", { name: "Reprendre l'audit" }));
      expect(mocks.navigate).toHaveBeenCalledWith("/audit/10/questionnaire");
      expect(mocks.mutateAsync).not.toHaveBeenCalled();
      page.unmount();
    }
  });

  it("l’annulation ferme le dialogue sans mutation", () => {
    renderPage("completed");
    fireEvent.click(screen.getByRole("button", { name: "Réouvrir l'audit" }));
    fireEvent.change(screen.getByLabelText("Motif de la réouverture"), { target: { value: "Correction documentée" } });
    fireEvent.click(screen.getByRole("button", { name: "Annuler" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
