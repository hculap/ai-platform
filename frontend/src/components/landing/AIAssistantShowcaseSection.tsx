import React, { useState, useEffect } from 'react';
import { Brain, Target, BarChart3, TrendingUp, MessageCircle, Clock, Zap, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

interface AIAssistantShowcaseSectionProps {
  isVisible: boolean;
}

const assistants = [
  {
    id: 'strategist',
    name: 'Alex - AI Strategista',
    role: 'Strategia biznesowa i analiza rynku',
    avatar: 'from-blue-500 to-purple-600',
    icon: Brain,
    personality: 'Analityczny, przede wszystkim oparty na danych',
    specialties: ['Analiza konkurencji', 'Trendy rynkowe', 'Planowanie strategii', 'Prognozowanie wzrostu'],
    status: 'Analizuje trendy Q4 2024',
    conversation: [
      { type: 'assistant', message: 'Przeanalizowałem konkurencję w Twojej branży. Znalazłem 3 nowe możliwości wzrostu.' },
      { type: 'user', message: 'Jakie to możliwości?' },
      { type: 'assistant', message: 'Pierwsza: Twoi konkurenci ignorują segment młodych profesjonalistów. Druga: Nikt nie wykorzystuje TikTok w Twojej niszy. Trzecia: Możliwość wejścia na rynek niemiecki.' },
      { type: 'user', message: 'Opracuj strategię dla TikTok' },
      { type: 'assistant', message: 'Już pracuję nad 30-dniowym planem wejścia na TikTok. Będzie gotowy za 15 minut.' }
    ],
    metrics: { completed: 47, active: 3, pending: 12 }
  },
  {
    id: 'creator',
    name: 'Maya - AI Creator',
    role: 'Tworzenie treści i kierowanie kreatywne',
    avatar: 'from-green-500 to-emerald-600',
    icon: Target,
    personality: 'Kreatywna, zorientowana na trendy',
    specialties: ['Posty na social media', 'Kampanie reklamowe', 'Landing pages', 'Email marketing'],
    status: 'Tworzy serię 20 postów LinkedIn',
    conversation: [
      { type: 'assistant', message: 'Stworzyłam 5 wariantów nowej kampanii reklamowej. Każdy ma inne podejście emocjonalne.' },
      { type: 'user', message: 'Pokaż mi najlepszy wariant' },
      { type: 'assistant', message: 'Wariant #3 testuje "strach przed utratą szansy". Headline: "Ostatnie 48h na 50% zniżkę". Prognozuję 23% wyższy CTR.' },
      { type: 'user', message: 'Uruchom ten wariant' },
      { type: 'assistant', message: 'Kampania wystartuje za 10 minut. Budżet: 500zł/dzień. Monitoring w czasie rzeczywistym włączony.' }
    ],
    metrics: { completed: 156, active: 8, pending: 4 }
  },
  {
    id: 'analyst',
    name: 'Viktor - AI Analityk',
    role: 'Analiza danych i optymalizacja performance',
    avatar: 'from-purple-500 to-pink-600',
    icon: BarChart3,
    personality: 'Precyzyjny, skoncentrowany na wynikach',
    specialties: ['Analiza ROI', 'Optymalizacja kampanii', 'Raportowanie', 'A/B testing'],
    status: 'Monitoruje 12 aktywnych kampanii',
    conversation: [
      { type: 'assistant', message: 'Kampania LinkedIn z wczoraj osiągnęła 156% założonego ROI. Sugeruję zwiększenie budżetu o 40%.' },
      { type: 'user', message: 'Co spowodowało tak dobry wynik?' },
      { type: 'assistant', message: 'Kombinacja 3 czynników: targeting na "decision makers", godziny wysyłki 9-11, i CTA "Sprawdź w 2 minuty".' },
      { type: 'user', message: 'Powiel to we wszystkich kampaniach' },
      { type: 'assistant', message: 'Optymalizuję pozostałe kampanie według tego wzorca. Spodziewany wzrost ROI: +67%.' }
    ],
    metrics: { completed: 89, active: 12, pending: 2 }
  },
  {
    id: 'growth',
    name: 'Sophia - AI Growth Manager',
    role: 'Koordynacja wzrostu i strategia całościowa',
    avatar: 'from-orange-500 to-red-600',
    icon: TrendingUp,
    personality: 'Holistyczna, koordynuje wszystkie działania',
    specialties: ['Growth hacking', 'Koordynacja zespołu AI', 'Strategia wzrostu', 'Optymalizacja funnel'],
    status: 'Koordynuje kampanię Q4',
    conversation: [
      { type: 'assistant', message: 'Zespół AI osiągnął 127% celu miesięcznego. Alex znalazł nowe możliwości, Maya stworzyła content, Viktor zoptymalizował kampanie.' },
      { type: 'user', message: 'Jaki jest plan na kolejny miesiąc?' },
      { type: 'assistant', message: 'Fokus na 3 obszary: 1) Ekspansja TikTok (strategia Alexa), 2) Nowe landing pages (Maya), 3) Optymalizacja kolejnych kampanii (Viktor).' },
      { type: 'user', message: 'Ustawcie cele na grudzień' },
      { type: 'assistant', message: 'Cele grudniowe: +45% ruchu, +67% konwersji, +23% ROI. Każdy asystent ma przypisane zadania. Start jutro o 9:00.' }
    ],
    metrics: { completed: 78, active: 15, pending: 7 }
  }
];

const AIAssistantShowcaseSection: React.FC<AIAssistantShowcaseSectionProps> = ({ isVisible }) => {
  const [activeAssistant, setActiveAssistant] = useState('strategist');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const currentAssistant = assistants.find(a => a.id === activeAssistant) || assistants[0];

  // Auto-cycle through assistants
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setActiveAssistant(prev => {
          const currentIndex = assistants.findIndex(a => a.id === prev);
          const nextIndex = (currentIndex + 1) % assistants.length;
          return assistants[nextIndex].id;
        });
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  // Animate conversation messages
  useEffect(() => {
    if (isVisible && currentAssistant) {
      setMessageIndex(0);
      const interval = setInterval(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessageIndex(prev => {
            const nextIndex = prev + 1;
            setIsTyping(false);
            return nextIndex >= currentAssistant.conversation.length ? 0 : nextIndex;
          });
        }, 1500);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeAssistant, isVisible, currentAssistant]);

  return (
    <section 
      id="ai-assistants" 
      data-section 
      className="py-20 bg-white relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-r from-blue-100/40 to-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-r from-green-100/40 to-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-100/20 to-pink-100/20 rounded-full blur-3xl" />
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
              Poznaj Swój
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zespół AI
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            4 specjalistycznych asystentów AI, którzy pracują dla Ciebie 24/7. 
            Każdy ma unikalną osobowość, specjalizację i styl pracy.
          </p>

          {/* Team stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">24/7</div>
              <div className="text-gray-600 text-sm">Dostępność</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">370+</div>
              <div className="text-gray-600 text-sm">Zadania dziennie</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-gray-600 text-sm">Dni urlopu</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">∞</div>
              <div className="text-gray-600 text-sm">Cierpliwości</div>
            </div>
          </div>
        </div>

        {/* Assistant selector */}
        <div 
          className={`flex flex-wrap justify-center gap-4 mb-12 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          {assistants.map((assistant) => {
            const Icon = assistant.icon;
            const isActive = activeAssistant === assistant.id;
            
            return (
              <button
                key={assistant.id}
                onClick={() => setActiveAssistant(assistant.id)}
                className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-medium transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${assistant.avatar} text-white shadow-lg transform scale-105` 
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-white/20' : `bg-gradient-to-br ${assistant.avatar}`
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white'}`} />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{assistant.name.split(' - ')[1]}</div>
                  <div className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                    {assistant.name.split(' - ')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Assistant showcase */}
        <div 
          className={`transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
          style={{ transitionDelay: '0.4s' }}
        >
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Assistant Profile */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-start space-x-6 mb-8">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-br ${currentAssistant.avatar} shadow-lg`}>
                  <currentAssistant.icon className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentAssistant.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{currentAssistant.role}</p>
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-gray-600">{currentAssistant.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 italic">"{currentAssistant.personality}"</p>
                </div>
              </div>

              {/* Specialties */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">Specjalizacje:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {currentAssistant.specialties.map((specialty, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{specialty}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-2xl border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{currentAssistant.metrics.completed}</div>
                  <div className="text-xs text-gray-600">Ukończone</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{currentAssistant.metrics.active}</div>
                  <div className="text-xs text-gray-600">Aktywne</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{currentAssistant.metrics.pending}</div>
                  <div className="text-xs text-gray-600">W kolejce</div>
                </div>
              </div>
            </div>

            {/* Live Conversation */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-gray-600" />
                  <h4 className="text-xl font-bold text-gray-900">Rozmowa na żywo</h4>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>

              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {currentAssistant.conversation.slice(0, messageIndex + 1).map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-sm p-4 rounded-2xl ${
                        msg.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-800 shadow-md'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl shadow-md">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 p-4 bg-white rounded-2xl">
                <input
                  type="text"
                  placeholder="Napisz wiadomość..."
                  className="flex-1 p-2 text-sm bg-transparent outline-none"
                  disabled
                />
                <button className="p-2 bg-blue-500 text-white rounded-xl">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div 
          className={`text-center mt-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.8s' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <Sparkles className="absolute top-4 left-4 w-6 h-6" />
              <Sparkles className="absolute top-8 right-8 w-4 h-4" />
              <Sparkles className="absolute bottom-6 left-8 w-5 h-5" />
              <Sparkles className="absolute bottom-4 right-4 w-6 h-6" />
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold mb-4">
                Twój zespół AI czeka na Ciebie
              </h3>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Zamiast zatrudniać 4 specjalistów za 25,000 zł miesięcznie, 
                masz kompletny zespół AI za ułamek tej ceny.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Poznaj Swój Zespół AI
                </button>
                <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                  Zobacz Więcej Konwersacji
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIAssistantShowcaseSection;