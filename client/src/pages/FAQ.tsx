import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Search, 
  ChevronDown, 
  ChevronUp,
  FileText,
  Scale,
  Globe,
  Building2,
  AlertTriangle,
  Clock
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export default function FAQ() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // FAQ data - localized
  const faqData: FAQItem[] = currentLang === "fr" ? [
    // MDR Questions
    {
      id: "mdr-1",
      question: "Qu'est-ce que le règlement MDR 2017/745 ?",
      answer: "Le règlement (UE) 2017/745 relatif aux dispositifs médicaux (MDR) est le cadre réglementaire européen qui régit la mise sur le marché et la surveillance des dispositifs médicaux dans l'Union européenne. Il remplace les directives 93/42/CEE et 90/385/CEE et est entré en application le 26 mai 2021. Le MDR renforce les exigences en matière de sécurité, de traçabilité et de surveillance post-commercialisation.",
      category: "mdr",
      tags: ["réglementation", "europe", "dispositifs médicaux"]
    },
    {
      id: "mdr-2",
      question: "Quelles sont les différentes classes de dispositifs médicaux selon le MDR ?",
      answer: "Le MDR définit 4 classes de risque : Classe I (risque le plus faible), Classe IIa (risque faible à modéré), Classe IIb (risque modéré à élevé), et Classe III (risque le plus élevé). La classification est déterminée selon les règles de l'Annexe VIII du MDR, en fonction de critères comme l'invasivité, la durée d'utilisation, le site anatomique et la fonction du dispositif.",
      category: "mdr",
      tags: ["classification", "classes", "annexe VIII"]
    },
    {
      id: "mdr-3",
      question: "Qu'est-ce qu'un organisme notifié et quel est son rôle ?",
      answer: "Un organisme notifié est une organisation désignée par un État membre de l'UE pour évaluer la conformité des dispositifs médicaux de classe supérieure (IIa, IIb, III). Il vérifie que le fabricant respecte les exigences du MDR, audite le système de management de la qualité, et délivre les certificats CE nécessaires à la mise sur le marché.",
      category: "mdr",
      tags: ["organisme notifié", "certification", "audit"]
    },
    {
      id: "mdr-4",
      question: "Qu'est-ce que la documentation technique requise par le MDR ?",
      answer: "La documentation technique est un ensemble complet de documents démontrant la conformité du dispositif aux exigences du MDR. Elle comprend : la description du dispositif, les spécifications de conception, les analyses de risques, la vérification et validation, l'évaluation clinique, l'étiquetage et les instructions d'utilisation, ainsi que les informations sur la fabrication et le contrôle qualité.",
      category: "mdr",
      tags: ["documentation technique", "conformité", "dossier"]
    },
    {
      id: "mdr-5",
      question: "Qu'est-ce que l'UDI (Unique Device Identification) ?",
      answer: "L'UDI est un système d'identification unique des dispositifs médicaux composé d'un identifiant dispositif (UDI-DI) et d'un identifiant de production (UDI-PI). Il permet la traçabilité complète des dispositifs, facilite les rappels de produits et améliore la surveillance post-commercialisation. Les données UDI doivent être enregistrées dans la base de données EUDAMED.",
      category: "mdr",
      tags: ["UDI", "traçabilité", "EUDAMED"]
    },
    // ISO 13485 Questions
    {
      id: "iso-1",
      question: "Qu'est-ce que la norme ISO 13485 ?",
      answer: "L'ISO 13485 est la norme internationale spécifiant les exigences relatives au système de management de la qualité (SMQ) pour les organisations impliquées dans le cycle de vie des dispositifs médicaux. Elle est harmonisée avec le MDR et constitue une base pour démontrer la conformité aux exigences réglementaires.",
      category: "iso",
      tags: ["ISO 13485", "qualité", "SMQ"]
    },
    {
      id: "iso-2",
      question: "Quelle est la différence entre ISO 13485 et ISO 9001 ?",
      answer: "L'ISO 13485 est spécifique aux dispositifs médicaux et met l'accent sur la sécurité et l'efficacité des produits, la gestion des risques et la traçabilité. L'ISO 9001 est une norme générique de management de la qualité axée sur l'amélioration continue et la satisfaction client. L'ISO 13485 n'exige pas l'amélioration continue mais requiert le maintien de l'efficacité du SMQ.",
      category: "iso",
      tags: ["ISO 9001", "comparaison", "SMQ"]
    },
    // FDA Questions
    {
      id: "fda-1",
      question: "Qu'est-ce que le QMSR (Quality Management System Regulation) de la FDA ?",
      answer: "Le QMSR est la nouvelle réglementation de la FDA qui remplace le 21 CFR Part 820 (QSR). Entré en vigueur le 2 février 2026, il aligne les exigences américaines avec l'ISO 13485:2016 tout en conservant certaines exigences spécifiques FDA. Le QMSR simplifie la conformité pour les fabricants opérant sur les marchés américain et international.",
      category: "fda",
      tags: ["QMSR", "FDA", "Part 820"]
    },
    {
      id: "fda-2",
      question: "Quelles sont les voies d'accès au marché américain pour les dispositifs médicaux ?",
      answer: "La FDA propose plusieurs voies : 510(k) pour les dispositifs de classe II avec un prédicat, De Novo pour les nouveaux dispositifs à risque faible/modéré sans prédicat, PMA (Premarket Approval) pour les dispositifs de classe III à haut risque, et l'exemption pour certains dispositifs de classe I. Le choix dépend de la classification et de l'existence d'un dispositif prédicat.",
      category: "fda",
      tags: ["510(k)", "De Novo", "PMA", "classification"]
    },
    {
      id: "fda-3",
      question: "Qu'est-ce qu'un dispositif prédicat (predicate device) ?",
      answer: "Un dispositif prédicat est un dispositif légalement commercialisé aux États-Unis auquel un nouveau dispositif peut être comparé pour démontrer son équivalence substantielle dans le cadre d'une soumission 510(k). Le prédicat doit avoir la même destination et des caractéristiques technologiques similaires ou, si différentes, ne pas soulever de nouvelles questions de sécurité et d'efficacité.",
      category: "fda",
      tags: ["prédicat", "510(k)", "équivalence"]
    },
    // Platform Questions
    {
      id: "platform-1",
      question: "Comment fonctionne l'audit de conformité sur la plateforme ?",
      answer: "Notre plateforme propose un questionnaire interactif basé sur les 1203 exigences du MDR et de l'ISO 13485, adapté à votre rôle économique (fabricant, importateur, distributeur). Pour chaque question, vous pouvez indiquer votre statut de conformité, ajouter des commentaires et télécharger des preuves. L'IA contextuelle vous guide avec des recommandations personnalisées.",
      category: "platform",
      tags: ["audit", "questionnaire", "conformité"]
    },
    {
      id: "platform-2",
      question: "Comment est calculé mon score de conformité ?",
      answer: "Le score de conformité est calculé en pourcentage : (nombre de réponses conformes / nombre total de questions applicables) × 100. Les questions marquées 'Non applicable' sont exclues du calcul. Le score est affiché par processus (Gouvernance, QMS, RA, PMS, etc.) et globalement pour vous permettre d'identifier les axes d'amélioration prioritaires.",
      category: "platform",
      tags: ["score", "calcul", "conformité"]
    },
    {
      id: "platform-3",
      question: "Puis-je exporter mes résultats d'audit ?",
      answer: "Oui, la plateforme permet d'exporter vos résultats en plusieurs formats : rapport PDF détaillé avec justifications et recommandations, fichier Excel pour analyse et suivi, et plan d'action priorisé. Ces exports sont disponibles pour les abonnés Pro, Expert et Entreprise.",
      category: "platform",
      tags: ["export", "rapport", "PDF", "Excel"]
    }
  ] : [
    // MDR Questions (English)
    {
      id: "mdr-1",
      question: "What is the MDR 2017/745 regulation?",
      answer: "Regulation (EU) 2017/745 on medical devices (MDR) is the European regulatory framework governing the placing on the market and surveillance of medical devices in the European Union. It replaces Directives 93/42/EEC and 90/385/EEC and has been applicable since May 26, 2021. The MDR strengthens requirements for safety, traceability, and post-market surveillance.",
      category: "mdr",
      tags: ["regulation", "europe", "medical devices"]
    },
    {
      id: "mdr-2",
      question: "What are the different medical device classes under MDR?",
      answer: "The MDR defines 4 risk classes: Class I (lowest risk), Class IIa (low to moderate risk), Class IIb (moderate to high risk), and Class III (highest risk). Classification is determined according to Annex VIII rules, based on criteria such as invasiveness, duration of use, anatomical site, and device function.",
      category: "mdr",
      tags: ["classification", "classes", "annex VIII"]
    },
    {
      id: "mdr-3",
      question: "What is a Notified Body and what is its role?",
      answer: "A Notified Body is an organization designated by an EU Member State to assess conformity of higher-class medical devices (IIa, IIb, III). It verifies that the manufacturer complies with MDR requirements, audits the quality management system, and issues CE certificates required for market access.",
      category: "mdr",
      tags: ["notified body", "certification", "audit"]
    },
    {
      id: "mdr-4",
      question: "What is the technical documentation required by MDR?",
      answer: "Technical documentation is a comprehensive set of documents demonstrating device conformity with MDR requirements. It includes: device description, design specifications, risk analyses, verification and validation, clinical evaluation, labeling and instructions for use, as well as manufacturing and quality control information.",
      category: "mdr",
      tags: ["technical documentation", "conformity", "dossier"]
    },
    {
      id: "mdr-5",
      question: "What is UDI (Unique Device Identification)?",
      answer: "UDI is a unique identification system for medical devices consisting of a device identifier (UDI-DI) and a production identifier (UDI-PI). It enables complete device traceability, facilitates product recalls, and improves post-market surveillance. UDI data must be registered in the EUDAMED database.",
      category: "mdr",
      tags: ["UDI", "traceability", "EUDAMED"]
    },
    // ISO 13485 Questions (English)
    {
      id: "iso-1",
      question: "What is the ISO 13485 standard?",
      answer: "ISO 13485 is the international standard specifying requirements for a quality management system (QMS) for organizations involved in the medical device lifecycle. It is harmonized with MDR and provides a basis for demonstrating compliance with regulatory requirements.",
      category: "iso",
      tags: ["ISO 13485", "quality", "QMS"]
    },
    {
      id: "iso-2",
      question: "What is the difference between ISO 13485 and ISO 9001?",
      answer: "ISO 13485 is specific to medical devices and emphasizes product safety and effectiveness, risk management, and traceability. ISO 9001 is a generic quality management standard focused on continuous improvement and customer satisfaction. ISO 13485 does not require continuous improvement but requires maintaining QMS effectiveness.",
      category: "iso",
      tags: ["ISO 9001", "comparison", "QMS"]
    },
    // FDA Questions (English)
    {
      id: "fda-1",
      question: "What is the FDA's QMSR (Quality Management System Regulation)?",
      answer: "QMSR is the FDA's new regulation replacing 21 CFR Part 820 (QSR). Effective February 2, 2026, it aligns US requirements with ISO 13485:2016 while retaining certain FDA-specific requirements. QMSR simplifies compliance for manufacturers operating in both US and international markets.",
      category: "fda",
      tags: ["QMSR", "FDA", "Part 820"]
    },
    {
      id: "fda-2",
      question: "What are the pathways to the US market for medical devices?",
      answer: "The FDA offers several pathways: 510(k) for Class II devices with a predicate, De Novo for new low/moderate risk devices without a predicate, PMA (Premarket Approval) for high-risk Class III devices, and exemption for certain Class I devices. The choice depends on classification and existence of a predicate device.",
      category: "fda",
      tags: ["510(k)", "De Novo", "PMA", "classification"]
    },
    {
      id: "fda-3",
      question: "What is a predicate device?",
      answer: "A predicate device is a legally marketed device in the United States to which a new device can be compared to demonstrate substantial equivalence in a 510(k) submission. The predicate must have the same intended use and similar technological characteristics or, if different, not raise new safety and effectiveness questions.",
      category: "fda",
      tags: ["predicate", "510(k)", "equivalence"]
    },
    // Platform Questions (English)
    {
      id: "platform-1",
      question: "How does the compliance audit work on the platform?",
      answer: "Our platform offers an interactive questionnaire based on 1203 MDR and ISO 13485 requirements, tailored to your economic role (manufacturer, importer, distributor). For each question, you can indicate your compliance status, add comments, and upload evidence. Contextual AI guides you with personalized recommendations.",
      category: "platform",
      tags: ["audit", "questionnaire", "compliance"]
    },
    {
      id: "platform-2",
      question: "How is my compliance score calculated?",
      answer: "The compliance score is calculated as a percentage: (number of compliant answers / total applicable questions) × 100. Questions marked 'Not applicable' are excluded from the calculation. The score is displayed by process (Governance, QMS, RA, PMS, etc.) and overall to help you identify priority improvement areas.",
      category: "platform",
      tags: ["score", "calculation", "compliance"]
    },
    {
      id: "platform-3",
      question: "Can I export my audit results?",
      answer: "Yes, the platform allows you to export your results in several formats: detailed PDF report with justifications and recommendations, Excel file for analysis and tracking, and prioritized action plan. These exports are available for Pro, Expert, and Enterprise subscribers.",
      category: "platform",
      tags: ["export", "report", "PDF", "Excel"]
    }
  ];

  const categories = [
    { id: "mdr", label: currentLang === "fr" ? "MDR / Réglementation UE" : "MDR / EU Regulation", icon: Scale },
    { id: "iso", label: currentLang === "fr" ? "ISO 13485 / Qualité" : "ISO 13485 / Quality", icon: FileText },
    { id: "fda", label: currentLang === "fr" ? "FDA / Marché US" : "FDA / US Market", icon: Globe },
    { id: "platform", label: currentLang === "fr" ? "Plateforme" : "Platform", icon: Building2 },
  ];

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Filter FAQ items
  const filteredFAQ = faqData.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === null || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-bold">MDR Compliance Platform</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/contact">
              <Button variant="ghost">{t('nav.contact', 'Contact')}</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">{t('nav.home', 'Accueil')}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            {t('faq.title', 'Questions fréquentes')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('faq.subtitle', 'Trouvez des réponses à vos questions sur la conformité MDR, FDA et ISO 13485.')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              type="text"
              placeholder={t('faq.searchPlaceholder', 'Rechercher une question...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
          >
            {t('faq.allCategories', 'Toutes les catégories')}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className="flex items-center gap-2"
            >
              <cat.icon className="h-4 w-4" />
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-center text-slate-600 mb-8">
          {filteredFAQ.length} {t('faq.resultsFound', 'résultat(s) trouvé(s)')}
        </p>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQ.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <button
                className="w-full text-left"
                onClick={() => toggleItem(item.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {categories.find(c => c.id === item.category)?.label}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-medium">
                      {item.question}
                    </CardTitle>
                  </div>
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </CardHeader>
              </button>
              {expandedItems.has(item.id) && (
                <CardContent className="pt-0 pb-4">
                  <p className="text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {item.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {filteredFAQ.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {t('faq.noResults', 'Aucun résultat trouvé. Essayez avec d\'autres termes de recherche.')}
              </p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-8">
              <Clock className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {t('faq.ctaTitle', 'Vous n\'avez pas trouvé votre réponse ?')}
              </h3>
              <p className="text-slate-600 mb-4">
                {t('faq.ctaDescription', 'Notre équipe d\'experts est disponible pour répondre à vos questions spécifiques.')}
              </p>
              <Link href="/contact">
                <Button>
                  {t('faq.ctaButton', 'Contactez-nous')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12 py-8">
        <div className="container text-center text-sm text-slate-600">
          <p>{t('footer.copyright', '© {{year}} N3-Conseil. Tous droits réservés.', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  );
}
