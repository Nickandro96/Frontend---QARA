import { LegalPage, type LegalSection } from "./LegalPage";

const sections: LegalSection[] = [
  { id: "editeur", title: "Éditeur du site", content: <p>NGANKEP NZETCHOUANG NICK, entrepreneur individuel exerçant sous le nom commercial N3 CONSEIL. Siège : étage 1, appartement 325, 5 place Ingres, 37200 Tours, France. SIREN : 912 622 222 — SIRET du siège : 912 622 222 00020. Capital social : non applicable. Email : <a className="text-[#2558c7] underline" href="mailto:infos@n3-conseil.com">infos@n3-conseil.com</a>. Directeur de la publication : Klauss Ngankep.</p> },
  { id: "hebergeur", title: "Hébergement", content: <><p>Backend et base de données : Railway Corporation, 548 Market St PMB 68956, San Francisco, CA 94104, États-Unis — <a className="text-[#2558c7] underline" href="https://railway.com" target="_blank" rel="noreferrer">railway.com</a>. Les ressources applicatives sont configurées dans une région de l'Union européenne.</p><p>Frontend et diffusion : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — <a className="text-[#2558c7] underline" href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>.</p></> },
  { id: "propriete", title: "Propriété intellectuelle", content: <p>Tous droits réservés NGANKEP NZETCHOUANG NICK, exerçant sous le nom commercial N3 CONSEIL. Les référentiels, marques et textes réglementaires cités restent la propriété de leurs organismes émetteurs ou sont réutilisés selon les règles applicables aux documents officiels.</p> },
  { id: "contact", title: "Contact", content: <p>Pour toute question relative au site : <a className="text-[#2558c7] underline" href="mailto:infos@n3-conseil.com">infos@n3-conseil.com</a>.</p> },
];

export default function MentionsLegales() { return <LegalPage title="Mentions légales" sections={sections} />; }
