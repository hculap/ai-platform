import { useEffect, useRef } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  enableWhenInputFocused?: boolean;
}

/**
 * Hook for registering global keyboard shortcuts
 */
export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) => {
  const { enableWhenInputFocused = false } = options;
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when dependencies change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if focused on input/textarea/contenteditable unless explicitly enabled
      if (!enableWhenInputFocused) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true'
        ) {
          return;
        }
      }

      // Check each registered shortcut
      for (const shortcut of shortcutsRef.current) {
        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = (shortcut.ctrlKey ?? false) === event.ctrlKey;
        const metaMatches = (shortcut.metaKey ?? false) === event.metaKey;
        const shiftMatches = (shortcut.shiftKey ?? false) === event.shiftKey;
        const altMatches = (shortcut.altKey ?? false) === event.altKey;

        if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break; // Stop at first match
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enableWhenInputFocused]);
};

/**
 * Common keyboard shortcuts for the application
 */
export const createCommandPaletteShortcuts = (onOpen: () => void): KeyboardShortcut[] => [
  {
    key: 'p',
    metaKey: true,
    shiftKey: true,
    handler: onOpen,
    description: 'Open command palette'
  },
  {
    key: 'p',
    ctrlKey: true,
    shiftKey: true,
    handler: onOpen,
    description: 'Open command palette (Windows/Linux)'
  },
  {
    key: 'k',
    metaKey: true,
    handler: onOpen,
    description: 'Open command palette (alternative)'
  },
  {
    key: 'k',
    ctrlKey: true,
    handler: onOpen,
    description: 'Open command palette (alternative Windows/Linux)'
  }
];

/**
 * Navigation shortcuts
 */
export const createNavigationShortcuts = (navigate: (path: string) => void): KeyboardShortcut[] => [
  {
    key: 'd',
    altKey: true,
    handler: () => navigate('/dashboard'),
    description: 'Go to Dashboard'
  },
  {
    key: 'p',
    altKey: true,
    handler: () => navigate('/dashboard/prompts'),
    description: 'Go to Prompts'
  },
  {
    key: 'a',
    altKey: true,
    handler: () => navigate('/dashboard/agents'),
    description: 'Go to Agents'
  },
  {
    key: 'b',
    altKey: true,
    handler: () => navigate('/dashboard/business-profiles'),
    description: 'Go to Business Profiles'
  },
  {
    key: 'c',
    altKey: true,
    handler: () => navigate('/dashboard/competition'),
    description: 'Go to Competition'
  },
  {
    key: 'o',
    altKey: true,
    handler: () => navigate('/dashboard/offers'),
    description: 'Go to Offers'
  },
  {
    key: 'm',
    altKey: true,
    handler: () => navigate('/dashboard/campaigns'),
    description: 'Go to Campaigns'
  },
  {
    key: 'r',
    altKey: true,
    handler: () => navigate('/dashboard/ads'),
    description: 'Go to Ads'
  },
  {
    key: 's',
    altKey: true,
    handler: () => navigate('/dashboard/scripts'),
    description: 'Go to Scripts'
  }
];

/**
 * Detect platform for keyboard shortcut display
 */
export const getPlatform = (): 'mac' | 'windows' | 'linux' => {
  if (typeof window === 'undefined') return 'mac';

  const platform = window.navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'mac';
  if (platform.includes('win')) return 'windows';
  return 'linux';
};

/**
 * Format keyboard shortcut for display
 */
export const formatShortcut = (shortcut: Omit<KeyboardShortcut, 'handler'>): string => {
  const platform = getPlatform();
  const parts: string[] = [];

  if (shortcut.ctrlKey) {
    parts.push(platform === 'mac' ? '⌘' : 'Ctrl');
  }

  if (shortcut.metaKey) {
    parts.push(platform === 'mac' ? '⌘' : 'Meta');
  }

  if (shortcut.altKey) {
    parts.push(platform === 'mac' ? '⌥' : 'Alt');
  }

  if (shortcut.shiftKey) {
    parts.push(platform === 'mac' ? '⇧' : 'Shift');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(platform === 'mac' ? '' : '+');
};