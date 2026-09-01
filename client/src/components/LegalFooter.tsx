import { Link } from "wouter";

export function LegalFooter() {
  return (
    <footer className="border-t border-[#dce3ef] bg-white px-4 py-6 text-center text-sm text-[#5f6b7a]">
      <p>© 2026 QARA — N3 CONSEIL</p>
      <nav className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-2" aria-label="Liens légaux">
        <Link href="/cgu" className="hover:text-[#2558c7] hover:underline">CGU</Link>
        <Link href="/politique-confidentialite" className="hover:text-[#2558c7] hover:underline">Politique de confidentialité</Link>
        <Link href="/mentions-legales" className="hover:text-[#2558c7] hover:underline">Mentions légales</Link>
      </nav>
    </footer>
  );
}
