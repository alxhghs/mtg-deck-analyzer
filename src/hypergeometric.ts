/**
 * Hypergeometric Calculator
 * Used to calculate probabilities in Magic: The Gathering
 *
 * Example: "What's the probability of drawing at least 2 lands in my opening hand of 7 cards
 * if my deck has 38 lands out of 100 cards?"
 */

/**
 * Calculate factorial
 */
function factorial(n: number): number {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

/**
 * Calculate binomial coefficient: n choose k
 * C(n,k) = n! / (k! * (n-k)!)
 */
function binomialCoefficient(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;

    // Optimize by using the smaller of k or n-k
    k = Math.min(k, n - k);

    let result = 1;
    for (let i = 0; i < k; i++) {
        result *= n - i;
        result /= i + 1;
    }
    return result;
}

/**
 * Calculate hypergeometric probability
 *
 * @param populationSize - Total number of cards in deck (N)
 * @param successesInPopulation - Number of success cards in deck (K) - e.g., number of lands
 * @param sampleSize - Number of cards drawn (n) - e.g., opening hand of 7
 * @param successesInSample - Exact number of successes you want (k) - e.g., exactly 3 lands
 * @returns Probability of drawing exactly k successes
 */
export function hypergeometric(
    populationSize: number,
    successesInPopulation: number,
    sampleSize: number,
    successesInSample: number
): number {
    // C(K, k) * C(N-K, n-k) / C(N, n)
    const numerator =
        binomialCoefficient(successesInPopulation, successesInSample) *
        binomialCoefficient(populationSize - successesInPopulation, sampleSize - successesInSample);

    const denominator = binomialCoefficient(populationSize, sampleSize);

    return numerator / denominator;
}

/**
 * Calculate probability of drawing AT LEAST k successes
 *
 * @param populationSize - Total number of cards in deck (N)
 * @param successesInPopulation - Number of success cards in deck (K)
 * @param sampleSize - Number of cards drawn (n)
 * @param minSuccesses - Minimum number of successes you want (k or more)
 * @returns Probability of drawing at least k successes
 */
export function hypergeometricAtLeast(
    populationSize: number,
    successesInPopulation: number,
    sampleSize: number,
    minSuccesses: number
): number {
    let probability = 0;
    for (let k = minSuccesses; k <= Math.min(sampleSize, successesInPopulation); k++) {
        probability += hypergeometric(populationSize, successesInPopulation, sampleSize, k);
    }
    return probability;
}

/**
 * Calculate probability of drawing AT MOST k successes
 *
 * @param populationSize - Total number of cards in deck (N)
 * @param successesInPopulation - Number of success cards in deck (K)
 * @param sampleSize - Number of cards drawn (n)
 * @param maxSuccesses - Maximum number of successes you want (k or fewer)
 * @returns Probability of drawing at most k successes
 */
export function hypergeometricAtMost(
    populationSize: number,
    successesInPopulation: number,
    sampleSize: number,
    maxSuccesses: number
): number {
    let probability = 0;
    for (let k = 0; k <= Math.min(maxSuccesses, sampleSize, successesInPopulation); k++) {
        probability += hypergeometric(populationSize, successesInPopulation, sampleSize, k);
    }
    return probability;
}

/**
 * Calculate probability of drawing BETWEEN k1 and k2 successes (inclusive)
 */
export function hypergeometricBetween(
    populationSize: number,
    successesInPopulation: number,
    sampleSize: number,
    minSuccesses: number,
    maxSuccesses: number
): number {
    let probability = 0;
    for (
        let k = minSuccesses;
        k <= Math.min(maxSuccesses, sampleSize, successesInPopulation);
        k++
    ) {
        probability += hypergeometric(populationSize, successesInPopulation, sampleSize, k);
    }
    return probability;
}

/**
 * CLI interface for hypergeometric calculator
 */
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
        console.log(`
Hypergeometric Calculator for MTG Probability

Usage: npx ts-node src/hypergeometric.ts [options]

Options:
  --deck <N>          Total cards in deck (default: 100)
  --target <K>        Number of target cards in deck (e.g., lands, combo pieces)
  --draw <n>          Number of cards drawn (default: 7 for opening hand)
  --exactly <k>       Calculate probability of drawing exactly k target cards
  --at-least <k>      Calculate probability of drawing at least k target cards
  --at-most <k>       Calculate probability of drawing at most k target cards
  --between <k1> <k2> Calculate probability of drawing between k1 and k2 target cards

Examples:
  # Probability of drawing exactly 3 lands in opening hand (38 lands, 100 card deck)
  npx ts-node src/hypergeometric.ts --deck 100 --target 38 --draw 7 --exactly 3

  # Probability of drawing at least 2 lands in opening hand
  npx ts-node src/hypergeometric.ts --deck 100 --target 38 --draw 7 --at-least 2

  # Probability of drawing at least 1 of 3 combo pieces in opening hand
  npx ts-node src/hypergeometric.ts --deck 100 --target 3 --draw 7 --at-least 1

  # Probability of drawing 2-4 lands in opening hand
  npx ts-node src/hypergeometric.ts --deck 100 --target 38 --draw 7 --between 2 4

  # Mulligan decision: Probability of better hand (3-5 lands in 6 cards)
  npx ts-node src/hypergeometric.ts --deck 99 --target 37 --draw 6 --between 3 5
`);
        process.exit(0);
    }

    let populationSize = 100;
    let successesInPopulation = 0;
    let sampleSize = 7;
    let mode: "exactly" | "at-least" | "at-most" | "between" = "exactly";
    let targetValue = 0;
    let targetValue2 = 0;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case "--deck":
                populationSize = parseInt(args[++i]);
                break;
            case "--target":
                successesInPopulation = parseInt(args[++i]);
                break;
            case "--draw":
                sampleSize = parseInt(args[++i]);
                break;
            case "--exactly":
                mode = "exactly";
                targetValue = parseInt(args[++i]);
                break;
            case "--at-least":
                mode = "at-least";
                targetValue = parseInt(args[++i]);
                break;
            case "--at-most":
                mode = "at-most";
                targetValue = parseInt(args[++i]);
                break;
            case "--between":
                mode = "between";
                targetValue = parseInt(args[++i]);
                targetValue2 = parseInt(args[++i]);
                break;
        }
    }

    if (successesInPopulation === 0) {
        console.error("❌ Error: Must specify --target <K>");
        process.exit(1);
    }

    let probability = 0;
    let description = "";

    switch (mode) {
        case "exactly":
            probability = hypergeometric(
                populationSize,
                successesInPopulation,
                sampleSize,
                targetValue
            );
            description = `exactly ${targetValue}`;
            break;
        case "at-least":
            probability = hypergeometricAtLeast(
                populationSize,
                successesInPopulation,
                sampleSize,
                targetValue
            );
            description = `at least ${targetValue}`;
            break;
        case "at-most":
            probability = hypergeometricAtMost(
                populationSize,
                successesInPopulation,
                sampleSize,
                targetValue
            );
            description = `at most ${targetValue}`;
            break;
        case "between":
            probability = hypergeometricBetween(
                populationSize,
                successesInPopulation,
                sampleSize,
                targetValue,
                targetValue2
            );
            description = `between ${targetValue} and ${targetValue2}`;
            break;
    }

    console.log(`
📊 Hypergeometric Probability Calculation
════════════════════════════════════════════════════════════════

Deck Setup:
  • Total cards in deck: ${populationSize}
  • Target cards in deck: ${successesInPopulation} (${((successesInPopulation / populationSize) * 100).toFixed(1)}%)
  • Cards drawn: ${sampleSize}

Question:
  What's the probability of drawing ${description} target card(s)?

Result:
  🎯 ${(probability * 100).toFixed(2)}% chance
  📈 Odds: 1 in ${(1 / probability).toFixed(2)}
`);
}
