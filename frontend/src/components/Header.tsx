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
    <header className="px-4 py-4 sm:px-6 sm:py-6">
      <nav className="max-w-7xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent sm:text-2xl">
            {t('header.title')}
          </span>
        </div>

        <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
          <div className="flex justify-end sm:justify-center">
            <LanguageSwitcher />
          </div>
          <button
            onClick={onSignIn}
            className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md sm:px-6 sm:py-3"
          >
            {t('header.signIn')}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
