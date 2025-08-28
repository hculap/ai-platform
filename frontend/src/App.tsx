import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppSection, LoadingState, BusinessProfile, User, AuthResponse } from './types';
import { startBackgroundAnalysis, checkAnalysisStatus, registerUser, createBusinessProfile } from './services/api';

// Components
import BackgroundElements from './components/BackgroundElements';
import Header from './components/Header';
import URLSection from './components/URLSection';
import LoadingSection from './components/LoadingSection';
import BusinessForm from './components/BusinessForm';
import SignupForm from './components/SignupForm';
import Dashboard from './components/Dashboard';

function App() {
  const { t } = useTranslation();
  const [currentSection, setCurrentSection] = useState<AppSection>(AppSection.URL_INPUT);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<BusinessProfile | null>(null);
  const [openaiResponseId, setOpenaiResponseId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    text: t('loading.steps.structure')
  });
  const [acceptedProfileData, setAcceptedProfileData] = useState<BusinessProfile | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    setCurrentSection(AppSection.LOADING);
    
    try {
      // Start background analysis
      const startResult = await startBackgroundAnalysis(url);
      
      if (!startResult.success || !startResult.openaiResponseId) {
        throw new Error(startResult.error || 'Failed to start analysis');
      }
      
      setOpenaiResponseId(startResult.openaiResponseId);
      console.log('Background analysis started with ID:', startResult.openaiResponseId);
      
      // Start polling for completion
      pollAnalysisStatus(startResult.openaiResponseId);
      
    } catch (error) {
      console.error('Analysis start error:', error);
      
      // Show error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Failed to start analysis. Please try again.</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
      
      setCurrentSection(AppSection.URL_INPUT);
      setIsAnalyzing(false);
    }
  };

  const pollAnalysisStatus = async (openaiResponseId: string) => {
    const loadingSteps = [
      { text: t('loading.steps.structure'), duration: 8000 },    // 8 seconds
      { text: t('loading.steps.content'), duration: 10000 },     // 10 seconds  
      { text: t('loading.steps.processing'), duration: 15000 },  // 15 seconds
      { text: t('loading.steps.insights'), duration: 5000 },     // 5 seconds
      { text: t('loading.steps.finalizing'), duration: 2000 },   // 2 seconds
      { text: t('loading.steps.complete'), duration: 1000 }      // 1 second
    ];

    let currentStep = 0;
    let pollCount = 0;
    const maxPolls = 30; // 5 minutes max (10 second intervals)
    
    const showNextStep = () => {
      if (currentStep < loadingSteps.length) {
        setLoadingState({
          isLoading: true,
          progress: 0,
          text: loadingSteps[currentStep].text
        });
        
        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            showNextStep();
          }
        }, loadingSteps[currentStep].duration);
      }
    };

    showNextStep();

    const checkStatus = async () => {
      try {
        const statusResult = await checkAnalysisStatus(openaiResponseId);
        
        if (statusResult.status === 'completed' && statusResult.data) {
          setAnalysisData(statusResult.data);
          setTimeout(() => {
            setCurrentSection(AppSection.FORM);
            setIsAnalyzing(false);
          }, 1000);
        } else if (statusResult.status === 'failed' || statusResult.status === 'canceled') {
          throw new Error(statusResult.error || `Analysis ${statusResult.status}`);
        } else if (statusResult.status === 'error') {
          throw new Error(statusResult.error || 'Status check error');
        } else if (statusResult.status === 'pending' || statusResult.status === 'queued' || statusResult.status === 'in_progress') {
          // Still processing, continue polling
          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(checkStatus, 10000); // Check every 10 seconds
          } else {
            throw new Error('Analysis is taking too long. Please try again later.');
          }
        } else {
          // Unknown status, continue polling but log it
          console.warn('Unknown analysis status:', statusResult.status);
          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(checkStatus, 10000);
          } else {
            throw new Error('Analysis is taking too long. Please try again later.');
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
        
        // Show error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
        errorDiv.innerHTML = `
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${error instanceof Error ? error.message : 'Analysis failed. Please try again.'}</span>
          </div>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
        
        setCurrentSection(AppSection.URL_INPUT);
        setIsAnalyzing(false);
        setLoadingState({
          isLoading: false,
          progress: 0,
          text: ''
        });
      }
    };

    // Start checking status immediately
    checkStatus();
  };

  const handleSkipToForm = () => {
    setCurrentSection(AppSection.FORM);
  };

  const handleReanalyze = () => {
    setCurrentSection(AppSection.URL_INPUT);
    setAnalysisData(null);
    setOpenaiResponseId(null);
    setAcceptedProfileData(null);
  };

  const handleAcceptProfile = (profileData: BusinessProfile) => {
    setAcceptedProfileData(profileData);
    setCurrentSection(AppSection.SIGNUP);
  };

  const handleBackToProfile = () => {
    setCurrentSection(AppSection.FORM);
  };

  const handleSignup = async (email: string, password: string) => {
    setIsSigningUp(true);
    
    try {
      // Register user
      const registerResult = await registerUser(email, password);
      
      if (!registerResult.success || !registerResult.data) {
        throw new Error(registerResult.error || 'Registration failed');
      }

      const authData = registerResult.data;
      setCurrentUser(authData.user);
      setAuthToken(authData.access_token);

      // Create business profile if we have accepted profile data
      if (acceptedProfileData) {
        const profileResult = await createBusinessProfile(acceptedProfileData, authData.access_token);
        
        if (!profileResult.success) {
          console.error('Profile creation failed:', profileResult.error);
          // Still proceed to dashboard even if profile creation fails
        }
      }

      // Show success notification
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      successDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5">✓</div>
          <span>${t('notification.success.accountCreated')}</span>
        </div>
      `;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 5000);

      // Redirect to dashboard
      setCurrentSection(AppSection.DASHBOARD);
      
    } catch (error) {
      console.error('Signup error:', error);
      
      // Show error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5">⚠</div>
          <span>${error instanceof Error ? error.message : t('notification.error.signupFailed')}</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setAcceptedProfileData(null);
    setCurrentSection(AppSection.URL_INPUT);
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
        } else if (currentSection === AppSection.SIGNUP) {
          setCurrentSection(AppSection.FORM);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentSection]);

  // Render dashboard separately without background elements
  if (currentSection === AppSection.DASHBOARD && currentUser) {
    return (
      <Dashboard 
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

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
              <LoadingSection 
                loadingState={loadingState}
              />
            )}
            
            {currentSection === AppSection.FORM && (
              <BusinessForm 
                initialData={analysisData}
                onReanalyze={handleReanalyze}
                onAcceptProfile={handleAcceptProfile}
              />
            )}

            {currentSection === AppSection.SIGNUP && (
              <SignupForm 
                onBack={handleBackToProfile}
                onSignup={handleSignup}
                isSubmitting={isSigningUp}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
