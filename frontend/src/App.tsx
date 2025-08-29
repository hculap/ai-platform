import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoadingState, BusinessProfile, User, AuthResponse } from './types';
import { startBackgroundAnalysis, checkAnalysisStatus, registerUser, loginUser, createBusinessProfile } from './services/api';
import { tokenManager } from './services/tokenManager';

// Components
import BackgroundElements from './components/BackgroundElements';
import Header from './components/Header';
import URLSection from './components/URLSection';
import LoadingSection from './components/LoadingSection';
import BusinessForm from './components/BusinessForm';
import SignupForm from './components/SignupForm';
import SignInForm from './components/SignInForm';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Create a separate component for the app content that can use router hooks
function AppContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const [refreshBusinessProfiles, setRefreshBusinessProfiles] = useState<(() => Promise<void>) | null>(null);

  const handleAnalyze = async (url: string) => {
    setIsAnalyzing(true);
    navigate('/loading');
    
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
      
      navigate('/');
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
            navigate('/form');
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
        
        navigate('/');
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
    navigate('/form');
  };

  const handleReanalyze = () => {
    navigate('/');
    setAnalysisData(null);
    setOpenaiResponseId(null);
    setAcceptedProfileData(null);
  };

  const handleAcceptProfile = (profileData: BusinessProfile) => {
    setAcceptedProfileData(profileData);
    navigate('/signup');
  };

  const handleBackToProfile = () => {
    navigate('/form');
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
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('authToken', authData.access_token);
      if (authData.refresh_token) {
        localStorage.setItem('refreshToken', authData.refresh_token);
      }

      // Create business profile if we have accepted profile data
      if (acceptedProfileData) {
        const profileResult = await createBusinessProfile(acceptedProfileData, authData.access_token);

        if (!profileResult.success) {
          console.error('Profile creation failed:', profileResult.error);
          // Still proceed to dashboard even if profile creation fails
        } else {
          // Refresh business profiles after successful creation
          if (refreshBusinessProfiles) {
            await refreshBusinessProfiles();
          }
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
      navigate('/dashboard');
      
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

  const handleSignIn = async (email: string, password: string) => {
    setIsSigningIn(true);
    
    try {
      // Login user
      const loginResult = await loginUser(email, password);
      
      if (!loginResult.success || !loginResult.data) {
        throw new Error(loginResult.error || 'Login failed');
      }

      const authData = loginResult.data;
      setCurrentUser(authData.user);
      setAuthToken(authData.access_token);
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('authToken', authData.access_token);
      if (authData.refresh_token) {
        localStorage.setItem('refreshToken', authData.refresh_token);
      }

      // Show success notification
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      successDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5">✓</div>
          <span>${t('notification.success.signedIn')}</span>
        </div>
      `;
      document.body.appendChild(successDiv);
      setTimeout(() => successDiv.remove(), 5000);

      // Redirect to dashboard
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Sign in error:', error);
      
      // Show error notification
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 animate-slide-up';
      errorDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <div class="w-5 h-5">⚠</div>
          <span>${error instanceof Error ? error.message : t('notification.error.signinFailed')}</span>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => errorDiv.remove(), 5000);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  const handleShowSignIn = () => {
    navigate('/signin');
  };


  const handleLogout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setAcceptedProfileData(null);
    navigate('/');
    
    // Use token manager for logout
    tokenManager.logout();
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
        const path = location.pathname;
        if (path === '/form') {
          handleReanalyze();
        } else if (path === '/loading') {
          navigate('/');
          setIsAnalyzing(false);
        } else if (path === '/signup') {
          navigate('/form');
        } else if (path === '/signin') {
          navigate('/');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate, handleReanalyze]);

  // Initialize token management and load authentication state
  useEffect(() => {
    // Set up token manager callbacks
    tokenManager.setCallbacks(
      (newToken: string) => {
        // Token refreshed callback
        setAuthToken(newToken);
      },
      () => {
        // Logout callback
        setCurrentUser(null);
        setAuthToken(null);
        setAcceptedProfileData(null);
        navigate('/');
      }
    );

    // Initialize token manager and check for existing auth
    const isAuthenticated = tokenManager.initialize();
    
    if (isAuthenticated) {
      // Load user from localStorage if token is valid
      const savedUser = localStorage.getItem('user');
      const savedToken = tokenManager.getAuthToken();
      
      if (savedUser && savedToken) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setAuthToken(savedToken);
          
          // Only set to dashboard if we're not already in an authenticated section
          const publicPaths = ['/', '/loading', '/form', '/signup', '/signin'];
          if (publicPaths.includes(location.pathname)) {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          tokenManager.logout();
        }
      }
    }
    
    setIsAuthLoaded(true);

    // Cleanup on unmount
    return () => {
      tokenManager.stopTokenMonitoring();
    };
  }, []);

  // Auto-redirect if user is already signed in (but allow navigation to other authenticated sections)
  useEffect(() => {
    if (currentUser && isAuthLoaded) {
      // Only redirect to dashboard if user is not in an authenticated section
      const authenticatedPaths = ['/dashboard'];
      const currentPath = location.pathname;
      if (!authenticatedPaths.some(path => currentPath.startsWith(path))) {
        navigate('/dashboard');
      }
    }
  }, [currentUser, isAuthLoaded, location.pathname, navigate]);

  // Show loading screen while checking authentication
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-white rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard/*" element={
        <ProtectedRoute isAuthenticated={!!currentUser}>
          <Dashboard
            user={currentUser!}
            authToken={authToken || ''}
            onLogout={handleLogout}
            onProfileCreated={(refreshFn) => setRefreshBusinessProfiles(() => refreshFn)}
            onTokenRefreshed={(newToken) => {
              setAuthToken(newToken);
              localStorage.setItem('authToken', newToken);
            }}
          />
        </ProtectedRoute>
      } />
      
      {/* Public Routes */}
      <Route path="/" element={
        <div className="min-h-screen bg-gray-50 scroll-smooth flex flex-col">
          <BackgroundElements />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header onSignIn={handleShowSignIn} />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                <URLSection 
                  onAnalyze={handleAnalyze}
                  onSkipToForm={handleSkipToForm}
                  isAnalyzing={isAnalyzing}
                />
              </div>
            </div>
          </div>
        </div>
      } />
      
      <Route path="/loading" element={
        <div className="min-h-screen bg-gray-50 scroll-smooth flex flex-col">
          <BackgroundElements />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header onSignIn={handleShowSignIn} />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                <LoadingSection 
                  loadingState={loadingState}
                />
              </div>
            </div>
          </div>
        </div>
      } />
      
      <Route path="/form" element={
        <div className="min-h-screen bg-gray-50 scroll-smooth flex flex-col">
          <BackgroundElements />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header onSignIn={handleShowSignIn} />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                <BusinessForm 
                  initialData={analysisData}
                  onReanalyze={handleReanalyze}
                  onAcceptProfile={handleAcceptProfile}
                />
              </div>
            </div>
          </div>
        </div>
      } />
      
      <Route path="/signup" element={
        <div className="min-h-screen bg-gray-50 scroll-smooth flex flex-col">
          <BackgroundElements />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header onSignIn={handleShowSignIn} />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                <SignupForm 
                  onBack={handleBackToProfile}
                  onSignup={handleSignup}
                  isSubmitting={isSigningUp}
                />
              </div>
            </div>
          </div>
        </div>
      } />
      
      <Route path="/signin" element={
        <div className="min-h-screen bg-gray-50 scroll-smooth flex flex-col">
          <BackgroundElements />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Header onSignIn={handleShowSignIn} />
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full">
                <SignInForm 
                  onBack={handleBackToMain}
                  onSignIn={handleSignIn}
                  isSubmitting={isSigningIn}
                />
              </div>
            </div>
          </div>
        </div>
      } />
      
      {/* Redirect authenticated users from auth routes */}
      {currentUser && (
        <>
          <Route path="/signin" element={<Navigate to="/dashboard" replace />} />
          <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}

// Main App component that provides the Router context
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
