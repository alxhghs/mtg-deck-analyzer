import * as fs from "fs";
import { Deck, DeckCard } from "./types";

export class DeckParser {
    /**
     * Parse a decklist file
     * Supports common formats:
     * - "4 Lightning Bolt"
     * - "4x Lightning Bolt"
     * - "Lightning Bolt" (defaults to 1)
     */
    static parseDecklist(filePath: string): Deck {
        const content = fs.readFileSync(filePath, "utf-8");
        return this.parseDecklistContent(content);
    }

    /**
     * Parse decklist content from a string
     */
    static parseDecklistContent(content: string): Deck {
        const lines = content.split("\n");
        const cards: DeckCard[] = [];
        let totalCards = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) {
                continue;
            }

            // Skip section headers (e.g., "Mainboard:", "Sideboard:")
            if (trimmed.endsWith(":")) {
                continue;
            }

            const deckCard = this.parseLine(trimmed);
            if (deckCard) {
                cards.push(deckCard);
                totalCards += deckCard.quantity;
            }
        }

        return { cards, totalCards };
    }

    /**
     * Parse a single line from a decklist
     */
    private static parseLine(line: string): DeckCard | null {
        // Pattern 1: "4 Lightning Bolt" or "4x Lightning Bolt"
        const match1 = line.match(/^(\d+)x?\s+(.+)$/);
        if (match1) {
            return {
                quantity: parseInt(match1[1], 10),
                name: match1[2].trim(),
            };
        }

        // Pattern 2: Just the card name (default to 1)
        // Accept any non-empty string that doesn't start with only digits
        // This allows card names starting with numbers like "8.5 Tails" or special chars like "Æther Vial"
        const match2 = line.match(/^(.+)$/);
        if (match2) {
            const name = match2[1].trim();
            // Make sure it's not just a number (which would be invalid)
            if (name && !/^\d+$/.test(name)) {
                return {
                    quantity: 1,
                    name: name,
                };
            }
        }

        return null;
    }

    /**
     * Get unique card names from a deck
     */
    static getUniqueCardNames(deck: Deck): string[] {
        return deck.cards.map((card) => card.name);
    }

    /**
     * Export deck to a formatted string
     */
    static exportDeck(deck: Deck): string {
        let output = `Total Cards: ${deck.totalCards}\n\n`;

        deck.cards.forEach((card) => {
            output += `${card.quantity} ${card.name}\n`;
        });

        return output;
    }
}
