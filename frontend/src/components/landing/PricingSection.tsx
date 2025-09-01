import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Rocket, Star, ArrowRight, Shield, Clock } from 'lucide-react';

interface PricingSectionProps {
  isVisible: boolean;
  onGetStarted: () => void;
}

const plans = [
  {
    id: 'free',
    name: 'Darmowy Start',
    price: 0,
    originalPrice: null,
    period: 'na zawsze',
    description: 'Idealne do poznania platformy',
    icon: Zap,
    gradient: 'from-gray-500 to-gray-600',
    popular: false,
    features: [
      '1 analiza biznesowa miesięcznie',
      'Podstawowe wglądy AI',
      'Analiza konkurencji (3 firmy)',
      'Rekomendacje rozwoju',
      'Wsparcie email',
      'Dostęp do społeczności'
    ],
    limitations: [
      'Brak zaawansowanych analiz',
      'Ograniczone eksporty danych',
      'Standardowe wsparcie'
    ],
    cta: 'Rozpocznij Za Darmo',
    badge: null
  },
  {
    id: 'pro',
    name: 'Business Pro',
    price: 199,
    originalPrice: 299,
    period: 'miesięcznie',
    description: 'Dla rozwijających się firm',
    icon: Crown,
    gradient: 'from-blue-500 to-purple-600',
    popular: true,
    features: [
      'Nielimitowane analizy biznesowe',
      'Zaawansowane wglądy AI',
      'Pełna analiza konkurencji',
      'Szczegółowe rekomendacje',
      'Monitorowanie trendów',
      'Analiza segmentacji klientów',
      'Eksporty PDF/Excel',
      'Wsparcie priorytetowe',
      'Integracje API',
      'Miesięczne raporty'
    ],
    limitations: [],
    cta: 'Wybierz Business Pro',
    badge: 'Najpopularniejszy'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    originalPrice: 699,
    period: 'miesięcznie',
    description: 'Dla dużych organizacji',
    icon: Rocket,
    gradient: 'from-purple-600 to-pink-600',
    popular: false,
    features: [
      'Wszystko z Business Pro',
      'Dedykowany success manager',
      'Custom integracje',
      'White-label rozwiązania',
      'Zaawansowana analityka',
      'Multi-domain analiza',
      'SLA 99.9%',
      'Wsparcie 24/7',
      'Szkolenia zespołu',
      'Custom raporty',
      'Priority feature requests'
    ],
    limitations: [],
    cta: 'Skontaktuj się z nami',
    badge: 'Enterprise'
  }
];

const guarantees = [
  {
    icon: Shield,
    title: '30-dniowa gwarancja zwrotu pieniędzy',
    description: 'Jeśli nie jesteś zadowolony, zwrócimy 100% wpłaconej kwoty'
  },
  {
    icon: Clock,
    title: 'Anuluj w każdej chwili',
    description: 'Bez zobowiązań długoterminowych. Możesz anulować subskrypcję kiedy chcesz'
  },
  {
    icon: Star,
    title: 'Migracja danych',
    description: 'Bezpłatnie pomożemy przenieść dane z innych platform'
  }
];

