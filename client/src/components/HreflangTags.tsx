import { useEffect } from "react";
import { useTranslation } from "react-i18next";

/**
 * Component to dynamically update hreflang tags based on current language
 * This helps search engines understand the language versions of the page
 */
export function HreflangTags() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;
  const baseUrl = "https://mdrcompliance-jqqkzfyu.manus.space";

  useEffect(() => {
    // Update the html lang attribute
    document.documentElement.lang = currentLang === "fr" ? "fr" : "en";

    // Update canonical URL with current language
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      const currentPath = window.location.pathname;
      canonicalLink.setAttribute("href", `${baseUrl}${currentPath}?lang=${currentLang}`);
    }

    // Update hreflang tags dynamically
    const hreflangFr = document.querySelector('link[hreflang="fr"]');
    const hreflangEn = document.querySelector('link[hreflang="en"]');
    const hreflangDefault = document.querySelector('link[hreflang="x-default"]');

    const currentPath = window.location.pathname;
    
    if (hreflangFr) {
      hreflangFr.setAttribute("href", `${baseUrl}${currentPath}?lang=fr`);
    }
    if (hreflangEn) {
      hreflangEn.setAttribute("href", `${baseUrl}${currentPath}?lang=en`);
    }
    if (hreflangDefault) {
      hreflangDefault.setAttribute("href", `${baseUrl}${currentPath}`);
    }

    // Update Open Graph locale
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) {
      ogLocale.setAttribute("content", currentLang === "fr" ? "fr_FR" : "en_US");
    }

  }, [currentLang]);

  return null; // This component doesn't render anything visible
}

export default HreflangTags;
