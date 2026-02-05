import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  Loader2,
  Building2,
  Globe
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Contact() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: ""
  });
  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success(t('contact.successMessage', 'Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.'));
      setFormData({ name: "", email: "", company: "", subject: "", message: "" });
    },
    onError: (error) => {
      toast.error(t('contact.errorMessage', 'Erreur lors de l\'envoi du message. Veuillez réessayer.'));
      console.error("Contact form error:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject) {
      toast.error(t('contact.selectSubjectError', 'Veuillez sélectionner un sujet.'));
      return;
    }
    
    // Map "technical" to "support" for backend compatibility
    const subjectMap: Record<string, "demo" | "support" | "partnership" | "pricing" | "other"> = {
      demo: "demo",
      pricing: "pricing",
      technical: "support",
      partnership: "partnership",
      other: "other",
    };
    
    submitMutation.mutate({
      name: formData.name,
      email: formData.email,
      company: formData.company || undefined,
      subject: subjectMap[formData.subject] || "other",
      message: formData.message,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Contact info based on language/region
  const contactInfo = {
    fr: {
      address: "Paris, France",
      phone: "+33 7 51 46 66 84",
      email: "infos@n3-conseil.com",
      hours: "Lun-Ven: 9h00 - 18h00 (CET)"
    },
    en: {
      address: "Paris, France (EU HQ)",
      phone: "+33 7 51 46 66 84",
      email: "infos@n3-conseil.com",
      hours: "Mon-Fri: 9:00 AM - 6:00 PM (CET)"
    }
  };

  const info = currentLang === "fr" ? contactInfo.fr : contactInfo.en;

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
            <Link href="/pricing">
              <Button variant="ghost">{t('common.pricing', 'Tarifs')}</Button>
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
            {t('contact.title', 'Contactez-nous')}
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('contact.subtitle', 'Notre équipe d\'experts en réglementation des dispositifs médicaux est à votre disposition pour répondre à vos questions.')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.formTitle', 'Envoyez-nous un message')}</CardTitle>
                <CardDescription>
                  {t('contact.formDescription', 'Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais.')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('contact.name', 'Nom complet')} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder={t('contact.namePlaceholder', 'Jean Dupont')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('contact.email', 'Email')} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder={t('contact.emailPlaceholder', 'jean.dupont@entreprise.com')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">{t('contact.company', 'Entreprise')}</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                        placeholder={t('contact.companyPlaceholder', 'Nom de votre entreprise')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">{t('contact.subject', 'Sujet')} *</Label>
                      <Select
                        value={formData.subject}
                        onValueChange={(value) => handleChange("subject", value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('contact.selectSubject', 'Sélectionnez un sujet')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demo">{t('contact.subjects.demo', 'Demande de démonstration')}</SelectItem>
                          <SelectItem value="pricing">{t('contact.subjects.pricing', 'Questions sur les tarifs')}</SelectItem>
                          <SelectItem value="technical">{t('contact.subjects.technical', 'Support technique')}</SelectItem>
                          <SelectItem value="partnership">{t('contact.subjects.partnership', 'Partenariat')}</SelectItem>
                          <SelectItem value="other">{t('contact.subjects.other', 'Autre')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">{t('contact.message', 'Message')} *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleChange("message", e.target.value)}
                      placeholder={t('contact.messagePlaceholder', 'Décrivez votre demande en détail...')}
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('contact.sending', 'Envoi en cours...')}
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        {t('contact.send', 'Envoyer le message')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            {/* Contact Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {t('contact.infoTitle', 'Nos coordonnées')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.address', 'Adresse')}</p>
                    <p className="text-sm text-slate-600">{info.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.emailLabel', 'Email')}</p>
                    <a href={`mailto:${info.email}`} className="text-sm text-primary hover:underline">
                      {info.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.phone', 'Téléphone')}</p>
                    <p className="text-sm text-slate-600">{info.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{t('contact.hours', 'Horaires')}</p>
                    <p className="text-sm text-slate-600">{info.hours}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Offices Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t('contact.regionsTitle', 'Présence internationale')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="font-medium text-blue-900">🇪🇺 {t('contact.regions.eu', 'Union Européenne')}</p>
                  <p className="text-sm text-blue-700">
                    {t('contact.regions.euDesc', 'Siège social - Expertise MDR, IVDR, ISO 13485')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">🇺🇸 {t('contact.regions.us', 'États-Unis')}</p>
                  <p className="text-sm text-slate-600">
                    {t('contact.regions.usDesc', 'Support FDA - QMSR, 510(k), De Novo, PMA')}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-medium text-slate-900">🇨🇦 {t('contact.regions.ca', 'Canada')}</p>
                  <p className="text-sm text-slate-600">
                    {t('contact.regions.caDesc', 'Support Health Canada - MDEL, MDSAP')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.quickLinks', 'Liens rapides')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/pricing">
                  <Button variant="outline" className="w-full justify-start">
                    {t('contact.viewPricing', 'Voir les tarifs')}
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full justify-start">
                    {t('contact.startDemo', 'Commencer la démo gratuite')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
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
