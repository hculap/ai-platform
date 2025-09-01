import React from 'react';
import { Check, Zap, Crown, Rocket, Star, ArrowRight } from 'lucide-react';

interface PricingSectionProps {
  isVisible: boolean;
  onGetStarted: () => void;
}

const PricingSection: React.FC<PricingSectionProps> = ({ isVisible, onGetStarted }) => {
  return (
    <section 
      id="pricing" 
      data-section 
      className="py-20 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Prosty
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Przejrzysty Cennik
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Wybierz plan dostosowany do wielkości i potrzeb Twojego biznesu. 
            Wszystkie plany zawierają 30-dniowy okres próbny.
          </p>
        </div>

        {/* Simple pricing cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Darmowy Start</h3>
              <p className="text-gray-600 mb-6">Idealne do poznania platformy</p>
              <div className="text-4xl font-bold text-gray-900 mb-2">Darmowy</div>
              <p className="text-gray-500">na zawsze</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">1 analiza miesięcznie</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">Podstawowe wglądy AI</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-gray-600 mt-0.5" />
                <span className="text-gray-700">Wsparcie email</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full py-4 px-6 bg-gray-100 text-gray-900 rounded-2xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Rozpocznij Za Darmo
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-3xl p-8 border-2 border-blue-500 shadow-xl hover:shadow-2xl transition-all duration-300 relative scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg">
                Najpopularniejszy
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Pro</h3>
              <p className="text-gray-600 mb-6">Dla rozwijających się firm</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl text-gray-400 line-through">299 PLN</span>
                <span className="text-4xl font-bold text-blue-600">199 PLN</span>
              </div>
              <p className="text-gray-500 mt-1">miesięcznie</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Nielimitowane analizy</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Zaawansowane wglądy AI</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Pełna analiza konkurencji</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Eksporty PDF/Excel</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700">Wsparcie priorytetowe</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Wybierz Business Pro</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">Dla dużych organizacji</p>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-2xl text-gray-400 line-through">699 PLN</span>
                <span className="text-4xl font-bold text-purple-600">499 PLN</span>
              </div>
              <p className="text-gray-500 mt-1">miesięcznie</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Wszystko z Business Pro</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Dedykowany manager</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Custom integracje</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">Wsparcie 24/7</span>
              </li>
              <li className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-purple-600 mt-0.5" />
                <span className="text-gray-700">SLA 99.9%</span>
              </li>
            </ul>

            <button
              onClick={onGetStarted}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-2">
                <span>Skontaktuj się z nami</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              30-dniowa gwarancja zwrotu pieniędzy
            </h3>
            <p className="text-xl text-blue-100 mb-6">
              Jeśli nie jesteś zadowolony, zwrócimy 100% wpłaconej kwoty. 
              Bez pytań.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Rozpocznij Bezpłatny Okres Próbny
              </button>
              <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                Porozmawiaj z Ekspertem
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;