import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navLinks = [
    { id: 'agents', label: t('dashboard.nav.agents'), sectionId: 'feature-galaxy' },
    { id: 'features', label: t('features.ai.title'), sectionId: 'ai-demo' },
    { id: 'pricing', label: 'Cennik', sectionId: 'pricing' }
  ];

  const handleScrollTo = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileNavOpen(false);
  }, []);

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
      <nav className="relative z-50 px-4 py-4 sm:px-6 bg-white/60 backdrop-blur-xl border-b border-white/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:text-2xl">
              {t('header.title')}
            </span>
          </div>

          <div className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => handleScrollTo(link.sectionId)}
                className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                {link.label}
              </button>
            ))}
            <button
              onClick={onSignIn}
              className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              {t('header.signIn')}
            </button>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-white/40 bg-white/40 p-2 text-gray-600 shadow-sm transition-colors hover:bg-white/70 md:hidden"
            aria-label={isMobileNavOpen ? t('common.close', 'Close navigation') : t('common.menu', 'Open navigation')}
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isMobileNavOpen && (
          <div className="md:hidden">
            <div className="mt-4 rounded-2xl border border-white/40 bg-white/80 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => handleScrollTo(link.sectionId)}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-white hover:text-gray-900"
                  >
                    {link.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    onSignIn();
                  }}
                  className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-blue-700 hover:to-purple-700"
                >
                  {t('header.signIn')}
                </button>
              </div>
            </div>
          </div>
        )}
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
