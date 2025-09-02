import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, AlertCircle, CheckCircle, Zap, TrendingUp, Target, Lightbulb } from 'lucide-react';

interface ProblemSolutionSectionProps {
  isVisible: boolean;
}

const problems = [
  {
    icon: DollarSign,
    title: 'Kosztowny dział marketingu',
    description: 'Strategista (8000 zł), Copywriter (6000 zł), Grafik (5000 zł), Social Media Manager (4500 zł). Łączny koszt: 23,500+ zł miesięcznie.',
    color: 'text-red-500'
  },
  {
    icon: Clock,
    title: 'Zewnętrzni freelancerzy i agencje',
    description: 'Płacisz 150-300 zł/h za specjalistów. Agencja marketingowa kosztuje 5000-15000 zł/miesiąc za podstawowe usługi.',
    color: 'text-orange-500'
  },
  {
    icon: AlertCircle,
    title: 'Drogie narzędzia + brak integracji',
    description: 'HubSpot (2000zł), Canva Pro (200zł), Buffer (300zł), Analytics (500zł). Razem 3000+ zł/mies + brak synchronizacji.',
    color: 'text-yellow-500'
  }
];

const solutions = [
  {
    icon: Zap,
    title: 'Cały zespół AI w jednej platformie',
    description: 'Alex (Strategista AI), Maya (Creator AI), Viktor (Analityk AI), Sophia (Growth Manager AI) - zastępują cały dział marketingu za ułamek kosztu.',
    color: 'text-blue-500'
  },
  {
    icon: Target,
    title: 'Koniec z agencjami i freelancerami',
    description: 'Żadnych godzinowych stawek, opóźnień, jakościowych problemów. AI pracuje 24/7 z konsystentną jakością i natychmiastową realizacją.',
    color: 'text-green-500'
  },
  {
    icon: TrendingUp,
    title: 'Wszystkie narzędzia + AI w jednej cenie',
    description: 'Marketing automation, design, copywriting, analytics, social media - wszystko zintegrowane i zarządzane przez AI za 199zł/mies.',
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
              Drogie Zespoły & Narzędzia
            </span>
            <span className="mx-4 text-gray-400">vs</span>
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Jeden AI Growth OS
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Przestań płacić za dział marketingu, zewnętrznych specjalistów i drogie narzędzia - zastąp ich jedną platformą AI
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
              Drogie Zespoły & Narzędzia
            </button>
            <button
              onClick={() => setActiveTab('solutions')}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'solutions'
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Growth OS
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Drogie Zespoły & Narzędzia</h3>
                  <p className="text-gray-600">Kosztowne, nieefektywne, skomplikowane</p>
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
                    <p className="text-red-700 font-semibold text-lg">Koszt: 25,000+ zł/miesiąc</p>
                    <p className="text-red-600 text-sm">Zespół + agencje + narzędzia</p>
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Growth OS</h3>
                  <p className="text-gray-600">Jedna platforma, nieskończone możliwości</p>
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
                    <p className="text-green-700 font-semibold text-lg">Koszt: Od 199 zł/miesiąc</p>
                    <p className="text-green-600 text-sm">Zastępuje cały zespół + wszystkie narzędzia</p>
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
              Przestań płacić 25,000+ zł miesięcznie za zespoły, agencje i narzędzia. 
              Zastąp ich jedną platformą AI za 199 zł/miesiąc.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Uruchom AI Growth OS
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