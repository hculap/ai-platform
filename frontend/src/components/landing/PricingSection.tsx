import React from 'react';
import { Check, Zap, Crown, Rocket, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  isVisible: boolean;
  onGetStarted: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ isVisible, onGetStarted }) => {
  return (
    <section 
      id="pricing" 
      data-section 
      className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50 py-16 sm:py-20"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Jeden System
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nieskończone Oszczędności
            </span>
          </h2>
          <p className="mx-auto mb-8 max-w-3xl text-base text-gray-600 sm:text-lg md:text-xl">
            Zamiast płacić za dziesiątki narzędzi i zatrudniać specjalistów, masz wszystko w jednej platformie. 
            Oszczędzasz 60-80% kosztów przy 10x lepszych wynikach.
          </p>
        </div>

        {/* Simple pricing cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Free Plan */}
          <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl sm:p-8">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Poznaj Platformę</h3>
              <p className="text-gray-600 mb-6">Testuj wszystkie 4 obszary AI Growth OS</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">Darmowy</div>
              <p className="text-gray-500">14 dni pełna wersja</p>
            </div>

            <ul className="mb-8 space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">Dostęp do wszystkich 4 obszarów</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">Poznaj zespół AI asystentów</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">Podstawowa automatyzacja</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">Wsparcie email</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full rounded-2xl bg-gray-100 px-6 py-4 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-200 sm:text-base"
            >
              Testuj AI Growth OS
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative scale-105 rounded-3xl border-2 border-blue-500 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl sm:p-8">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg">
                Najpopularniejszy
              </div>
            </div>

            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Kompletny AI Growth OS</h3>
              <p className="text-gray-600 mb-6">Zastąp cały dział marketingu jedną platformą</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-gray-400 line-through">299 PLN</span>
                <span className="text-4xl font-bold text-blue-600">199 PLN</span>
              </div>
              <p className="text-gray-500 mt-1">miesięcznie</p>
            </div>

            <ul className="mb-8 space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700"><strong>4 AI Asystenci</strong>: Strategista, Creator, Analityk, Growth Manager</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700"><strong>Nielimitowane treści</strong>: Posty, reklamy, landing pages, emaile</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700"><strong>Pełna automatyzacja</strong>: Publikowanie 24/7, workflow'y, optymalizacja</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700"><strong>Zaawansowana strategia</strong>: Analiza konkurencji, trendy, prognozy</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Integracje z popularnymi narzędziami</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Wsparcie priorytetowe</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg sm:text-base"
            >
              <div className="flex items-center justify-center gap-2">
                <span>Uruchom AI Growth OS</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-3xl border-2 border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl sm:p-8">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise AI OS</h3>
              <p className="text-gray-600 mb-6">Skalowalne rozwiązanie dla korporacji</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl text-gray-400 line-through">699 PLN</span>
                <span className="text-4xl font-bold text-purple-600">499 PLN</span>
              </div>
              <p className="text-gray-500 mt-1">miesięcznie</p>
            </div>

            <ul className="mb-8 space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Wszystko z AI Growth OS +</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700"><strong>Dedykowany AI Manager</strong> - osobisty koordynator zespołu AI</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700"><strong>White-label rozwiązania</strong> dla Twoich klientów</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Custom integracje z systemiami ERP/CRM</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Wsparcie 24/7 + SLA 99.9%</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg sm:text-base"
            >
              <div className="flex items-center justify-center gap-2">
                <span>Skontaktuj się z nami</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white sm:p-8">
            <h3 className="mb-4 text-xl font-bold sm:text-2xl">
              Gwarancja sukcesu lub zwrot pieniędzy
            </h3>
            <p className="mb-6 text-base text-blue-100 sm:text-lg md:text-xl">
              Jeśli AI Growth OS nie zaoszczędzi Ci przynajmniej 20 godzin tygodniowo i nie zwiększy wyników o 50%, 
              zwrócimy 100% wpłaconej kwoty. Bez pytań.
            </p>
            
            <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
              <button 
                onClick={onGetStarted}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-lg sm:px-8 sm:text-base"
              >
                Uruchom AI Growth OS Bezpłatnie
              </button>
              <button className="rounded-2xl border border-white/30 bg-white/20 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/30 sm:px-8 sm:text-base">
                Zobacz Demo Platformy
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
