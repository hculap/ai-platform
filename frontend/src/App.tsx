import React, { useState, useEffect } from 'react';
import { AppSection, LoadingState, BusinessProfile } from './types';
import { analyzeWebsite } from './services/api';

// Components
import BackgroundElements from './components/BackgroundElements';
import Header from './components/Header';
import URLSection from './components/URLSection';
import LoadingSection from './components/LoadingSection';
import BusinessForm from './components/BusinessForm';

function App() {
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.URL_INPUT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<BusinessProfile | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    text: 'Initializing analysis...'
  });

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setCurrentSection(AppSection.LOADING);
    
    // Simulate progress updates
    const progressSteps = [
      { percent: 15, text: 'Analyzing website structure...' },
      { percent: 35, text: 'Extracting content and metadata...' },
      { percent: 55, text: 'Processing with AI algorithms...' },
      { percent: 75, text: 'Generating business insights...' },
      { percent: 90, text: 'Finalizing analysis...' },
      { percent: 100, text: 'Analysis complete!' }
    ];

    let currentStep = 0;
    const progressInterval = setInterval(() => {
      if (currentStep < progressSteps.length) {
        setLoadingState({
          isLoading: true,
          progress: progressSteps[currentStep].percent,
          text: progressSteps[currentStep].text
        });
        currentStep++;
      } else {
        clearInterval(progressInterval);
      }
    }, 800);

    try {
      const result = await analyzeWebsite(url);
      
      if (result.success && result.data) {
        setAnalysisData(result.data);
        setTimeout(() => {
          setCurrentSection(AppSection.FORM);
          setIsAnalyzing(false);
        }, 1000);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Show error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Analysis failed. Please try again.</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
      
      setCurrentSection(AppSection.URL_INPUT);
      setIsAnalyzing(false);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleSkipToForm = () => {
    setCurrentSection(AppSection.FORM);
  };

  const handleReanalyze = () => {
    setCurrentSection(AppSection.URL_INPUT);
    setAnalysisData(null);
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit forms
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeForm = document.querySelector('form:not(.hidden)') as HTMLFormElement;
        if (activeForm) {
          activeForm.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }
      
      // Escape to go back
      if (e.key === 'Escape') {
        if (currentSection === AppSection.FORM) {
          handleReanalyze();
        } else if (currentSection === AppSection.LOADING) {
          setCurrentSection(AppSection.URL_INPUT);
          setIsAnalyzing(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSection]);

  return (
    <div className="min-h-screen bg-gray-50 scroll-smooth flex flex-col">
      <BackgroundElements />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header onSkipToForm={handleSkipToForm} />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full">
            {currentSection === AppSection.URL_INPUT && (
              <URLSection 
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
              />
            )}
            
            {currentSection === AppSection.LOADING && (
              <LoadingSection loadingState={loadingState} />
            )}
            
            {currentSection === AppSection.FORM && (
              <BusinessForm 
                initialData={analysisData}
                onReanalyze={handleReanalyze}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
