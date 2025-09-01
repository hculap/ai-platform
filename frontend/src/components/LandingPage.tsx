import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSection from './landing/HeroSection';
import SocialProofSection from './landing/SocialProofSection';
import ProblemSolutionSection from './landing/ProblemSolutionSection';
import AIDemoSection from './landing/AIDemoSection';
import FeatureGalaxySection from './landing/FeatureGalaxySection';
import ROICalculatorSection from './landing/ROICalculatorSection';
import PricingSection from './landing/PricingSection';
import FinalCTASection from './landing/FinalCTASection';
import BackgroundElements from './BackgroundElements';

interface LandingPageProps {
  onAnalyze: (url: string) => void;
  onSkipToForm: () => void;
  onSignIn: () => void;
  isAnalyzing: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onAnalyze,
  onSkipToForm,
  onSignIn,
  isAnalyzing
}) => {
  const { t } = useTranslation();
  const [scrollY, setScrollY] = useState(0);
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());

  // Handle scroll for parallax and animations
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer for section animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set(Array.from(prev).concat(entry.target.id)));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <BackgroundElements />
      
      {/* Enhanced Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated gradient orbs */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-20 animate-float-slow"
          style={{
            background: 'radial-gradient(circle, rgba(102,126,234,0.4) 0%, rgba(118,75,162,0.2) 70%, transparent 100%)',
            top: `${Math.sin(scrollY * 0.001) * 50 + 10}%`,
            left: `${Math.cos(scrollY * 0.001) * 30 + 70}%`,
            transform: `scale(${1 + Math.sin(scrollY * 0.002) * 0.1})`,
          }}
        />
        <div 
          className="absolute w-64 h-64 rounded-full opacity-15 animate-float-reverse"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(147,51,234,0.2) 70%, transparent 100%)',
            top: `${Math.cos(scrollY * 0.0008) * 40 + 60}%`,
            left: `${Math.sin(scrollY * 0.0008) * 25 + 10}%`,
            transform: `scale(${0.8 + Math.cos(scrollY * 0.002) * 0.2})`,
          }}
        />
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30 animate-float-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {t('header.title')}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              {t('dashboard.nav.agents')}
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              {t('features.ai.title')}
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Cennik
            </button>
            <button 
              onClick={onSignIn}
              className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {t('header.signIn')}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection
          onAnalyze={onAnalyze}
          onSkipToForm={onSkipToForm}
          isAnalyzing={isAnalyzing}
          isVisible={visibleSections.has('hero')}
          scrollY={scrollY}
        />
        
        <SocialProofSection 
          isVisible={visibleSections.has('social-proof')}
        />
        
        <ProblemSolutionSection 
          isVisible={visibleSections.has('problem-solution')}
        />
        
        <AIDemoSection 
          isVisible={visibleSections.has('ai-demo')}
          onTryDemo={onAnalyze}
        />
        
        <FeatureGalaxySection 
          isVisible={visibleSections.has('feature-galaxy')}
        />
        
        <ROICalculatorSection 
          isVisible={visibleSections.has('roi-calculator')}
        />
        
        <PricingSection 
          isVisible={visibleSections.has('pricing')}
          onGetStarted={() => onSkipToForm()}
        />
        
        <FinalCTASection 
          isVisible={visibleSections.has('final-cta')}
          onAnalyze={onAnalyze}
          onSignUp={() => onSkipToForm()}
        />
      </main>

    </div>
  );
};

export default LandingPage;