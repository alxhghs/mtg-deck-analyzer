import * as fs from "fs";
import { DeckParser } from "../deck-parser";
import { Deck } from "../types";

jest.mock("fs");

describe("DeckParser", () => {
    describe("parseDecklistContent", () => {
        it('should parse cards with quantity format "4 Card Name"', () => {
            const content = `4 Lightning Bolt\n3 Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.cards[0]).toEqual({ quantity: 4, name: "Lightning Bolt" });
            expect(result.cards[1]).toEqual({ quantity: 3, name: "Counterspell" });
            expect(result.totalCards).toBe(7);
        });

        it('should parse cards with quantity format "4x Card Name"', () => {
            const content = `4x Lightning Bolt\n3x Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.cards[0]).toEqual({ quantity: 4, name: "Lightning Bolt" });
            expect(result.cards[1]).toEqual({ quantity: 3, name: "Counterspell" });
            expect(result.totalCards).toBe(7);
        });

        it("should parse cards without quantity (defaults to 1)", () => {
            const content = `Lightning Bolt\nCounterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.cards[0]).toEqual({ quantity: 1, name: "Lightning Bolt" });
            expect(result.cards[1]).toEqual({ quantity: 1, name: "Counterspell" });
            expect(result.totalCards).toBe(2);
        });

        it("should skip empty lines", () => {
            const content = `4 Lightning Bolt\n\n\n3 Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.totalCards).toBe(7);
        });

        it("should skip comment lines starting with #", () => {
            const content = `# This is a comment\n4 Lightning Bolt\n# Another comment\n3 Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.totalCards).toBe(7);
        });

        it("should skip comment lines starting with //", () => {
            const content = `// This is a comment\n4 Lightning Bolt\n// Another comment\n3 Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.totalCards).toBe(7);
        });

        it("should skip section headers ending with :", () => {
            const content = `Mainboard:\n4 Lightning Bolt\nSideboard:\n3 Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.totalCards).toBe(7);
        });

        it("should handle mixed format decklist", () => {
            const content = `# My Deck
Mainboard:
4 Lightning Bolt
3x Counterspell
Sol Ring

// Sideboard
Sideboard:
2 Rest in Peace`;

            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(4);
            expect(result.cards[0]).toEqual({ quantity: 4, name: "Lightning Bolt" });
            expect(result.cards[1]).toEqual({ quantity: 3, name: "Counterspell" });
            expect(result.cards[2]).toEqual({ quantity: 1, name: "Sol Ring" });
            expect(result.cards[3]).toEqual({ quantity: 2, name: "Rest in Peace" });
            expect(result.totalCards).toBe(10);
        });

        it("should handle card names with special characters", () => {
            const content = `4 Jace, the Mind Sculptor\n1 Karn Liberated`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(2);
            expect(result.cards[0]).toEqual({ quantity: 4, name: "Jace, the Mind Sculptor" });
            expect(result.cards[1]).toEqual({ quantity: 1, name: "Karn Liberated" });
        });

        it("should handle empty content", () => {
            const content = ``;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards).toHaveLength(0);
            expect(result.totalCards).toBe(0);
        });

        it("should trim whitespace from card names", () => {
            const content = `4  Lightning Bolt  \n  3 Counterspell`;
            const result = DeckParser.parseDecklistContent(content);

            expect(result.cards[0]).toEqual({ quantity: 4, name: "Lightning Bolt" });
            expect(result.cards[1]).toEqual({ quantity: 3, name: "Counterspell" });
        });
    });

    describe("parseDecklist", () => {
        it("should read file and parse content", () => {
            const mockContent = `4 Lightning Bolt\n3 Counterspell`;
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

            const result = DeckParser.parseDecklist("/path/to/deck.txt");

            expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/deck.txt", "utf-8");
            expect(result.cards).toHaveLength(2);
            expect(result.totalCards).toBe(7);
        });
    });

    describe("getUniqueCardNames", () => {
        it("should return array of unique card names", () => {
            const deck: Deck = {
                cards: [
                    { quantity: 4, name: "Lightning Bolt" },
                    { quantity: 3, name: "Counterspell" },
                    { quantity: 1, name: "Sol Ring" },
                ],
                totalCards: 8,
            };

            const result = DeckParser.getUniqueCardNames(deck);

            expect(result).toEqual(["Lightning Bolt", "Counterspell", "Sol Ring"]);
        });

        it("should return empty array for empty deck", () => {
            const deck: Deck = { cards: [], totalCards: 0 };
            const result = DeckParser.getUniqueCardNames(deck);

            expect(result).toEqual([]);
        });
    });

    describe("exportDeck", () => {
        it("should format deck as string", () => {
            const deck: Deck = {
                cards: [
                    { quantity: 4, name: "Lightning Bolt" },
                    { quantity: 3, name: "Counterspell" },
                ],
                totalCards: 7,
            };

            const result = DeckParser.exportDeck(deck);

            expect(result).toBe("Total Cards: 7\n\n4 Lightning Bolt\n3 Counterspell\n");
        });

        it("should handle empty deck", () => {
            const deck: Deck = { cards: [], totalCards: 0 };
            const result = DeckParser.exportDeck(deck);

            expect(result).toBe("Total Cards: 0\n\n");
        });
    });
});
