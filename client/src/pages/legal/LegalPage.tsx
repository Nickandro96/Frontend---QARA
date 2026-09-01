import type { ReactNode } from "react";
import { Link } from "wouter";

export type LegalSection = { id: string; title: string; content: ReactNode };

export function LegalPage({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <main id="top" className="min-h-screen bg-[#f4f6f9] px-4 py-10 text-[#0e1c3d]">
      <article className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm sm:p-10">
        <Link href="/" className="text-sm font-medium text-[#2558c7] hover:underline">← Retour à QARA</Link>
        <h1 className="mt-5 text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-[#6b7688]">Dernière mise à jour : 1er septembre 2026</p>
        <nav className="my-8 rounded-lg bg-[#f4f6f9] p-5" aria-label="Table des matières">
          <h2 className="font-semibold">Table des matières</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5">
            {sections.map((section) => <li key={section.id}><a href={`#${section.id}`} className="text-[#2558c7] hover:underline">{section.title}</a></li>)}
          </ol>
        </nav>
        <div className="space-y-10 leading-7 text-[#344054]">
          {sections.map((section) => (
            <section id={section.id} key={section.id} className="scroll-mt-6">
              <h2 className="mb-3 text-xl font-semibold text-[#0e1c3d]">{section.title}</h2>
              <div className="space-y-3">{section.content}</div>
            </section>
          ))}
        </div>
        <a href="#top" className="mt-10 inline-block text-sm font-medium text-[#2558c7] hover:underline">Retour en haut</a>
      </article>
    </main>
  );
}
