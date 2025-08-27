import React, { useState } from 'react';
import { Globe, ArrowRight, Lightbulb, Zap, CheckCircle } from 'lucide-react';

interface URLSectionProps {
  onAnalyze: (url: string) => void;
  isAnalyzing: boolean;
}

const URLSection: React.FC<URLSectionProps> = ({ onAnalyze, isAnalyzing }) => {
  const [url, setUrl] = useState('');

  const normalizeUrl = (inputUrl: string): string => {
    let cleanUrl = inputUrl.trim().toLowerCase();
    
    // Remove any existing protocol
    cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
    
    // Add www. if it's missing and it's a simple domain
    if (!cleanUrl.startsWith('www.') && !cleanUrl.includes('/') && cleanUrl.includes('.')) {
      cleanUrl = 'www.' + cleanUrl;
    }
    
    // Add https:// protocol
    return 'https://' + cleanUrl;
  };

  const isValidDomain = (url: string): boolean => {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    const urlWithoutProtocol = url.replace(/^https?:\/\/(www\.)?/, '');
    const domain = urlWithoutProtocol.split('/')[0];
    
    return domainRegex.test(domain) || domain.includes('.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      alert('Please enter a website URL');
      return;
    }

    // Check if it looks like a valid domain
    if (!isValidDomain(url)) {
      alert('Please enter a valid website URL (e.g., example.com, website.pl)');
      return;
    }

    // Normalize the URL
    const normalizedUrl = normalizeUrl(url);
    
    // Final validation with the normalized URL
    try {
      new URL(normalizedUrl);
      onAnalyze(normalizedUrl);
    } catch {
      alert('Please enter a valid website URL');
      return;
    }
  };

  return (
    <section className="px-6 py-12">
      <div className="max-w-4xl mx-auto text-center">
        <div className="animate-fade-in">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 bg-clip-text text-transparent">
              Analyze Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Business
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get instant AI-powered insights about your business. Simply enter your website URL and let our advanced algorithms do the rest.
          </p>
        </div>

        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative group">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter your website (e.g., example.com, website.pl, mysite.org)"
                  className="w-full px-8 py-6 text-lg bg-white border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none input-glow transition-all duration-300 group-hover:border-gray-300"
                  required
                  disabled={isAnalyzing}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                  <Globe className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="mt-8 px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-2xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Website'}
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Analysis</h3>
            <p className="text-gray-600">Advanced algorithms analyze your website content and business model</p>
          </div>
          
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Results</h3>
            <p className="text-gray-600">Get comprehensive business insights in seconds, not hours</p>
          </div>
          
          <div className="p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Actionable Insights</h3>
            <p className="text-gray-600">Receive specific recommendations to improve your business</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default URLSection;
