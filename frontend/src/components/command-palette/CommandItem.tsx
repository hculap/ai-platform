import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Zap } from 'lucide-react';
import { Command, COMMAND_CATEGORIES } from './commandDefinitions';
import { SearchResult } from './commandSearch';

interface CommandItemProps {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

const CommandItem: React.FC<CommandItemProps> = ({
  result,
  isSelected,
  onClick,
  onMouseEnter
}) => {
  const { t } = useTranslation();
  const { command } = result;

  const categoryConfig = COMMAND_CATEGORIES[command.category];
  const Icon = command.icon;

  // Get keyboard shortcut display
  const getShortcutDisplay = (shortcut?: string) => {
    if (!shortcut) return null;

    const keys = shortcut.split(' ');
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <kbd
            key={index}
            className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 rounded border border-gray-200"
          >
            {key}
          </kbd>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`
        group relative flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all duration-150
        ${isSelected
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 shadow-sm'
          : 'hover:bg-gray-50 border border-transparent'
        }
      `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      {/* Icon with category color */}
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150
        ${isSelected
          ? `${categoryConfig.bgColor} ${categoryConfig.color}`
          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
        }
      `}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Command content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`
            font-medium text-sm truncate transition-colors duration-150
            ${isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}
          `}>
            {t(command.title, command.title)}
          </h3>

          {/* Credit cost badge */}
          {command.creditCost && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-100 to-yellow-100 text-orange-700 text-xs font-medium rounded-full">
              <Zap className="w-3 h-3" />
              <span>{command.creditCost}</span>
            </div>
          )}
        </div>

        <p className={`
          text-xs truncate transition-colors duration-150
          ${isSelected ? 'text-gray-600' : 'text-gray-500 group-hover:text-gray-600'}
        `}>
          {t(command.description, command.description)}
        </p>
      </div>

      {/* Right side content */}
      <div className="flex items-center gap-2">
        {/* Keyboard shortcut */}
        {command.shortcut && (
          <div className="hidden sm:block">
            {getShortcutDisplay(command.shortcut)}
          </div>
        )}

        {/* Category badge (mobile only) */}
        <div className="sm:hidden">
          <span className={`
            px-2 py-1 text-xs font-medium rounded-full
            ${categoryConfig.bgColor} ${categoryConfig.color}
          `}>
            {t(categoryConfig.label)}
          </span>
        </div>

        {/* Chevron icon */}
        <ChevronRight className={`
          w-4 h-4 transition-all duration-150
          ${isSelected
            ? 'text-gray-400 translate-x-0.5'
            : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'
          }
        `} />
      </div>

      {/* Selection highlight */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
      )}
    </div>
  );
};

export default CommandItem;