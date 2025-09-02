import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, Users, Zap, ArrowRight, Target } from 'lucide-react';

interface ROICalculatorSectionProps {
  isVisible: boolean;
}

const ROICalculatorSection: React.FC<ROICalculatorSectionProps> = ({ isVisible }) => {
  const [inputs, setInputs] = useState({
    currentRevenue: 25000,
    currentCosts: 5000,
    teamSize: 2,
    timeSpentHours: 20
  });

  const [results, setResults] = useState({
    monthlySavings: 0,
    annualSavings: 0,
    timeFreed: 0,
    paybackMonths: 0
  });

  const [animatedResults, setAnimatedResults] = useState(results);

  // Calculate ultra-realistic ROI whenever inputs change
  useEffect(() => {
    const { currentRevenue, currentCosts, teamSize, timeSpentHours } = inputs;
    
    const aiPlatformCost = 199; // Monthly cost
    
    // 1. SLIDING HOURLY RATES based on business size (ultra-conservative)
    let hourlyRate;
    if (currentRevenue < 10000) hourlyRate = 60;        // Micro businesses - junior rates
    else if (currentRevenue < 30000) hourlyRate = 80;   // Small businesses  
    else if (currentRevenue < 75000) hourlyRate = 100;  // Medium businesses
    else hourlyRate = 120;                              // Larger businesses
    
    // 2. ULTRA-REALISTIC TIME SAVINGS (much more conservative)
    let timeSavingsPercentage;
    if (currentRevenue < 15000) timeSavingsPercentage = 0.15;  // 15% for micro (learning curve)
    else if (currentRevenue < 50000) timeSavingsPercentage = 0.20; // 20% for small
    else if (currentRevenue < 100000) timeSavingsPercentage = 0.25; // 25% for medium
    else timeSavingsPercentage = 0.30; // 30% for larger
    
    // 3. TIME COST SAVINGS
    const timeFreedHours = timeSpentHours * timeSavingsPercentage;
    const timeCostSavings = timeFreedHours * hourlyRate;
    
    // 4. MINIMAL TOOLS SAVINGS (very conservative)
    let toolsSavings;
    if (currentCosts < 3000) {
      toolsSavings = Math.min(currentCosts * 0.03, 100); // 3%, max 100 PLN
    } else if (currentCosts < 8000) {
      toolsSavings = Math.min(currentCosts * 0.05, 300); // 5%, max 300 PLN
    } else if (currentCosts < 15000) {
      toolsSavings = Math.min(currentCosts * 0.08, 600); // 8%, max 600 PLN
    } else {
      toolsSavings = Math.min(currentCosts * 0.10, 1000); // 10%, max 1000 PLN
    }
    
    // 5. TOTAL CALCULATIONS
    const totalMonthlySavings = timeCostSavings + toolsSavings;
    const netMonthlySavings = Math.max(0, totalMonthlySavings - aiPlatformCost);
    const annualSavings = netMonthlySavings * 12;
    
    // 6. REALISTIC PAYBACK PERIOD
    const paybackMonths = netMonthlySavings > 50 ? 
      Math.max(aiPlatformCost / netMonthlySavings, 1.0) : // Minimum 1 month payback
      12; // If minimal savings, show 12 months

    const newResults = {
      monthlySavings: Math.round(netMonthlySavings),
      annualSavings: Math.round(annualSavings),
      timeFreed: Math.round(timeFreedHours * 10) / 10,
      paybackMonths: Math.round(paybackMonths * 10) / 10
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
      animateValue(animatedResults.monthlySavings, results.monthlySavings, (value) => 
        setAnimatedResults(prev => ({ ...prev, monthlySavings: value }))
      );
      animateValue(animatedResults.annualSavings, results.annualSavings, (value) => 
        setAnimatedResults(prev => ({ ...prev, annualSavings: value }))
      );
      animateValue(animatedResults.timeFreed, results.timeFreed, (value) => 
        setAnimatedResults(prev => ({ ...prev, timeFreed: value }))
      );
      animateValue(animatedResults.paybackMonths * 10, results.paybackMonths * 10, (value) => 
        setAnimatedResults(prev => ({ ...prev, paybackMonths: value / 10 }))
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
                {/* Current Revenue */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Miesięczne przychody firmy (PLN)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="5000"
                      max="200000"
                      step="2500"
                      value={inputs.currentRevenue}
                      onChange={(e) => handleInputChange('currentRevenue', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>5k</span>
                      <span className="font-semibold text-blue-600">
                        {inputs.currentRevenue.toLocaleString()} PLN
                      </span>
                      <span>200k</span>
                    </div>
                  </div>
                </div>

                {/* Current Marketing/Tool Costs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Miesięczne koszty zespołu + narzędzia marketingowe (PLN)
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1000"
                      max="30000"
                      step="500"
                      value={inputs.currentCosts}
                      onChange={(e) => handleInputChange('currentCosts', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-orange-200 to-red-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>1k</span>
                      <span className="font-semibold text-orange-600">
                        {inputs.currentCosts.toLocaleString()} PLN
                      </span>
                      <span>30k</span>
                    </div>
                  </div>
                </div>

                {/* Team size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Wielkość zespołu marketingu/analiz
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={inputs.teamSize}
                      onChange={(e) => handleInputChange('teamSize', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-green-200 to-emerald-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>1</span>
                      <span className="font-semibold text-green-600">
                        {inputs.teamSize} {inputs.teamSize === 1 ? 'osoba' : 'osób'}
                      </span>
                      <span>10</span>
                    </div>
                  </div>
                </div>

                {/* Time spent on content/analysis */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Godziny miesięcznie na tworzenie treści/analiz
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min="5"
                      max="100"
                      step="5"
                      value={inputs.timeSpentHours}
                      onChange={(e) => handleInputChange('timeSpentHours', parseInt(e.target.value))}
                      className="w-full h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded-lg appearance-none slider"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-2">
                      <span>5h</span>
                      <span className="font-semibold text-purple-600">
                        {inputs.timeSpentHours}h
                      </span>
                      <span>100h</span>
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
                  {/* Time freed */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-300" />
                        <span className="text-blue-100">Uwolniony czas miesięcznie</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {animatedResults.timeFreed}h
                    </div>
                    <p className="text-blue-200 text-sm mt-2">
                      Czas, który możesz przeznaczyć na strategię i rozwój
                    </p>
                  </div>

                  {/* Monthly savings */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-5 h-5 text-green-300" />
                        <span className="text-blue-100">Miesięczne oszczędności netto</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {animatedResults.monthlySavings.toLocaleString()} PLN
                    </div>
                    <p className="text-blue-200 text-sm mt-2">
                      Po odjęciu kosztów platformy (199 PLN/mies)
                    </p>
                  </div>

                  {/* Annual savings */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-purple-300" />
                        <span className="text-blue-100">Roczne oszczędności</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">
                      {animatedResults.annualSavings.toLocaleString()} PLN
                    </div>
                    <p className="text-blue-200 text-sm mt-2">
                      Oszczędności które możesz reinwestować
                    </p>
                  </div>

                  {/* Payback period */}
                  <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-yellow-400/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-yellow-300" />
                        <span className="text-yellow-100">Zwrot inwestycji</span>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-yellow-300">
                      {animatedResults.paybackMonths} {animatedResults.paybackMonths === 1 ? 'miesiąc' : animatedResults.paybackMonths < 5 ? 'miesiące' : 'miesięcy'}
                    </div>
                    <p className="text-yellow-200 text-sm mt-2">
                      Czas potrzebny na zwrot kosztów platformy
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-8 text-center">
                  <p className="text-blue-100 mb-4">
                    {results.monthlySavings < 100 ? 
                      "Dla małych firm polecamy nasz plan Starter - skontaktuj się z nami" :
                      "Konserwatywne szacunki oparte na rzeczywistych wynikach klientów"
                    }
                  </p>
                  <button className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                    <span>Przetestuj Bezpłatnie</span>
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
                <div className="text-3xl font-bold text-blue-600 mb-2">1,200 PLN</div>
                <p className="text-gray-600">Średnie miesięczne oszczędności</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">1.2</div>
                <p className="text-gray-600">Miesiące zwrotu inwestycji</p>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600 mb-2">25%</div>
                <p className="text-gray-600">Średnia oszczędność czasu</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};

export default ROICalculatorSection;