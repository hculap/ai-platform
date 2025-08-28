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
      "header.signIn": "Zaloguj się",
      
      // URL Section
      "url.title.analyze": "Analizuj Swój",
      "url.title.business": "Biznes",
      "url.description": "Uzyskaj natychmiastowe wglądy biznesowe dzięki AI. Po prostu wprowadź adres URL swojej strony internetowej i pozwól naszym zaawansowanym algorytmom zrobić resztę.",
      "url.placeholder": "Wprowadź swoją stronę internetową (np. example.com, website.pl, mysite.org)",
      "url.button.analyze": "Analizuj stronę",
      "url.button.analyzing": "Analizuję...",
      "url.or": "lub",
      "url.skipToForm": "przejdź do formularza",
      
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
      "form.button.continueToSignup": "Przejdź do rejestracji",
      
      // Languages
      "language.en": "Angielski",
      "language.pl": "Polski",
      "language.es": "Hiszpański",
      "language.fr": "Francuski",
      "language.de": "Niemiecki",
      
      // Notifications
      "notification.success.profileCreated": "Profil biznesowy został pomyślnie utworzony!",
      "notification.success.accountCreated": "Konto zostało pomyślnie utworzone! Witamy na pokładzie!",
      "notification.success.signedIn": "Pomyślnie zalogowano! Witamy z powrotem!",
      "notification.error.profileFailed": "Nie udało się utworzyć profilu. Spróbuj ponownie.",
      "notification.error.analysisError": "Analiza nie powiodła się. Spróbuj ponownie.",
      "notification.error.signupFailed": "Rejestracja nie powiodła się. Spróbuj ponownie.",
      "notification.error.signinFailed": "Logowanie nie powiodło się. Spróbuj ponownie.",
      
      // Validation
      "validation.enterUrl": "Wprowadź adres URL strony internetowej",
      "validation.validUrl": "Wprowadź prawidłowy adres URL strony internetowej (np. example.com, website.pl)",
      "validation.urlRequired": "Wprowadź prawidłowy adres URL strony internetowej",
      
      // Signup Form
      "signup.title": "Utwórz Swoje Konto",
      "signup.description": "Dokończ rejestrację, aby rozpocząć",
      "signup.email": "Adres Email",
      "signup.email.placeholder": "Wprowadź swój adres email",
      "signup.password": "Hasło",
      "signup.password.placeholder": "Utwórz silne hasło",
      "signup.confirmPassword": "Potwierdź Hasło",
      "signup.confirmPassword.placeholder": "Potwierdź swoje hasło",
      "signup.button.back": "Powrót do Profilu",
      "signup.button.create": "Utwórz Konto",
      "signup.button.creating": "Tworzę Konto...",
      "signup.validation.emailRequired": "Email jest wymagany",
      "signup.validation.emailInvalid": "Wprowadź prawidłowy adres email",
      "signup.validation.passwordRequired": "Hasło jest wymagane",
      "signup.validation.passwordTooShort": "Hasło musi mieć co najmniej 8 znaków",
      "signup.validation.passwordWeak": "Hasło musi zawierać co najmniej jedną wielką literę, jedną małą literę i jedną cyfrę",
      "signup.validation.confirmPasswordRequired": "Potwierdź swoje hasło",
      "signup.validation.passwordsNotMatch": "Hasła nie są identyczne",
      
      // Sign In Form
      "signin.title": "Zaloguj się",
      "signin.description": "Zaloguj się do swojego konta",
      "signin.email": "Adres Email",
      "signin.email.placeholder": "Wprowadź swój adres email",
      "signin.password": "Hasło",
      "signin.password.placeholder": "Wprowadź swoje hasło",
      "signin.button.back": "Powrót",
      "signin.button.signIn": "Zaloguj się",
      "signin.button.signingIn": "Loguję...",
      "signin.validation.emailRequired": "Email jest wymagany",
      "signin.validation.emailInvalid": "Wprowadź prawidłowy adres email",
      "signin.validation.passwordRequired": "Hasło jest wymagane",
      
      // Dashboard
      "dashboard.welcome": "Witaj na swoim Panelu!",
      "dashboard.welcomeDescription": "Twój profil biznesowy został pomyślnie utworzony. Jesteś gotowy do pracy!",
      "dashboard.stats.businessProfile": "Profil Biznesowy",
      "dashboard.stats.businessProfile.status": "Aktywny i gotowy",
      "dashboard.stats.analytics": "Analityka",
      "dashboard.stats.analytics.status": "Wkrótce dostępne",
      "dashboard.stats.settings": "Ustawienia",
      "dashboard.stats.settings.status": "Personalizuj swoje doświadczenie",
      "dashboard.activity.title": "Ostatnia Aktywność",
      "dashboard.activity.profileReady": "Twój profil biznesowy jest gotowy!",
      "dashboard.activity.description": "Pomyślnie ukończyłeś proces konfiguracji. Twój asystent biznesowy napędzany przez AI jest teraz skonfigurowany i gotowy, aby pomóc Ci rozwijać Twój biznes.",
      "dashboard.logout": "Wyloguj"
    }
  },
  en: {
    translation: {
      // Header
      "header.title": "AI Business Analyzer",
      "header.skipToForm": "Skip to Manual Form",
      "header.signIn": "Sign In",
      
      // URL Section
      "url.title.analyze": "Analyze Your",
      "url.title.business": "Business",
      "url.description": "Get instant AI-powered insights about your business. Simply enter your website URL and let our advanced algorithms do the rest.",
      "url.placeholder": "Enter your website (e.g., example.com, website.pl, mysite.org)",
      "url.button.analyze": "Analyze Website",
      "url.button.analyzing": "Analyzing...",
      "url.or": "or",
      "url.skipToForm": "skip to manual form",
      
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
      "form.button.continueToSignup": "Continue to Signup",
      
      // Languages
      "language.en": "English",
      "language.pl": "Polish",
      "language.es": "Spanish",
      "language.fr": "French",
      "language.de": "German",
      
      // Notifications
      "notification.success.profileCreated": "Business profile created successfully!",
      "notification.success.accountCreated": "Account created successfully! Welcome aboard!",
      "notification.success.signedIn": "Successfully signed in! Welcome back!",
      "notification.error.profileFailed": "Failed to create profile. Please try again.",
      "notification.error.analysisError": "Analysis failed. Please try again.",
      "notification.error.signupFailed": "Signup failed. Please try again.",
      "notification.error.signinFailed": "Sign in failed. Please try again.",
      
      // Validation
      "validation.enterUrl": "Please enter a website URL",
      "validation.validUrl": "Please enter a valid website URL (e.g., example.com, website.pl)",
      "validation.urlRequired": "Please enter a valid website URL",
      
      // Signup Form
      "signup.title": "Create Your Account",
      "signup.description": "Complete your registration to get started",
      "signup.email": "Email Address",
      "signup.email.placeholder": "Enter your email address",
      "signup.password": "Password",
      "signup.password.placeholder": "Create a strong password",
      "signup.confirmPassword": "Confirm Password",
      "signup.confirmPassword.placeholder": "Confirm your password",
      "signup.button.back": "Back to Profile",
      "signup.button.create": "Create Account",
      "signup.button.creating": "Creating Account...",
      "signup.validation.emailRequired": "Email is required",
      "signup.validation.emailInvalid": "Please enter a valid email address",
      "signup.validation.passwordRequired": "Password is required",
      "signup.validation.passwordTooShort": "Password must be at least 8 characters long",
      "signup.validation.passwordWeak": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "signup.validation.confirmPasswordRequired": "Please confirm your password",
      "signup.validation.passwordsNotMatch": "Passwords do not match",
      
      // Sign In Form
      "signin.title": "Sign In",
      "signin.description": "Sign in to your account",
      "signin.email": "Email Address",
      "signin.email.placeholder": "Enter your email address",
      "signin.password": "Password",
      "signin.password.placeholder": "Enter your password",
      "signin.button.back": "Back",
      "signin.button.signIn": "Sign In",
      "signin.button.signingIn": "Signing In...",
      "signin.validation.emailRequired": "Email is required",
      "signin.validation.emailInvalid": "Please enter a valid email address",
      "signin.validation.passwordRequired": "Password is required",
      
      // Dashboard
      "dashboard.welcome": "Welcome to your Dashboard!",
      "dashboard.welcomeDescription": "Your business profile has been created successfully. You're all set to get started!",
      "dashboard.stats.businessProfile": "Business Profile",
      "dashboard.stats.businessProfile.status": "Active and ready",
      "dashboard.stats.analytics": "Analytics",
      "dashboard.stats.analytics.status": "Coming soon",
      "dashboard.stats.settings": "Settings",
      "dashboard.stats.settings.status": "Customize your experience",
      "dashboard.activity.title": "Recent Activity",
      "dashboard.activity.profileReady": "Your business profile is ready!",
      "dashboard.activity.description": "You've successfully completed the setup process. Your AI-powered business assistant is now configured and ready to help you grow your business.",
      "dashboard.logout": "Logout"
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
