import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command, COMMANDS } from './commandDefinitions';
import { searchCommands, SearchResult, saveRecentCommand, getRecentCommands } from './commandSearch';

interface UseCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenModal?: (modalType: string) => void;
  userCredits?: number;
  hasBusinessProfile?: boolean;
  isAuthenticated?: boolean;
}

export const useCommandPalette = ({
  isOpen,
  onClose,
  onOpenModal,
  userCredits = 0,
  hasBusinessProfile = false,
  isAuthenticated = false
}: UseCommandPaletteProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentCommands, setRecentCommands] = useState<Command[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on user state
  const getFilteredCommands = useCallback(() => {
    return COMMANDS.filter(command => {
      // Check authentication requirement
      if (command.requiresAuth && !isAuthenticated) {
        return false;
      }

      // Check business profile requirement
      if (command.requiresBusinessProfile && !hasBusinessProfile) {
        return false;
      }

      // Check credit requirements
      if (command.creditCost && command.creditCost > userCredits) {
        return false;
      }

      return true;
    });
  }, [isAuthenticated, hasBusinessProfile, userCredits]);

  // Load recent commands
  useEffect(() => {
    const recentIds = getRecentCommands();
    const availableCommands = getFilteredCommands();
    const recent = recentIds
      .map(id => availableCommands.find(cmd => cmd.id === id))
      .filter(Boolean) as Command[];

    setRecentCommands(recent);
  }, [getFilteredCommands]);

  // Search commands when query changes
  useEffect(() => {
    const availableCommands = getFilteredCommands();

    if (!query.trim()) {
      // Show recent commands when no query
      const recentResults: SearchResult[] = recentCommands.map(command => ({
        command: { ...command, category: 'recent' as const },
        score: 1,
        matches: { title: true, description: true, keywords: true }
      }));

      // Add some popular navigation commands if no recent
      if (recentResults.length === 0) {
        const popularCommands = availableCommands
          .filter(cmd => ['nav-dashboard', 'nav-prompts', 'nav-agents'].includes(cmd.id))
          .map(command => ({
            command,
            score: 1,
            matches: { title: true, description: true, keywords: true }
          }));

        setResults(popularCommands);
      } else {
        setResults(recentResults);
      }
    } else {
      const searchResults = searchCommands(availableCommands, query, t as (key: string, fallback?: string) => string);
      setResults(searchResults.slice(0, 10)); // Limit to 10 results
    }

    setSelectedIndex(0);
  }, [query, recentCommands, getFilteredCommands, t]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Execute command
  const executeCommand = useCallback((command: Command) => {
    // Save to recent commands
    saveRecentCommand(command.id);

    // Close palette
    onClose();

    // Execute command action
    switch (command.action.type) {
      case 'navigate':
        if (command.action.target) {
          navigate(command.action.target);
        }
        break;

      case 'modal':
        if (command.action.modalType && onOpenModal) {
          onOpenModal(command.action.modalType);
        }
        break;

      case 'function':
        if (command.action.handler) {
          command.action.handler();
        }
        break;

      case 'external':
        if (command.action.target) {
          window.open(command.action.target, '_blank');
        }
        break;
    }
  }, [onClose, navigate, onOpenModal]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < results.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : results.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          executeCommand(results[selectedIndex].command);
        }
        break;
    }
  }, [isOpen, results, selectedIndex, onClose, executeCommand]);


  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Global keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    results,
    executeCommand,
    inputRef,
    listRef
  };
};