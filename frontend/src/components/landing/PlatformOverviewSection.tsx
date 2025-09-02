import React, { useState, useEffect } from 'react';
import { Play, Pause, Brain, Target, Zap, Users, Monitor, BarChart3, MessageSquare, Calendar } from 'lucide-react';

interface PlatformOverviewSectionProps {
  isVisible: boolean;
}

const platformTabs = [
  {
    id: 'strategy',
    title: 'Strategia & Inteligencja',
    icon: Brain,
    color: 'blue',
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    id: 'content',
    title: 'Tworzenie Treści',
    icon: Target,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    id: 'automation',
    title: 'Automatyzacja',
    icon: Zap,
    color: 'orange',
    gradient: 'from-orange-500 to-red-600'
  },
  {
    id: 'assistants',
    title: 'Asystenci AI',
    icon: Users,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600'
  }
];

const demoContent = {
  strategy: {
    title: 'Inteligencja Biznesowa',
    subtitle: 'AI analizuje rynek i konkurencję w czasie rzeczywistym',
    metrics: [
      { label: 'Analiza konkurencji', value: '15 firm', status: 'completed' },
      { label: 'Trendy rynkowe', value: '8 możliwości', status: 'active' },
      { label: 'Prognozy wzrostu', value: '+127%', status: 'pending' }
    ],
    activities: [
      'Monitorowanie 50+ konkurentów',
      'Analiza 1000+ postów tygodniowo',
      'Identyfikacja 3 nowych trendów'
    ]
  },
  content: {
    title: 'AI Creator Studio',
    subtitle: 'Tworzenie wysokiej jakości treści w sekundach',
    metrics: [
      { label: 'Posty dzisiaj', value: '24 utworzone', status: 'completed' },
      { label: 'Kampanie', value: '3 aktywne', status: 'active' },
      { label: 'A/B testy', value: '12 wariantów', status: 'pending' }
    ],
    activities: [
      'Generowanie postów LinkedIn',
      'Tworzenie reklam Facebook',
      'Optymalizacja landing pages'
    ]
  },
  automation: {
    title: 'Centrum Automatyzacji',
    subtitle: 'Workflow\'y działające 24/7 bez Twojej interwencji',
    metrics: [
      { label: 'Publikacje', value: '156 dziś', status: 'completed' },
      { label: 'Kampanie', value: '8 aktywnych', status: 'active' },
      { label: 'Oszczędności', value: '23h/tydzień', status: 'pending' }
    ],
    activities: [
      'Automatyczne publikowanie treści',
      'Optymalizacja budżetów reklamowych',
      'Monitoring performance 24/7'
    ]
  },
  assistants: {
    title: 'Zespół AI Assistants',
    subtitle: 'Twój cyfrowy zespół specjalistów dostępny 24/7',
    metrics: [
      { label: 'Strategista AI', value: 'Aktywny', status: 'completed' },
      { label: 'Creator AI', value: 'Pracuje', status: 'active' },
      { label: 'Analityk AI', value: 'Standby', status: 'pending' }
    ],
    activities: [
      'Strategista planuje kampanie Q4',
      'Creator tworzy serię postów',
      'Analityk przygotowuje raport'
    ]
  }
};

const PlatformOverviewSection: React.FC<PlatformOverviewSectionProps> = ({ isVisible }) => {
  const [activeTab, setActiveTab] = useState('strategy');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMetric, setCurrentMetric] = useState(0);

  // Auto-cycle through tabs when playing
  useEffect(() => {
    if (isPlaying && isVisible) {
      const interval = setInterval(() => {
        setActiveTab(prev => {
          const currentIndex = platformTabs.findIndex(tab => tab.id === prev);
          const nextIndex = (currentIndex + 1) % platformTabs.length;
          return platformTabs[nextIndex].id;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isVisible]);

  // Animate metrics
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setCurrentMetric(prev => (prev + 1) % 3);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const currentContent = demoContent[activeTab as keyof typeof demoContent];
  const currentTab = platformTabs.find(tab => tab.id === activeTab);

  return (
    <section 
      id="platform-overview" 
      data-section 
      className="py-20 bg-gradient-to-br from-gray-50 to-slate-100 relative overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-r from-green-200/20 to-blue-200/20 rounded-full blur-3xl" />
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
              Zobacz Platformę
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              w Akcji
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Interaktywny podgląd AI Growth OS. Zobacz jak 4 obszary współpracują ze sobą, 
            tworząc kompletny ekosystem wzrostu.
          </p>

          {/* Demo controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 ${
                isPlaying 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isPlaying ? 'Zatrzymaj Demo' : 'Uruchom Demo'}</span>
            </button>
            <div className="text-sm text-gray-500">
              Auto-przełącza między obszarami co 3 sekundy
            </div>
          </div>
        </div>

        {/* Platform Interface Demo */}
        <div 
          className={`bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
          style={{ transitionDelay: '0.3s' }}
        >
          {/* Platform Header */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Monitor className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">AI Growth OS</h3>
                  <p className="text-slate-300 text-sm">Twoja platforma wzrostu</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400">Wszystkie systemy aktywne</span>
              </div>
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="bg-slate-100 px-8 py-4 border-b">
            <div className="flex space-x-1">
              {platformTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg transform scale-105` 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:block">{tab.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Content */}
          <div className="p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {currentContent.title}
                  </h3>
                  <p className="text-gray-600">
                    {currentContent.subtitle}
                  </p>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  {currentContent.metrics.map((metric, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-2xl border-2 transition-all duration-500 ${
                        index === currentMetric 
                          ? `border-${currentTab?.color}-500 bg-${currentTab?.color}-50 transform scale-105` 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${
                          metric.status === 'completed' ? 'bg-green-500' :
                          metric.status === 'active' ? 'bg-blue-500 animate-pulse' :
                          'bg-yellow-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-700">
                          {metric.label}
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Activity Feed */}
                <div className="bg-gray-50 rounded-2xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-gray-600" />
                    <h4 className="font-semibold text-gray-900">Aktywność na żywo</h4>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-3">
                    {currentContent.activities.map((activity, index) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-3 p-3 bg-white rounded-lg transition-all duration-300 ${
                          index === 0 ? 'border-2 border-blue-200 bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm text-gray-700">{activity}</span>
                        {index === 0 && (
                          <div className="ml-auto">
                            <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                              Aktywne
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Assistant Chat */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI Asystent</h4>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-gray-600">Online</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-700">
                        Przygotowałem analizę konkurencji dla Q4. 
                        Znalazłem 3 nowe możliwości wzrostu.
                      </p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <p className="text-gray-700">
                        Czy chcesz, żebym rozpoczął tworzenie 
                        kampanii na te obszary?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Szybkie akcje</span>
                  </h4>
                  <div className="space-y-2">
                    {[
                      'Uruchom nową kampanię',
                      'Przeanalizuj konkurencję',
                      'Wygeneruj treści',
                      'Sprawdź wyniki'
                    ].map((action, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div 
          className={`text-center mt-16 transition-all duration-1000 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
          style={{ transitionDelay: '0.6s' }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              To dopiero początek możliwości
            </h3>
            <p className="text-xl text-blue-100 mb-6">
              Zobacz jak AI Growth OS może transformować Twój biznes. 
              Rozpocznij darmowy okres próbny już dziś.
            </p>
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-2xl hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Wypróbuj Platformę Bezpłatnie
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformOverviewSection;