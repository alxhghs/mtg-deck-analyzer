import * as fs from "fs";

interface CardCount {
    name: string;
    quantity: number;
    category?: string;
}

interface DeckCount {
    totalCards: number;
    uniqueCards: number;
    cardsByCategory: Map<string, number>;
    cards: CardCount[];
}

/**
 * Counts cards in a decklist file
 * Supports formats:
 * - "4 Card Name"
 * - "4x Card Name"
 * - "Card Name" (defaults to 1)
 * - "## Category (X)" headers
 *
 * Ignores:
 * - Empty lines
 * - Comments (# at start of line)
 * - Section headers (Mainboard:, Sideboard:, Commander:)
 */
export function countCardsInFile(filePath: string): DeckCount {
    const content = fs.readFileSync(filePath, "utf-8");
    return countCardsInText(content);
}

/**
 * Counts cards in decklist text content
 */
export function countCardsInText(content: string): DeckCount {
    const lines = content.split("\n");
    const cards: CardCount[] = [];
    const cardsByCategory = new Map<string, number>();
    let currentCategory: string | undefined;
    let totalCards = 0;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty lines
        if (!trimmed) continue;

        // Check for category header: ## Category (X) or ## Category
        const categoryMatch = trimmed.match(/^##\s+(.+?)(?:\s+\((\d+)\))?$/);
        if (categoryMatch) {
            currentCategory = categoryMatch[1];
            // Stop counting if we hit Stats or Description sections
            if (currentCategory === "Stats" || currentCategory === "Description") {
                break;
            }
            const expectedCount = categoryMatch[2] ? parseInt(categoryMatch[2]) : 0;
            if (expectedCount > 0) {
                cardsByCategory.set(currentCategory, 0); // Initialize, will count actual cards
            }
            continue;
        }

        // Skip comment lines (but not category headers which we handled above)
        if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

        // Skip section headers
        if (trimmed.match(/^(Mainboard|Sideboard|Commander|Deck):/i)) continue;

        // Parse card line: "4 Card Name" or "4x Card Name" or "Card Name"
        const cardMatch = trimmed.match(/^(\d+)x?\s+(.+)$/) || trimmed.match(/^(.+)$/);
        if (cardMatch) {
            let quantity: number;
            let cardName: string;

            if (cardMatch[2]) {
                // Format: "4 Card Name" or "4x Card Name"
                quantity = parseInt(cardMatch[1]);
                cardName = cardMatch[2].trim();
            } else {
                // Format: "Card Name" (no quantity)
                quantity = 1;
                cardName = cardMatch[1].trim();
            }

            // Skip if card name is empty after trimming
            if (!cardName) continue;

            cards.push({
                name: cardName,
                quantity,
                category: currentCategory,
            });

            totalCards += quantity;

            // Update category count
            if (currentCategory) {
                const currentCount = cardsByCategory.get(currentCategory) || 0;
                cardsByCategory.set(currentCategory, currentCount + quantity);
            }
        }
    }

    return {
        totalCards,
        uniqueCards: cards.length,
        cardsByCategory,
        cards,
    };
}

/**
 * Formats the card count for display
 */
export function formatDeckCount(count: DeckCount): string {
    let output = `Total Cards: ${count.totalCards}\n`;
    output += `Unique Cards: ${count.uniqueCards}\n`;

    if (count.cardsByCategory.size > 0) {
        output += `\nCards by Category:\n`;
        for (const [category, cardCount] of count.cardsByCategory) {
            output += `  ${category}: ${cardCount}\n`;
        }
    }

    return output;
}

/**
 * Validates that category counts match their headers
 */
