import { Link } from "wouter";

const contact = "infos@n3-conseil.com";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">← Retour à QARA</Link>
        <h1 className="mt-6 text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Version du 1er octobre 2026</p>
        <div className="prose prose-slate mt-8 max-w-none">{children}</div>
        <nav className="mt-12 flex flex-wrap gap-4 border-t pt-6 text-sm">
          <Link href="/cgu" className="text-blue-700 hover:underline">CGU</Link>
          <Link href="/politique-confidentialite" className="text-blue-700 hover:underline">Confidentialité</Link>
          <Link href="/mentions-legales" className="text-blue-700 hover:underline">Mentions légales</Link>
          <a href={`mailto:${contact}`} className="text-blue-700 hover:underline">{contact}</a>
        </nav>
      </div>
    </main>
  );
}

export function TermsOfUse() {
  return <Shell title="Conditions générales d’utilisation">
    <h2>Objet</h2><p>QARA est une plateforme d’aide à la préparation et au suivi d’audits réglementaires et qualité. Elle ne remplace ni un organisme notifié, ni un conseil juridique ou réglementaire, ni la décision du responsable qualité.</p>
    <h2>Compte et accès</h2><p>L’utilisateur protège ses identifiants, renseigne des informations exactes et signale sans délai tout accès non autorisé. Les droits sont limités à l’organisation à laquelle le compte appartient.</p>
    <h2>Données et contenus</h2><p>Le client reste responsable des données, preuves et conclusions qu’il saisit. Les résultats automatisés doivent être vérifiés avant toute utilisation réglementaire ou décision de libération.</p>
    <h2>Disponibilité et support</h2><p>Les incidents et demandes de support sont adressés à <a href={`mailto:${contact}`}>{contact}</a>. Les engagements contractuels de disponibilité et de délai de réponse figurent, le cas échéant, dans l’offre ou le contrat signé.</p>
    <h2>Résiliation</h2><p>Les modalités tarifaires, de renouvellement, d’export et de suppression applicables sont celles de l’offre souscrite. Avant toute suppression, le client doit exporter les éléments qu’il doit conserver au titre de ses obligations.</p>
    <h2>Droit applicable</h2><p>Les présentes conditions sont soumises au droit français, sous réserve des règles impératives applicables. Toute question peut être adressée à <a href={`mailto:${contact}`}>{contact}</a>.</p>
  </Shell>;
}

export function PrivacyPolicy() {
  return <Shell title="Politique de confidentialité">
    <h2>Responsable et contact</h2><p>Pour l’administration des comptes, la relation commerciale et la sécurité du service, QARA/N3-Conseil traite les données nécessaires au fonctionnement de la plateforme. Pour toute question ou exercice de droits : <a href={`mailto:${contact}`}>{contact}</a>.</p>
    <h2>Données et finalités</h2><p>Les données de compte, coordonnées professionnelles, journaux de sécurité, informations d’abonnement et contenus d’audit sont traités pour fournir le service, sécuriser les accès, assister les utilisateurs et respecter les obligations légales.</p>
    <h2>Bases légales</h2><p>Les traitements reposent selon le cas sur l’exécution du contrat, l’intérêt légitime de sécurisation et d’amélioration du service, le respect d’obligations légales ou le consentement pour les communications facultatives.</p>
    <h2>Destinataires et sous-traitants</h2><p>Les données sont accessibles aux personnes autorisées et aux prestataires strictement nécessaires à l’hébergement, au stockage, à l’envoi d’e-mails, au paiement et aux fonctions d’assistance automatisée, dans le cadre d’engagements contractuels appropriés.</p>
    <h2>Conservation et sécurité</h2><p>Les données sont conservées pendant la relation contractuelle puis durant les délais nécessaires aux obligations légales, à la défense des droits et aux sauvegardes techniques. Des mesures de contrôle d’accès, chiffrement des transports, journalisation et sauvegarde sont mises en œuvre.</p>
    <h2>Vos droits</h2><p>Vous pouvez demander l’accès, la rectification, l’effacement, la limitation, l’opposition ou la portabilité lorsque ces droits s’appliquent, en écrivant à <a href={`mailto:${contact}`}>{contact}</a>. Vous pouvez aussi saisir la CNIL.</p>
  </Shell>;
}

export function LegalNotice() {
  return <Shell title="Mentions légales">
    <h2>Éditeur</h2><p>QARA est un service édité sous la marque N3-Conseil / Q-Ops Services. Contact général et protection des données : <a href={`mailto:${contact}`}>{contact}</a>.</p>
    <h2>Direction de la publication</h2><p>Direction de la publication : Klauss Ngankep.</p>
    <h2>Hébergement</h2><p>Le frontend est hébergé par Vercel. Les services applicatifs et la base de données sont hébergés par Railway. Les rapports peuvent être stockés sur Cloudflare R2.</p>
    <h2>Propriété intellectuelle</h2><p>La plateforme, sa structure, ses textes, éléments graphiques et logiciels sont protégés par les droits applicables. Toute reproduction non autorisée est interdite.</p>
    <h2>Contact</h2><p>Pour toute notification relative au service : <a href={`mailto:${contact}`}>{contact}</a>.</p>
  </Shell>;
}