const PricingSection: React.FC<PricingSectionProps> = ({ isVisible, onGetStarted }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const getDiscountedPrice = (price: number) => {
    return billingCycle === 'yearly' ? Math.round(price * 0.8) : price;
  };

  const getSavingsText = (price: number) => {
    if (billingCycle === 'yearly') {
      const monthlyCost = price * 12;
      const yearlyCost = price * 0.8 * 12;
      const savings = monthlyCost - yearlyCost;
      return `Oszczędzasz ${savings} PLN rocznie`;
    }
    return null;
  };

  return (
    <section 
      id="pricing" 
      data-section 
      className="py-20 bg-gradient-to-br from-white to-blue-50 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-100/10 to-purple-100/10 rounded-full blur-3xl" />
      </div>

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

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Miesięcznie
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rocznie
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div 
          className={`grid lg:grid-cols-3 gap-8 mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredPlan === plan.id;
            const discountedPrice = getDiscountedPrice(plan.price);
            const savings = getSavingsText(plan.price);

            return (
              <div
                key={plan.id}
                className={`relative group transition-all duration-500 transform ${
                  plan.popular ? 'scale-105 z-10' : 'hover:scale-105'
                } ${isHovered ? 'scale-105 z-20' : ''}`}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                    <div className={`px-6 py-2 bg-gradient-to-r ${plan.gradient} text-white text-sm font-semibold rounded-full shadow-lg`}>
                      {plan.badge}
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`h-full bg-white rounded-3xl p-8 border-2 transition-all duration-500 relative overflow-hidden ${
                  plan.popular || isHovered
                    ? 'border-transparent shadow-2xl'
                    : 'border-gray-200 shadow-lg hover:shadow-xl'
                }`}>
                  
                  {/* Gradient overlay for popular/hovered */}
                  {(plan.popular || isHovered) && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-5`} />
                  )}

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                        plan.popular || isHovered
                          ? `bg-gradient-to-br ${plan.gradient} shadow-lg`
                          : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:' + plan.gradient
                      }`}>
                        <Icon className={`w-8 h-8 transition-colors duration-500 ${
                          plan.popular || isHovered ? 'text-white' : 'text-gray-600 group-hover:text-white'
                        }`} />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 mb-6">{plan.description}</p>

                      {/* Pricing */}
                      <div className="mb-4">
                        <div className="flex items-center justify-center space-x-2">
                          {plan.originalPrice && plan.price > 0 && (
                            <span className="text-2xl text-gray-400 line-through">
                              {billingCycle === 'yearly' ? plan.originalPrice * 0.8 : plan.originalPrice} PLN
                            </span>
                          )}
                          <span className={`text-4xl font-bold ${
                            plan.popular ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {plan.price === 0 ? 'Darmowy' : `${discountedPrice} PLN`}
                          </span>
                        </div>
                        {plan.price > 0 && (
                          <p className="text-gray-500 mt-1">{plan.period}</p>
                        )}
                        {savings && billingCycle === 'yearly' && (
                          <p className="text-green-600 text-sm font-medium mt-2">{savings}</p>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mb-8">
                      <ul className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              plan.popular ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Check className={`w-3 h-3 ${
                                plan.popular ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Limitations for free plan */}
                      {plan.limitations.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-500 mb-3">Ograniczenia:</p>
                          <ul className="space-y-2">
                            {plan.limitations.map((limitation, limIndex) => (
                              <li key={limIndex} className="flex items-start space-x-3">
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                <span className="text-gray-500 text-sm">{limitation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <button
                      onClick={onGetStarted}
                      className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 ${
                        plan.popular
                          ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl focus:ring-blue-500/25`
                          : plan.id === 'enterprise'
                            ? `bg-gradient-to-r ${plan.gradient} text-white shadow-lg hover:shadow-xl focus:ring-purple-500/25`
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500/25'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </button>
                  </div>

                  {/* Glow effect for popular plan */}
                  {(plan.popular || isHovered) && (
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${plan.gradient} opacity-0 blur-xl transition-opacity duration-500 ${
                      isHovered ? 'opacity-20' : plan.popular ? 'opacity-10' : ''
                    }`} style={{ zIndex: -1 }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantees */}
        <div 
          className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-xl">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
              Gwarancje i Zabezpieczenia
            </h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              {guarantees.map((guarantee, index) => {
                const Icon = guarantee.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{guarantee.title}</h4>
                    <p className="text-gray-600 text-sm">{guarantee.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ preview */}
        <div 
          className={`mt-16 text-center transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.8s' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-16 h-16 border border-white rounded-full" />
              <div className="absolute bottom-4 right-4 w-20 h-20 border border-white rounded-full" />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                Masz pytania? Jesteśmy tu, aby pomóc!
              </h3>
              <p className="text-xl text-blue-100 mb-6">
                Skontaktuj się z naszym zespołem, aby dowiedzieć się więcej o planach 
                i znaleźć idealne rozwiązanie dla Twojego biznesu.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Rozpocznij Bezpłatny Okres Próbny
                </button>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                  Porozmawiaj z Ekspertem
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-8 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-60" />
      <div className="absolute bottom-20 right-8 w-3 h-3 bg-purple-400 rounded-full animate-pulse opacity-60" />
      <div className="absolute top-1/2 right-16 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }} />
    </section>
  );
};

export default PricingSection;