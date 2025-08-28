import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  onSignIn: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSignIn }) => {
  const { t } = useTranslation();

  return (
    <header className="px-6 py-8">
      <nav className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            {t('header.title')}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <button 
            onClick={onSignIn}
            className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-all duration-200 hover:shadow-md"
          >
            {t('header.signIn')}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
