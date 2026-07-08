import { Shield } from "lucide-react";

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 rounded-2xl bg-[#3b6fe0] text-white flex items-center justify-center shadow-sm">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0e1c3d]">Chargement de votre espace QARA</p>
          <p className="mt-1 text-xs text-[#6b7688]">Verification de la session en cours.</p>
        </div>
      </div>
    </div>
  );
}