export function validateCategoryCounts(filePath: string): { valid: boolean; errors: string[] } {
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const errors: string[] = [];
    let currentCategory: string | undefined;
    let expectedCount: number | undefined;
    let actualCount = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Check for category header
        const categoryMatch = trimmed.match(/^##\s+(.+?)\s+\((\d+)\)$/);
        if (categoryMatch) {
            // Validate previous category if exists
            if (currentCategory && expectedCount !== undefined) {
                if (actualCount !== expectedCount) {
                    errors.push(
                        `${currentCategory}: expected ${expectedCount}, found ${actualCount}`
                    );
                }
            }

            // Start new category
            currentCategory = categoryMatch[1];
            expectedCount = parseInt(categoryMatch[2]);
            actualCount = 0;
            continue;
        }

        // Skip comments and section headers
        if (trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
        if (trimmed.match(/^(Mainboard|Sideboard|Commander|Deck):/i)) continue;

        // Count cards in current category
        const cardMatch = trimmed.match(/^(\d+)x?\s+(.+)$/) || trimmed.match(/^(.+)$/);
        if (cardMatch && currentCategory) {
            const quantity = cardMatch[2] ? parseInt(cardMatch[1]) : 1;
            actualCount += quantity;
        }
    }

    // Validate last category
    if (currentCategory && expectedCount !== undefined) {
        if (actualCount !== expectedCount) {
            errors.push(`${currentCategory}: expected ${expectedCount}, found ${actualCount}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Counts cards from command-line arguments
 * Supports formats: "4 Card Name", "4x Card Name", "Card Name"
 */
export function countCardsFromArgs(cardArgs: string[]): DeckCount {
    const cards: CardCount[] = [];
    let totalCards = 0;

    for (const arg of cardArgs) {
        const trimmed = arg.trim();
        if (!trimmed) continue;

        // Parse: "4 Card Name" or "4x Card Name" or "Card Name"
        const cardMatch = trimmed.match(/^(\d+)x?\s+(.+)$/) || trimmed.match(/^(.+)$/);
        if (cardMatch) {
            let quantity: number;
            let cardName: string;

            if (cardMatch[2]) {
                quantity = parseInt(cardMatch[1]);
                cardName = cardMatch[2].trim();
            } else {
                quantity = 1;
                cardName = cardMatch[1].trim();
            }

            if (cardName) {
                cards.push({ name: cardName, quantity });
                totalCards += quantity;
            }
        }
    }

    return {
        totalCards,
        uniqueCards: cards.length,
        cardsByCategory: new Map(),
        cards,
    };
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("Usage:");
        console.error("  Count from file:  ts-node card-counter.ts <deck-file> [--validate]");
        console.error(
            '  Count from args:  ts-node card-counter.ts "7 Plains" "11 Swamp" "1 Clavileño"'
        );
        console.error("");
        console.error("Examples:");
        console.error('  npm run count "4 Lightning Bolt" "20 Mountain"');
        console.error("  npx ts-node src/card-counter.ts decks/my-deck.md");
        process.exit(1);
    }

    // Check if first arg is a file path
    const firstArg = args[0];
    const isFilePath =
        firstArg.includes("/") || firstArg.includes("\\") || firstArg.endsWith(".md");

    if (isFilePath && fs.existsSync(firstArg)) {
        // File-based counting
        const filePath = firstArg;
        const validate = args.includes("--validate");

        const count = countCardsInFile(filePath);
        console.log(formatDeckCount(count));

        if (validate) {
            console.log("\nValidating category counts...");
            const validation = validateCategoryCounts(filePath);
            if (validation.valid) {
                console.log("✓ All category counts are correct");
            } else {
                console.log("✗ Found errors:");
                validation.errors.forEach((error) => console.log(`  - ${error}`));
            }
        }
    } else {
        // Args-based counting
        const count = countCardsFromArgs(args);
        console.log(formatDeckCount(count));

        // Show individual card breakdown
        if (count.cards.length > 0) {
            console.log("\nCard Breakdown:");
            for (const card of count.cards) {
                console.log(`  ${card.quantity}x ${card.name}`);
            }
        }
    }
}
