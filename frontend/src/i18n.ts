import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
  pl: {
    translation: {
      // Header
      "header.title": "Analizator Biznesowy AI",
      "header.skipToForm": "Przejdź do formularza",
      
      // URL Section
      "url.title.analyze": "Analizuj Swój",
      "url.title.business": "Biznes",
      "url.description": "Uzyskaj natychmiastowe wglądy biznesowe dzięki AI. Po prostu wprowadź adres URL swojej strony internetowej i pozwól naszym zaawansowanym algorytmom zrobić resztę.",
      "url.placeholder": "Wprowadź swoją stronę internetową (np. example.com, website.pl, mysite.org)",
      "url.button.analyze": "Analizuj stronę",
      "url.button.analyzing": "Analizuję...",
      
      // URL Section - Features
      "features.ai.title": "Analiza oparta na AI",
      "features.ai.description": "Zaawansowane algorytmy analizują zawartość Twojej strony internetowej i model biznesowy",
      "features.instant.title": "Natychmiastowe wyniki",
      "features.instant.description": "Uzyskaj kompleksowe wglądy biznesowe w sekundy, a nie godziny",
      "features.actionable.title": "Praktyczne wglądy",
      "features.actionable.description": "Otrzymaj konkretne rekomendacje, aby ulepszyć swój biznes",
      
      // Loading Section
      "loading.title": "Analizuję Twój Biznes",
      "loading.description": "Nasza AI analizuje Twoją stronę internetową i wyodrębnia kluczowe informacje biznesowe...",
      "loading.steps.structure": "Analizuję strukturę strony internetowej...",
      "loading.steps.content": "Wyodrębniam treść i metadane...",
      "loading.steps.processing": "Przetwarzam z algorytmami AI...",
      "loading.steps.insights": "Generuję wglądy biznesowe...",
      "loading.steps.finalizing": "Finalizuję analizę...",
      "loading.steps.complete": "Analiza zakończona!",
      
      // Business Form
      "form.title": "Profil Biznesowy",
      "form.description": "Przejrzyj i udoskonal informacje o swoim biznesie",
      "form.companyName": "Nazwa firmy",
      "form.companyName.placeholder": "Nazwa Twojej firmy",
      "form.websiteUrl": "Adres URL strony",
      "form.websiteUrl.placeholder": "https://example.com",
      "form.offerDescription": "Opis oferty",
      "form.offerDescription.placeholder": "Opisz, co oferuje Twój biznes...",
      "form.targetCustomer": "Klient docelowy",
      "form.targetCustomer.placeholder": "Opisz swojego idealnego klienta...",
      "form.problemSolved": "Rozwiązywany problem",
      "form.problemSolved.placeholder": "Jakie problemy rozwiązujesz?",
      "form.customerDesires": "Potrzeby klientów",
      "form.customerDesires.placeholder": "Czego naprawdę chcą Twoi klienci?",
      "form.brandTone": "Ton marki",
      "form.brandTone.placeholder": "np. Profesjonalny, Przyjazny, Innowacyjny...",
      "form.communicationLanguage": "Język komunikacji",
      "form.communicationLanguage.placeholder": "np. Polski, Angielski, Hiszpański...",
      "form.button.reanalyze": "Analizuj ponownie stronę",
      "form.button.saveAsDraft": "Zapisz jako szkic",
      "form.button.createProfile": "Utwórz profil biznesowy",
      "form.button.creating": "Tworzę...",
      
      // Languages
      "language.en": "Angielski",
      "language.pl": "Polski",
      "language.es": "Hiszpański",
      "language.fr": "Francuski",
      "language.de": "Niemiecki",
      
      // Notifications
      "notification.success.profileCreated": "Profil biznesowy został pomyślnie utworzony!",
      "notification.error.profileFailed": "Nie udało się utworzyć profilu. Spróbuj ponownie.",
      "notification.error.analysisError": "Analiza nie powiodła się. Spróbuj ponownie.",
      
      // Validation
      "validation.enterUrl": "Wprowadź adres URL strony internetowej",
      "validation.validUrl": "Wprowadź prawidłowy adres URL strony internetowej (np. example.com, website.pl)",
      "validation.urlRequired": "Wprowadź prawidłowy adres URL strony internetowej"
    }
  },
  en: {
    translation: {
      // Header
      "header.title": "AI Business Analyzer",
      "header.skipToForm": "Skip to Manual Form",
      
      // URL Section
      "url.title.analyze": "Analyze Your",
      "url.title.business": "Business",
      "url.description": "Get instant AI-powered insights about your business. Simply enter your website URL and let our advanced algorithms do the rest.",
      "url.placeholder": "Enter your website (e.g., example.com, website.pl, mysite.org)",
      "url.button.analyze": "Analyze Website",
      "url.button.analyzing": "Analyzing...",
      
      // URL Section - Features
      "features.ai.title": "AI-Powered Analysis",
      "features.ai.description": "Advanced algorithms analyze your website content and business model",
      "features.instant.title": "Instant Results",
      "features.instant.description": "Get comprehensive business insights in seconds, not hours",
      "features.actionable.title": "Actionable Insights",
      "features.actionable.description": "Receive specific recommendations to improve your business",
      
      // Loading Section
      "loading.title": "Analyzing Your Business",
      "loading.description": "Our AI is examining your website and extracting key business insights...",
      "loading.steps.structure": "Analyzing website structure...",
      "loading.steps.content": "Extracting content and metadata...",
      "loading.steps.processing": "Processing with AI algorithms...",
      "loading.steps.insights": "Generating business insights...",
      "loading.steps.finalizing": "Finalizing analysis...",
      "loading.steps.complete": "Analysis complete!",
      
      // Business Form
      "form.title": "Business Profile",
      "form.description": "Review and refine your business information",
      "form.companyName": "Company Name",
      "form.companyName.placeholder": "Your company name",
      "form.websiteUrl": "Website URL",
      "form.websiteUrl.placeholder": "https://example.com",
      "form.offerDescription": "Offer Description",
      "form.offerDescription.placeholder": "Describe what your business offers...",
      "form.targetCustomer": "Target Customer",
      "form.targetCustomer.placeholder": "Describe your ideal customer...",
      "form.problemSolved": "Problem Solved",
      "form.problemSolved.placeholder": "What problems do you solve?",
      "form.customerDesires": "Customer Desires",
      "form.customerDesires.placeholder": "What do your customers really want?",
      "form.brandTone": "Brand Tone",
      "form.brandTone.placeholder": "e.g., Professional, Friendly, Innovative...",
      "form.communicationLanguage": "Communication Language",
      "form.communicationLanguage.placeholder": "e.g., English, Polish, Spanish...",
      "form.button.reanalyze": "Re-analyze Website",
      "form.button.saveAsDraft": "Save as Draft",
      "form.button.createProfile": "Create Business Profile",
      "form.button.creating": "Creating...",
      
      // Languages
      "language.en": "English",
      "language.pl": "Polish",
      "language.es": "Spanish",
      "language.fr": "French",
      "language.de": "German",
      
      // Notifications
      "notification.success.profileCreated": "Business profile created successfully!",
      "notification.error.profileFailed": "Failed to create profile. Please try again.",
      "notification.error.analysisError": "Analysis failed. Please try again.",
      
      // Validation
      "validation.enterUrl": "Please enter a website URL",
      "validation.validUrl": "Please enter a valid website URL (e.g., example.com, website.pl)",
      "validation.urlRequired": "Please enter a valid website URL"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pl', // Polish as default
    lng: 'pl', // Default to Polish
    debug: false,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
  });

export default i18n;
