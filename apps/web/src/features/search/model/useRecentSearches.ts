import { useState } from 'react';

import type { RecentSearchItem } from './types';

const STORAGE_KEY = 'busseuk:recent-searches';
const MAX_ITEMS = 20;

const dedupKey = (item: RecentSearchItem): string => {
  return item.type === 'station'
    ? `station:${item.arsId}`
    : `route:${item.busRouteId}`;
};

const load = (): RecentSearchItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentSearchItem[]) : [];
  } catch {
    return [];
  }
};

const save = (items: RecentSearchItem[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] =
    useState<RecentSearchItem[]>(load);

  const addRecentSearch = (item: RecentSearchItem) => {
    setRecentSearches((prev) => {
      const key = dedupKey(item);
      const filtered = prev.filter((i) => dedupKey(i) !== key);
      const next = [item, ...filtered].slice(0, MAX_ITEMS);
      save(next);
      return next;
    });
  };

  const removeRecentSearch = (item: RecentSearchItem) => {
    setRecentSearches((prev) => {
      const key = dedupKey(item);
      const next = prev.filter((i) => dedupKey(i) !== key);
      save(next);
      return next;
    });
  };

  return { recentSearches, addRecentSearch, removeRecentSearch };
};
