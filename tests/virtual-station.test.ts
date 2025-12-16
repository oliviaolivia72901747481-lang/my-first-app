/**
 * Property-Based Tests for Virtual Station Platform
 * 
 * **Feature: virtual-station, Property 19: 竞赛排行榜排序正确性**
 * **Validates: Requirements 10.2, 10.3**
 * 
 * Tests the competition leaderboard sorting functionality.
 * Ensures entries are sorted by score (descending) and time (ascending) when scores are equal.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// ============ Data Types ============

/**
 * Leaderboard entry interface matching the implementation
 */
interface LeaderboardEntry {
  id: string;
  competitionId: string;
  userId: string;
  userName: string;
  score: number;
  timeSpent: number;  // in seconds
  rank: number;
  completedAt: number;
  operationPath?: object | null;
}

// ============ Sorting Function (extracted from virtual-station.js) ============

/**
 * Sort leaderboard entries by score (descending) and time (ascending)
 * 
 * **Feature: virtual-station, Property 19: 竞赛排行榜排序正确性**
 * *For any* 竞赛排行榜，条目必须按得分降序排列，得分相同时按用时升序排列
 * **Validates: Requirements 10.2, 10.3**
 * 
 * @param entries - Array of leaderboard entries
 * @returns Sorted array of leaderboard entries
 */
function sortLeaderboard(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  if (!entries || !Array.isArray(entries)) {
    return [];
  }

  return [...entries].sort((a, b) => {
    // First sort by score descending
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // When scores are equal, sort by time ascending (less time is better)
    return a.timeSpent - b.timeSpent;
  });
}

// ============ Generators ============

/**
 * Generate a valid leaderboard entry
 */
const leaderboardEntryArbitrary: fc.Arbitrary<LeaderboardEntry> = fc.record({
  id: fc.uuid(),
  competitionId: fc.uuid(),
  userId: fc.uuid(),
  userName: fc.string({ minLength: 1, maxLength: 50 }),
  score: fc.integer({ min: 0, max: 100 }),
  timeSpent: fc.integer({ min: 1, max: 36000 }), // 1 second to 10 hours
  rank: fc.constant(0), // Will be assigned after sorting
  completedAt: fc.integer({ min: 1600000000000, max: 1800000000000 }),
  operationPath: fc.constant(null),
});

/**
 * Generate an array of leaderboard entries
 */
const leaderboardArbitrary = fc.array(leaderboardEntryArbitrary, { minLength: 0, maxLength: 100 });

/**
 * Generate entries with same scores to test time-based sorting
 */
const sameScoreEntriesArbitrary = fc.integer({ min: 0, max: 100 }).chain(fixedScore =>
  fc.array(
    fc.record({
      id: fc.uuid(),
      competitionId: fc.uuid(),
      userId: fc.uuid(),
      userName: fc.string({ minLength: 1, maxLength: 50 }),
      score: fc.constant(fixedScore),
      timeSpent: fc.integer({ min: 1, max: 36000 }),
      rank: fc.constant(0),
      completedAt: fc.integer({ min: 1600000000000, max: 1800000000000 }),
      operationPath: fc.constant(null),
    }),
    { minLength: 2, maxLength: 20 }
  )
);

// ============ Property Tests ============

describe('Competition Leaderboard Property Tests', () => {
  /**
   * **Feature: virtual-station, Property 19: 竞赛排行榜排序正确性**
   * **Validates: Requirements 10.2, 10.3**
   * 
   * *For any* 竞赛排行榜，条目必须按得分降序排列，得分相同时按用时升序排列
   */
  describe('Property 19: 竞赛排行榜排序正确性', () => {
    
    it('should sort entries by score in descending order', () => {
      fc.assert(
        fc.property(leaderboardArbitrary, (entries) => {
          const sorted = sortLeaderboard(entries);
          
          // Verify score is in descending order
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].score).toBeGreaterThanOrEqual(sorted[i + 1].score);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should sort entries by time ascending when scores are equal', () => {
      fc.assert(
        fc.property(sameScoreEntriesArbitrary, (entries) => {
          const sorted = sortLeaderboard(entries);
          
          // All entries have the same score, so they should be sorted by time ascending
          for (let i = 0; i < sorted.length - 1; i++) {
            // Since all scores are equal, time should be in ascending order
            if (sorted[i].score === sorted[i + 1].score) {
              expect(sorted[i].timeSpent).toBeLessThanOrEqual(sorted[i + 1].timeSpent);
            }
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve all entries after sorting (no data loss)', () => {
      fc.assert(
        fc.property(leaderboardArbitrary, (entries) => {
          const sorted = sortLeaderboard(entries);
          
          // Same number of entries
          expect(sorted.length).toBe(entries.length);
          
          // All original entries should be present
          const originalIds = new Set(entries.map(e => e.id));
          const sortedIds = new Set(sorted.map(e => e.id));
          expect(sortedIds).toEqual(originalIds);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle empty array', () => {
      const sorted = sortLeaderboard([]);
      expect(sorted).toEqual([]);
    });

    it('should handle null/undefined input', () => {
      expect(sortLeaderboard(null as any)).toEqual([]);
      expect(sortLeaderboard(undefined as any)).toEqual([]);
    });

    it('should not mutate the original array', () => {
      fc.assert(
        fc.property(leaderboardArbitrary, (entries) => {
          const originalEntries = entries.map(e => ({ ...e }));
          sortLeaderboard(entries);
          
          // Original array should be unchanged
          expect(entries).toEqual(originalEntries);
        }),
        { numRuns: 100 }
      );
    });

    it('should correctly order mixed score and time combinations', () => {
      fc.assert(
        fc.property(leaderboardArbitrary, (entries) => {
          const sorted = sortLeaderboard(entries);
          
          // Verify the complete sorting invariant
          for (let i = 0; i < sorted.length - 1; i++) {
            const current = sorted[i];
            const next = sorted[i + 1];
            
            // Either current score is higher, or scores are equal and current time is less or equal
            const isCorrectOrder = 
              current.score > next.score || 
              (current.score === next.score && current.timeSpent <= next.timeSpent);
            
            expect(isCorrectOrder).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should be idempotent (sorting twice gives same result)', () => {
      fc.assert(
        fc.property(leaderboardArbitrary, (entries) => {
          const sortedOnce = sortLeaderboard(entries);
          const sortedTwice = sortLeaderboard(sortedOnce);
          
          // Results should be identical
          expect(sortedTwice).toEqual(sortedOnce);
        }),
        { numRuns: 100 }
      );
    });

    it('should handle single entry', () => {
      fc.assert(
        fc.property(leaderboardEntryArbitrary, (entry) => {
          const sorted = sortLeaderboard([entry]);
          
          expect(sorted.length).toBe(1);
          expect(sorted[0]).toEqual(entry);
        }),
        { numRuns: 100 }
      );
    });
  });
});
