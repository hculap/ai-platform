import { Command } from './commandDefinitions';

export interface SearchResult {
  command: Command;
  score: number;
  matches: {
    title: boolean;
    description: boolean;
    keywords: boolean;
  };
}

/**
 * Simple fuzzy search implementation
 * Returns a score between 0 and 1 (1 being perfect match)
 */
function fuzzyMatch(query: string, text: string): { score: number; matched: boolean } {
  if (!query) return { score: 1, matched: true };
  if (!text) return { score: 0, matched: false };

  query = query.toLowerCase();
  text = text.toLowerCase();

  // Exact match gets highest score
  if (text.includes(query)) {
    const startIndex = text.indexOf(query);
    const lengthRatio = query.length / text.length;
    const positionBonus = startIndex === 0 ? 0.2 : 0; // Bonus for start match
    return {
      score: Math.min(1, 0.8 + lengthRatio + positionBonus),
      matched: true
    };
  }

  // Character sequence matching (fuzzy)
  let queryIndex = 0;
  let matchedChars = 0;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      matchedChars++;
      queryIndex++;
      consecutiveMatches++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
    } else {
      consecutiveMatches = 0;
    }
  }

  // Must match all query characters
  if (queryIndex !== query.length) {
    return { score: 0, matched: false };
  }

  // Calculate score based on:
  // - Percentage of matched characters
  // - Consecutive match bonus
  // - Length ratio
  const matchRatio = matchedChars / query.length;
  const consecutiveBonus = maxConsecutive / query.length * 0.3;
  const lengthPenalty = Math.max(0, (text.length - query.length) / text.length * 0.2);

  const score = Math.max(0, matchRatio + consecutiveBonus - lengthPenalty) * 0.7;

  return { score, matched: score > 0.3 };
}

/**
 * Score a command against a search query
 */
function scoreCommand(command: Command, query: string, t: (key: string, fallback?: string) => string): SearchResult | null {
  if (!query.trim()) {
    return {
      command,
      score: 1,
      matches: { title: true, description: true, keywords: true }
    };
  }

  const title = t(command.title, command.title);
  const description = t(command.description, command.description);
  const keywords = command.keywords.join(' ');

  const titleMatch = fuzzyMatch(query, title);
  const descriptionMatch = fuzzyMatch(query, description);
  const keywordsMatch = fuzzyMatch(query, keywords);

  // Must match at least one field
  if (!titleMatch.matched && !descriptionMatch.matched && !keywordsMatch.matched) {
    return null;
  }

  // Weight the scores (title is most important)
  const titleWeight = 0.6;
  const descriptionWeight = 0.3;
  const keywordsWeight = 0.4;

  let totalScore = 0;
  let totalWeight = 0;

  if (titleMatch.matched) {
    totalScore += titleMatch.score * titleWeight;
    totalWeight += titleWeight;
  }

  if (descriptionMatch.matched) {
    totalScore += descriptionMatch.score * descriptionWeight;
    totalWeight += descriptionWeight;
  }

  if (keywordsMatch.matched) {
    totalScore += keywordsMatch.score * keywordsWeight;
    totalWeight += keywordsWeight;
  }

  const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

  return {
    command,
    score: finalScore,
    matches: {
      title: titleMatch.matched,
      description: descriptionMatch.matched,
      keywords: keywordsMatch.matched
    }
  };
}

/**
 * Search through commands and return sorted results
 */
export function searchCommands(
  commands: Command[],
  query: string,
  t: (key: string, fallback?: string) => string,
  filters?: {
    categories?: string[];
    requiresAuth?: boolean;
    requiresBusinessProfile?: boolean;
    maxCreditCost?: number;
  }
): SearchResult[] {
  // Filter commands first
  let filteredCommands = commands;

  if (filters) {
    filteredCommands = commands.filter(command => {
      if (filters.categories && !filters.categories.includes(command.category)) {
        return false;
      }

      if (filters.requiresAuth !== undefined && command.requiresAuth !== filters.requiresAuth) {
        return false;
      }

      if (filters.requiresBusinessProfile !== undefined && command.requiresBusinessProfile !== filters.requiresBusinessProfile) {
        return false;
      }

      if (filters.maxCreditCost !== undefined && command.creditCost && command.creditCost > filters.maxCreditCost) {
        return false;
      }

      return true;
    });
  }

  // Score and filter commands
  const results: SearchResult[] = [];

  for (const command of filteredCommands) {
    const result = scoreCommand(command, query, t);
    if (result && result.score > 0) {
      results.push(result);
    }
  }

  // Sort by score (descending) and then by category priority
  const categoryPriority = {
    recent: 7,
    navigation: 6,
    create: 5,
    ai: 4,
    search: 3,
    settings: 2,
  };

  results.sort((a, b) => {
    // First sort by score
    if (Math.abs(a.score - b.score) > 0.1) {
      return b.score - a.score;
    }

    // Then by category priority
    const aPriority = categoryPriority[a.command.category] || 0;
    const bPriority = categoryPriority[b.command.category] || 0;

    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }

    // Finally by title length (shorter titles first)
    const aTitle = t(a.command.title, a.command.title);
    const bTitle = t(b.command.title, b.command.title);
    return aTitle.length - bTitle.length;
  });

  return results;
}

/**
 * Get recent commands from localStorage
 */
export function getRecentCommands(maxCount: number = 5): string[] {
  try {
    const recent = localStorage.getItem('commandPalette.recent');
    if (recent) {
      return JSON.parse(recent).slice(0, maxCount);
    }
  } catch (error) {
    console.warn('Error loading recent commands:', error);
  }
  return [];
}

/**
 * Save a command to recent commands
 */
export function saveRecentCommand(commandId: string, maxCount: number = 10): void {
  try {
    const recent = getRecentCommands(maxCount);

    // Remove if already exists
    const filtered = recent.filter(id => id !== commandId);

    // Add to beginning
    const updated = [commandId, ...filtered].slice(0, maxCount);

    localStorage.setItem('commandPalette.recent', JSON.stringify(updated));
  } catch (error) {
    console.warn('Error saving recent command:', error);
  }
}

/**
 * Clear recent commands history
 */
export function clearRecentCommands(): void {
  try {
    localStorage.removeItem('commandPalette.recent');
  } catch (error) {
    console.warn('Error clearing recent commands:', error);
  }
}