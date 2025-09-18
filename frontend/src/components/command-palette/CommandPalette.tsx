import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Search, Command as CommandIcon, Clock, Sparkles } from 'lucide-react';
import { useCommandPalette } from './useCommandPalette';
import CommandItem from './CommandItem';
import { COMMAND_CATEGORIES } from './commandDefinitions';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal?: (modalType: string) => void;
  userCredits?: number;
  hasBusinessProfile?: boolean;
  isAuthenticated?: boolean;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenModal,
  userCredits = 0,
  hasBusinessProfile = false,
  isAuthenticated = false
}) => {
  const { t } = useTranslation();

  const {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    results,
    executeCommand,
    inputRef,
    listRef
  } = useCommandPalette({
    isOpen,
    onClose,
    onOpenModal,
    userCredits,
    hasBusinessProfile,
    isAuthenticated
  });

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Get grouped results by category
  const groupedResults = React.useMemo(() => {
    const groups: Record<string, typeof results> = {};

    results.forEach(result => {
      const category = result.command.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    });

    return groups;
  }, [results]);

  if (!isOpen) return null;

  const commandPalette = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
        style={{
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      />

      {/* Command Palette Container */}
      <div className="relative w-full max-w-2xl">
        {/* Glassmorphic container */}
        <div
          className="bg-white/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1), 0 15px 12px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
          }}
        >
          {/* Header with search */}
          <div className="relative p-4 border-b border-gray-200/50">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-white/30 to-purple-50/50" />

            {/* Search input container */}
            <div className="relative flex items-center">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-400" />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('commandPalette.searchPlaceholder', 'Type a command or search...')}
                className="w-full pl-10 pr-20 py-3 bg-white/60 border border-gray-200/60 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-transparent transition-all duration-200"
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)'
                }}
              />

              {/* Keyboard hint */}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100/80 rounded border border-gray-200/60">
                  <CommandIcon className="w-3 h-3" />
                </kbd>
                <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100/80 rounded border border-gray-200/60">
                  K
                </kbd>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {results.length > 0 ? (
              <div ref={listRef} className="p-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => {
                  const categoryConfig = COMMAND_CATEGORIES[category as keyof typeof COMMAND_CATEGORIES];

                  return (
                    <div key={category} className="mb-4 last:mb-0">
                      {/* Category header */}
                      {Object.keys(groupedResults).length > 1 && (
                        <div className="flex items-center gap-2 px-3 py-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${categoryConfig.bgColor}`} />
                          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {category === 'recent' ? (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {t('commandPalette.categories.recent', 'Recent')}
                              </div>
                            ) : (
                              t(categoryConfig.label)
                            )}
                          </h3>
                          <div className="flex-1 h-px bg-gray-200/60" />
                        </div>
                      )}

                      {/* Category commands */}
                      <div className="space-y-1">
                        {categoryResults.map((result, index) => {
                          const globalIndex = results.findIndex(r => r === result);
                          return (
                            <CommandItem
                              key={result.command.id}
                              result={result}
                              isSelected={globalIndex === selectedIndex}
                              onClick={() => executeCommand(result.command)}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="p-3 bg-gray-100 rounded-full mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  {t('commandPalette.noResults.title', 'No commands found')}
                </h3>
                <p className="text-xs text-gray-500 text-center max-w-sm">
                  {t('commandPalette.noResults.description', 'Try a different search term or browse available commands.')}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200/50 bg-gray-50/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/60 rounded border border-gray-200/60">↑↓</kbd>
                  <span>{t('commandPalette.hints.navigate', 'Navigate')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/60 rounded border border-gray-200/60">↵</kbd>
                  <span>{t('commandPalette.hints.select', 'Select')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/60 rounded border border-gray-200/60">esc</kbd>
                  <span>{t('commandPalette.hints.close', 'Close')}</span>
                </div>
              </div>

              {query && (
                <div className="flex items-center gap-1 text-gray-400">
                  <Sparkles className="w-3 h-3" />
                  <span>{results.length} {t('commandPalette.resultsCount', 'results')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Floating animation elements */}
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );

  return createPortal(commandPalette, document.body);
};

export default CommandPalette;