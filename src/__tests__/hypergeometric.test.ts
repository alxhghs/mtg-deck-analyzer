import {
    hypergeometric,
    hypergeometricAtLeast,
    hypergeometricAtMost,
    hypergeometricBetween,
} from "../hypergeometric";

describe("Hypergeometric Calculator", () => {
    describe("hypergeometric (exact probability)", () => {
        test("calculates probability of exactly 3 lands in opening hand (38 lands, 100 cards)", () => {
            const prob = hypergeometric(100, 38, 7, 3);
            expect(prob).toBeCloseTo(0.294, 3);
        });

        test("calculates probability of exactly 0 successes", () => {
            const prob = hypergeometric(100, 10, 7, 0);
            expect(prob).toBeCloseTo(0.4667, 3);
        });

        test("calculates probability of exactly 7 successes (all drawn)", () => {
            const prob = hypergeometric(100, 50, 7, 7);
            expect(prob).toBeCloseTo(0.0062, 3);
        });

        test("returns 0 for impossible scenarios (more successes than available)", () => {
            const prob = hypergeometric(100, 5, 7, 6);
            expect(prob).toBe(0);
        });

        test("returns 0 for impossible scenarios (negative successes)", () => {
            const prob = hypergeometric(100, 38, 7, -1);
            expect(prob).toBe(0);
        });

        test("calculates probability of drawing exactly 1 combo piece (3 in deck)", () => {
            const prob = hypergeometric(100, 3, 7, 1);
            expect(prob).toBeCloseTo(0.1852, 3);
        });
    });

    describe("hypergeometricAtLeast (cumulative probability)", () => {
        test("calculates probability of at least 2 lands in opening hand", () => {
            const prob = hypergeometricAtLeast(100, 38, 7, 2);
            expect(prob).toBeCloseTo(0.8233, 3);
        });

        test("calculates probability of at least 1 combo piece in opening hand", () => {
            const prob = hypergeometricAtLeast(100, 3, 7, 1);
            expect(prob).toBeCloseTo(0.1975, 3);
        });

        test("calculates probability of at least 0 successes (always 1)", () => {
            const prob = hypergeometricAtLeast(100, 38, 7, 0);
            expect(prob).toBeCloseTo(1.0, 4);
        });

        test("calculates probability of drawing at least 2 of 5 combo pieces by turn 5", () => {
            // Turn 5 = opening hand (7) + 4 draws = 11 cards, but first turn so 12 total
            const prob = hypergeometricAtLeast(100, 5, 12, 2);
            expect(prob).toBeCloseTo(0.108, 3);
        });

        test("handles edge case where minimum equals sample size", () => {
            const prob = hypergeometricAtLeast(100, 50, 7, 7);
            expect(prob).toBeCloseTo(0.0062, 3);
        });
    });

    describe("hypergeometricAtMost (cumulative probability)", () => {
        test("calculates probability of at most 4 lands in opening hand", () => {
            const prob = hypergeometricAtMost(100, 38, 7, 4);
            expect(prob).toBeCloseTo(0.9292, 3);
        });

        test("calculates probability of at most 0 successes", () => {
            const prob = hypergeometricAtMost(100, 10, 7, 0);
            expect(prob).toBeCloseTo(0.4667, 3);
        });

        test("calculates probability of at most all cards (always 1)", () => {
            const prob = hypergeometricAtMost(100, 38, 7, 7);
            expect(prob).toBeCloseTo(1.0, 4);
        });

        test("handles edge case with small deck", () => {
            const prob = hypergeometricAtMost(60, 24, 7, 3);
            expect(prob).toBeCloseTo(0.7208, 3);
        });
    });

    describe("hypergeometricBetween (range probability)", () => {
        test("calculates probability of 2-4 lands in opening hand", () => {
            const prob = hypergeometricBetween(100, 38, 7, 2, 4);
            expect(prob).toBeCloseTo(0.7526, 3);
        });

        test("calculates probability of exactly k when min equals max", () => {
            const prob = hypergeometricBetween(100, 38, 7, 3, 3);
            const exactProb = hypergeometric(100, 38, 7, 3);
            expect(prob).toBeCloseTo(exactProb, 4);
        });

        test("calculates probability of 3-5 lands in 6-card mulligan", () => {
            // After mulligan, deck is 99 cards with 37 lands remaining
            const prob = hypergeometricBetween(99, 37, 6, 3, 5);
            expect(prob).toBeCloseTo(0.3978, 3);
        });

        test("handles range that exceeds sample size", () => {
            const prob = hypergeometricBetween(100, 38, 7, 5, 10);
            expect(prob).toBeCloseTo(0.0708, 3); // Same as at least 5
        });

        test("handles range that exceeds available successes", () => {
            const prob = hypergeometricBetween(100, 5, 7, 3, 10);
            expect(prob).toBeCloseTo(0.002, 3); // Same as 3-5
        });
    });

    describe("Real-world MTG scenarios", () => {
        test("Standard 60-card deck with 24 lands: opening hand land probability", () => {
            // Probability of 2-5 lands in opening hand
            const prob = hypergeometricBetween(60, 24, 7, 2, 5);
            expect(prob).toBeCloseTo(0.8439, 3);
        });

        test("Commander deck: probability of having Sol Ring in opening hand", () => {
            // 1 Sol Ring in 100 cards, drawing 7
            const prob = hypergeometricAtLeast(100, 1, 7, 1);
            expect(prob).toBeCloseTo(0.07, 3);
        });

        test("Commander deck: probability of having any of 3 Sanguine Bond effects in opening hand", () => {
            // 3 drain effects in 100 cards, drawing 7
            const prob = hypergeometricAtLeast(100, 3, 7, 1);
            expect(prob).toBeCloseTo(0.1975, 3);
        });

        test("Commander deck: probability of having both combo pieces by turn 5", () => {
            // 5 total combo pieces (3 Sanguine Bond effects + 2 Exquisite Blood effects)
            // By turn 5 (on the play): 7 opening + 5 draws = 12 cards
            const prob = hypergeometricAtLeast(100, 5, 12, 2);
            expect(prob).toBeCloseTo(0.108, 3);
        });

        test("Mulligan decision: worse hand after going to 6", () => {
            // With 38 lands in 100, after scry and draw, what are odds of 2-4 lands?
            // Deck is now 99 cards with potentially 37 or 38 lands
            const prob = hypergeometricBetween(99, 37, 6, 2, 4);
            expect(prob).toBeCloseTo(0.7053, 3);
        });

        test("Fetchland scenario: probability of drawing both Urborg and Coffers by turn 10", () => {
            // 2 specific cards in 100, drawing 16 cards (7 + 9 draws)
            const prob = hypergeometricAtLeast(100, 2, 16, 2);
            expect(prob).toBeCloseTo(0.0242, 3);
        });

        test("Deck consistency: probability of drawing at least 1 of 8 ramp spells by turn 3", () => {
            // 8 ramp pieces in 100 cards, 9 cards seen (7 opening + 2 draws)
            const prob = hypergeometricAtLeast(100, 8, 9, 1);
            expect(prob).toBeCloseTo(0.5433, 3);
        });
    });

    describe("Edge cases", () => {
        test("handles zero population size gracefully", () => {
            const prob = hypergeometric(0, 0, 0, 0);
            expect(prob).toBe(1); // Drawing 0 from 0 is certain
        });

        test("handles single card scenarios", () => {
            const prob = hypergeometric(100, 1, 1, 1);
            expect(prob).toBeCloseTo(0.01, 4);
        });

        test("handles drawing entire deck", () => {
            const prob = hypergeometric(10, 10, 10, 10);
            expect(prob).toBeCloseTo(1.0, 4);
        });

        test("handles no target cards in deck", () => {
            const prob = hypergeometric(100, 0, 7, 0);
            expect(prob).toBeCloseTo(1.0, 4);
        });

        test("handles impossible draws gracefully", () => {
            const prob = hypergeometric(100, 0, 7, 1);
            expect(prob).toBe(0);
        });
    });

    describe("Probability bounds", () => {
        test("all probabilities are between 0 and 1", () => {
            const testCases = [
                [100, 38, 7, 3],
                [60, 24, 7, 2],
                [100, 5, 12, 2],
                [99, 37, 6, 3],
            ];

            testCases.forEach(([N, K, n, k]) => {
                const prob = hypergeometric(N, K, n, k);
                expect(prob).toBeGreaterThanOrEqual(0);
                expect(prob).toBeLessThanOrEqual(1);
            });
        });

        test("cumulative probabilities sum to approximately 1", () => {
            // Sum all possible outcomes for drawing 7 from 100 with 38 targets
            let sum = 0;
            for (let k = 0; k <= 7; k++) {
                sum += hypergeometric(100, 38, 7, k);
            }
            expect(sum).toBeCloseTo(1.0, 10);
        });

        test("at least + at most overlap correctly", () => {
            // P(X >= k) + P(X <= k-1) should equal 1
            const atLeast3 = hypergeometricAtLeast(100, 38, 7, 3);
            const atMost2 = hypergeometricAtMost(100, 38, 7, 2);
            expect(atLeast3 + atMost2).toBeCloseTo(1.0, 10);
        });
    });
});
