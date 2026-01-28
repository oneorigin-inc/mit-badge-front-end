'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getPreviousBadges } from '@/lib/api';
import type { PreviousBadge } from '@/lib/types';

const STORAGE_KEY = 'previousBadgesData';

export function usePreviousBadges() {
  const [previousBadges, setPreviousBadges] = useState<PreviousBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragAvailable, setRagAvailable] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [storedCourseInput, setStoredCourseInput] = useState<string | null>(null);
  const initRef = useRef(false);

  // Restore previous badges from localStorage on mount
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Store the course input that was used for these badges
        if (data.courseInput) {
          setStoredCourseInput(data.courseInput);
        }
        if (data.previousBadges && data.previousBadges.length > 0) {
          setPreviousBadges(data.previousBadges);
          setRagAvailable(data.ragAvailable ?? true);
          setHasFetched(true);
        }
      }
    } catch (err) {
      console.error('Error restoring previous badges from localStorage:', err);
    }
    setIsInitialized(true);
  }, []);

  const fetchPreviousBadges = useCallback(async (courseInput: string, count: number = 4) => {
    setLoading(true);
    setError(null);

    try {
      const response = await getPreviousBadges(courseInput, count);
      const badges = response.previous_badges || [];
      const ragAvail = response.rag_available ?? true;

      setPreviousBadges(badges);
      setRagAvailable(ragAvail);
      setHasFetched(true);
      setStoredCourseInput(courseInput);

      // Store in localStorage for persistence (including courseInput for comparison)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          previousBadges: badges,
          ragAvailable: ragAvail,
          courseInput: courseInput,
        }));
      } catch (storageErr) {
        console.error('Failed to store previous badges in localStorage:', storageErr);
      }
    } catch (err) {
      console.error('Failed to fetch previous badges:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch previous badges');
      setPreviousBadges([]);
      setRagAvailable(false);
      setHasFetched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if the current course input matches the stored one
  const shouldRefetch = useCallback((currentCourseInput: string): boolean => {
    if (!storedCourseInput) return true;
    return storedCourseInput !== currentCourseInput;
  }, [storedCourseInput]);

  const clearPreviousBadges = useCallback(() => {
    setPreviousBadges([]);
    setHasFetched(false);
    setError(null);
    setStoredCourseInput(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear previous badges from localStorage:', err);
    }
  }, []);

  return {
    previousBadges,
    loading,
    error,
    ragAvailable,
    hasFetched,
    isInitialized,
    fetchPreviousBadges,
    clearPreviousBadges,
    shouldRefetch,
  };
}
