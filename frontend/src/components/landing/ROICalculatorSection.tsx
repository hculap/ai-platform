import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, Users, Zap, ArrowRight, Target } from 'lucide-react';

interface ROICalculatorSectionProps {
  isVisible: boolean;
}

const ROICalculatorSection: React.FC<ROICalculatorSectionProps> = ({ isVisible }) => {
  const [inputs, setInputs] = useState({
    monthlyRevenue: 50000,
    timeSpentOnAnalysis: 20,
    consultingCosts: 5000,
    teamSize: 5,
    growthGoal: 25
  });

  const [results, setResults] = useState({
    timeSavings: 0,
    costSavings: 0,
    revenueIncrease: 0,
    totalROI: 0,
    paybackPeriod: 0
  });

  const [animatedResults, setAnimatedResults] = useState(results);

  // Calculate ROI whenever inputs change
  useEffect(() => {
    const { monthlyRevenue, timeSpentOnAnalysis, consultingCosts, teamSize, growthGoal } = inputs;
    
    // Calculate savings and improvements
    const hourlyRate = 100; // Average hourly rate for business analysis
    const timeSavings = timeSpentOnAnalysis * hourlyRate * teamSize * 12; // Annual time savings
    const costSavings = consultingCosts * 4; // Quarterly consulting savings annually
    const revenueIncrease = monthlyRevenue * 12 * (growthGoal / 100); // Annual revenue increase
    const totalBenefit = timeSavings + costSavings + revenueIncrease;
    const aiPlatformCost = 2400; // Annual cost of AI platform
    const totalROI = ((totalBenefit - aiPlatformCost) / aiPlatformCost) * 100;
    const paybackPeriod = aiPlatformCost / (totalBenefit / 12);

    const newResults = {
      timeSavings: Math.round(timeSavings),
      costSavings: Math.round(costSavings),
      revenueIncrease: Math.round(revenueIncrease),
      totalROI: Math.round(totalROI),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10
    };

    setResults(newResults);
  }, [inputs]);

  // Animate results when they change
  useEffect(() => {
    if (isVisible) {
      const animateValue = (start: number, end: number, setter: (value: number) => void) => {
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
          const progress = Math.min((Date.now() - startTime) / duration, 1);
          const current = start + (end - start) * progress;
          setter(Math.round(current));
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        animate();
      };

      // Animate each result
      animateValue(animatedResults.timeSavings, results.timeSavings, (value) => 
        setAnimatedResults(prev => ({ ...prev, timeSavings: value }))
      );
      animateValue(animatedResults.costSavings, results.costSavings, (value) => 
        setAnimatedResults(prev => ({ ...prev, costSavings: value }))
      );
      animateValue(animatedResults.revenueIncrease, results.revenueIncrease, (value) => 
        setAnimatedResults(prev => ({ ...prev, revenueIncrease: value }))
      );
      animateValue(animatedResults.totalROI, results.totalROI, (value) => 
        setAnimatedResults(prev => ({ ...prev, totalROI: value }))
      );
      animateValue(animatedResults.paybackPeriod * 10, results.paybackPeriod * 10, (value) => 
        setAnimatedResults(prev => ({ ...prev, paybackPeriod: value / 10 }))
      );
    }
  }, [results, isVisible]);

  const handleInputChange = (key: keyof typeof inputs, value: number) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <section 
      id="roi-calculator" 
      data-section 
      className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-full blur-3xl" />
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
              Kalkulator
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zwrotu z Inwestycji
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Sprawdź dokładnie, ile możesz zaoszczędzić i zarobić dzięki naszej platformie AI. 
            Dostosuj parametry do swojego biznesu.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Calculator inputs */}
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.2s' }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/50 shadow-xl">
              <div className="flex items-center space-x-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Dane Twojego Biznesu</h3>
              </div>

              <div className="space-y-8">
                {/* Monthly Revenue */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Miesięczne przychody (PLN)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="10000"
                      max="500000"
                      step="5000"
                      value={inputs.monthlyRevenue}
                      onChange={(e) => handleInputChange('monthlyRevenue', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>10k</span>
                      <span className="font-semibold text-blue-600">
                        {inputs.monthlyRevenue.toLocaleString()} PLN
                      </span>
                      <span>500k</span>
                    </div>
                  </div>
                </div>

                {/* Time spent on analysis */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Godziny miesięcznie na analizy biznesowe
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="5"
                      max="80"
                      step="5"
                      value={inputs.timeSpentOnAnalysis}
                      onChange={(e) => handleInputChange('timeSpentOnAnalysis', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>5h</span>
                      <span className="font-semibold text-orange-600">
                        {inputs.timeSpentOnAnalysis}h
                      </span>
                      <span>80h</span>
                    </div>
                  </div>
                </div>

                {/* Consulting costs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Kwartalny budżet na konsultacje zewnętrzne (PLN)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="0"
                      max="25000"
                      step="1000"
                      value={inputs.consultingCosts}
                      onChange={(e) => handleInputChange('consultingCosts', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>0</span>
                      <span className="font-semibold text-green-600">
                        {inputs.consultingCosts.toLocaleString()} PLN
                      </span>
                      <span>25k</span>
                    </div>
                  </div>
                </div>

                {/* Team size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Wielkość zespołu zaangażowanego w analizy
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={inputs.teamSize}
                      onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>1</span>
                      <span className="font-semibold text-purple-600">
                        {inputs.teamSize} {inputs.teamSize === 1 ? 'osoba' : 'osób'}
                      </span>
                      <span>20</span>
                    </div>
                  </div>
                </div>

                {/* Growth goal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Cel wzrostu rocznego (%)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={inputs.growthGoal}
                      onChange={(e) => handleInputChange('growthGoal', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>5%</span>
                      <span className="font-semibold text-yellow-600">
                        {inputs.growthGoal}%
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div 
            className={`transition-all duration-1000 transform ${
              isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '0.4s' }}
          >
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-white relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 border border-white rounded-full" />
                <div className="absolute bottom-8 right-8 w-16 h-16 border border-white rounded-full" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full opacity-50" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Twój Przewidywany ROI</h3>
                </div>

                <div className="space-y-6">
                  {/* Time savings */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-300" />
                        <span className="text-blue-100">Oszczędność czasu rocznie</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {animatedResults.timeSavings.toLocaleString()} PLN
                    </div>
                  </div>

                  {/* Cost savings */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-300" />
                        <span className="text-blue-100">Oszczędność kosztów rocznie</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {animatedResults.costSavings.toLocaleString()} PLN
                    </div>
                  </div>

                  {/* Revenue increase */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-purple-300" />
                        <span className="text-blue-100">Potencjalny wzrost przychodów</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {animatedResults.revenueIncrease.toLocaleString()} PLN
                    </div>
                  </div>

                  {/* Total ROI */}
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <span className="text-yellow-100">Całkowity ROI</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-300">
                      {animatedResults.totalROI > 0 ? '+' : ''}{animatedResults.totalROI}%
                    </div>
                    <p className="text-yellow-200 text-sm mt-2">
                      Zwrot inwestycji w {animatedResults.paybackPeriod} miesiąc
                      {animatedResults.paybackPeriod !== 1 ? 'y' : ''}
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 text-center">
                  <p className="text-blue-100 mb-4">
                    To tylko szacunkowe korzyści. Rzeczywiste wyniki mogą być jeszcze lepsze!
                  </p>
                  <button className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    <span>Rozpocznij i Zobacz Sam</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom insight */}
        <div 
          className={`mt-16 text-center transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 border border-white/50 max-w-4xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Users className="w-8 h-8 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Średnie wyniki naszych klientów</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-blue-600 mb-2">250%</div>
                <p className="text-gray-600">Średni ROI</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">2.1</div>
                <p className="text-gray-600">Miesiące zwrotu</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">85%</div>
                <p className="text-gray-600">Redukcja czasu analiz</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default ROICalculatorSection;