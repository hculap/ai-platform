import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, AlertCircle, CheckCircle, Zap, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface ProblemSolutionSectionProps {
  isVisible: boolean;
}

const problems = [
  {
    icon: DollarSign,
    title: 'Agencje marketingowe',
    description: 'Agencja marketingowa kosztuje 5000-15000 zł/miesiąc za podstawowe usługi: strategię, kreacje, kampanie i analizy.',
    color: 'text-red-500'
  },
  {
    icon: Clock,
    title: 'Freelancerzy i specjaliści',
    description: 'Copywriter (150-300 zł/h), specjalista od reklam (200-400 zł/h), analityk (150-250 zł/h). Trudno znaleźć, drogo utrzymać.',
    color: 'text-orange-500'
  },
  {
    icon: AlertCircle,
    title: 'Drogie narzędzia marketingowe',
    description: 'Canva Pro (200 zł/mies), Buffer (300 zł/mies), analityki (500 zł/mies). Każde narzędzie osobno, bez integracji.',
    color: 'text-yellow-500'
  }
];

const solutions = [
  {
    icon: Zap,
    title: '10 narzędzi AI zamiast agencji',
    description: 'Analiza konkurencji, tworzenie kampanii, generowanie kreacji, skrypty do treści - wszystko w jednej platformie za ułamek kosztu agencji.',
    color: 'text-blue-500'
  },
  {
    icon: Target,
    title: 'Płać tylko za to, czego używasz',
    description: 'System kredytowy - 15-50 kredytów za narzędzie. Żadnych miesięcznych abonamentów, żadnych ukrytych kosztów. Transparentne ceny.',
    color: 'text-green-500'
  },
  {
    icon: TrendingUp,
    title: 'Jeden toolkit zastępuje wszystko',
    description: 'Od analizy strony przez konkurencję po kompletne kampanie reklamowe. Wszystko zintegrowane, dostępne 24/7, bez umów długoterminowych.',
    color: 'text-purple-500'
  }
];

const ProblemSolutionSection: React.FC<ProblemSolutionSectionProps> = ({ isVisible }) => {
  const [activeTab, setActiveTab] = useState<'problems' | 'solutions'>('problems');
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setAnimationStep(1);
        setTimeout(() => setAnimationStep(2), 2000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <section 
      id="problem-solution" 
      data-section 
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-gradient-to-r from-red-100 to-orange-100 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 opacity-50" />
        <div className="absolute bottom-0 right-1/2 w-96 h-96 bg-gradient-to-r from-blue-100 to-green-100 rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2 opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section header */}
        <div 
          className={`text-center mb-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Agencje & Narzędzia
            </span>
            <span className="mx-4 text-gray-400">vs</span>
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              AI Business Toolkit
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Przestań płacić agencjom tysiące złotych miesięcznie - zastąp je narzędziami AI za ułamek kosztu
          </p>
        </div>

        {/* Tab Navigation */}
        <div 
          className={`flex justify-center mb-12 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          <div className="bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('problems')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'problems'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Agencje & Narzędzia
            </button>
            <button
              onClick={() => setActiveTab('solutions')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'solutions'
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Business Toolkit
            </button>
          </div>
        </div>

        {/* Split screen content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problems side */}
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible && animationStep >= 0 ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.4s' }}
          >
            <div className={`${activeTab === 'problems' ? 'block' : 'lg:block hidden'}`}>
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 border-2 border-red-200">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <AlertCircle className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Agencje & Narzędzia</h3>
                  <p className="text-gray-600">Drogie, nieelastyczne, długoterminowe umowy</p>
                </div>

                <div className="space-y-6">
                  {problems.map((problem, index) => {
                    const Icon = problem.icon;
                    return (
                      <div 
                        key={index}
                        className={`flex items-start space-x-4 p-4 bg-white/70 rounded-2xl border border-red-200/50 transition-all duration-500 transform ${
                          animationStep >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                        style={{ transitionDelay: `${0.6 + index * 0.2}s` }}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${problem.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                          <Icon className={`w-6 h-6 ${problem.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">{problem.title}</h4>
                          <p className="text-gray-600 text-sm">{problem.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cost indicator */}
                <div className="mt-8 p-4 bg-red-100 rounded-2xl border border-red-200">
                  <div className="text-center">
                    <p className="text-red-700 font-semibold text-lg">Koszt: 5,000-15,000 zł/miesiąc</p>
                    <p className="text-red-600 text-sm">Agencje marketingowe + narzędzia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Solutions side */}
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible && animationStep >= 1 ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.8s' }}
          >
            <div className={`${activeTab === 'solutions' ? 'block' : 'lg:block hidden'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl p-8 border-2 border-blue-200">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Lightbulb className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Business Toolkit</h3>
                  <p className="text-gray-600">10 narzędzi AI, płać za użycie</p>
                </div>

                <div className="space-y-6">
                  {solutions.map((solution, index) => {
                    const Icon = solution.icon;
                    return (
                      <div 
                        key={index}
                        className={`flex items-start space-x-4 p-4 bg-white/70 rounded-2xl border border-blue-200/50 transition-all duration-500 transform ${
                          animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                        }`}
                        style={{ transitionDelay: `${1.0 + index * 0.2}s` }}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${solution.color.replace('text-', 'bg-').replace('-500', '-100')}`}>
                          <Icon className={`w-6 h-6 ${solution.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">{solution.title}</h4>
                          <p className="text-gray-600 text-sm">{solution.description}</p>
                        </div>
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cost indicator */}
                <div className="mt-8 p-4 bg-green-100 rounded-2xl border border-green-200">
                  <div className="text-center">
                    <p className="text-green-700 font-semibold text-lg">Koszt: 15-50 kredytów/narzędzie</p>
                    <p className="text-green-600 text-sm">Płać tylko za to, czego używasz</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom comparison */}
        <div 
          className={`mt-16 text-center transition-all duration-1000 transform ${
            isVisible && animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '1.6s' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-3xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Różnica jest oczywista</h3>
            <p className="text-lg mb-6 opacity-90">
              Przestań płacić agencjom 5,000-15,000 zł miesięcznie.
              Użyj 10 narzędzi AI za ułamek tego kosztu.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Uruchom AI Business Toolkit
            </button>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-red-400 rounded-full animate-pulse opacity-60" />
      <div className="absolute bottom-20 right-10 w-6 h-6 bg-blue-400 rounded-full animate-bounce opacity-60" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-20 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-60" style={{ animationDelay: '2s' }} />
    </section>
  );
};

export default ProblemSolutionSection;