import * as fs from "fs";
import {
    countCardsFromArgs,
    countCardsInFile,
    countCardsInText,
    formatDeckCount,
    validateCategoryCounts,
} from "../card-counter";

jest.mock("fs");

describe("card-counter", () => {
    describe("countCardsInText", () => {
        it('should count cards with "4 Card Name" format', () => {
            const content = `4 Lightning Bolt\n3 Counterspell`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
            expect(result.cards).toHaveLength(2);
        });

        it('should count cards with "4x Card Name" format', () => {
            const content = `4x Lightning Bolt\n3x Counterspell`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
        });

        it("should count cards without quantity (defaults to 1)", () => {
            const content = `Lightning Bolt\nCounterspell`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(2);
            expect(result.uniqueCards).toBe(2);
        });

        it("should skip empty lines", () => {
            const content = `4 Lightning Bolt\n\n\n3 Counterspell`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
        });

        it("should skip comment lines starting with #", () => {
            const content = `# My Deck\n4 Lightning Bolt\n# Another comment\n3 Counterspell`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
        });

        it("should skip comment lines starting with //", () => {
            const content = `// My Deck\n4 Lightning Bolt\n// Another comment\n3 Counterspell`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
        });

        it("should skip section headers", () => {
            const content = `Mainboard:\n4 Lightning Bolt\nSideboard:\n3 Counterspell\nCommander:\n1 Sol Ring`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(8);
            expect(result.uniqueCards).toBe(3);
        });

        it("should parse category headers with counts", () => {
            const content = `## Ramp (10)\n4 Sol Ring\n6 Mana Vault\n\n## Draw (5)\n5 Rhystic Study`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(15);
            expect(result.uniqueCards).toBe(3);
            expect(result.cardsByCategory.get("Ramp")).toBe(10);
            expect(result.cardsByCategory.get("Draw")).toBe(5);
        });

        it("should parse category headers without counts", () => {
            const content = `## Ramp\n4 Sol Ring\n\n## Draw\n5 Rhystic Study`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(9);
            expect(result.uniqueCards).toBe(2);
        });

        it("should stop counting at Stats section", () => {
            const content = `4 Lightning Bolt\n\n## Stats\nTotal Cards: 4\nUnique Cards: 1`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(4);
            expect(result.uniqueCards).toBe(1);
        });

        it("should stop counting at Description section", () => {
            const content = `4 Lightning Bolt\n\n## Description\nThis is a description`;
            const result = countCardsInText(content);

            expect(result.totalCards).toBe(4);
            expect(result.uniqueCards).toBe(1);
        });

        it("should assign cards to current category", () => {
            const content = `## Ramp (4)\n4 Sol Ring\n## Draw (3)\n3 Rhystic Study`;
            const result = countCardsInText(content);

            expect(result.cards[0].category).toBe("Ramp");
            expect(result.cards[0].name).toBe("Sol Ring");
            expect(result.cards[1].category).toBe("Draw");
            expect(result.cards[1].name).toBe("Rhystic Study");
        });

        it("should handle mixed formats", () => {
            const content = `# My Deck
## Ramp (5)
4 Sol Ring
1x Mana Crypt

## Other
Mainboard:
3 Lightning Bolt

## Draw (2)
2 Ancestral Recall`;

            const result = countCardsInText(content);

            expect(result.totalCards).toBe(10);
            expect(result.uniqueCards).toBe(4);
            expect(result.cardsByCategory.get("Ramp")).toBe(5);
            expect(result.cardsByCategory.get("Draw")).toBe(2);
        });

        it("should handle empty content", () => {
            const result = countCardsInText("");

            expect(result.totalCards).toBe(0);
            expect(result.uniqueCards).toBe(0);
            expect(result.cards).toHaveLength(0);
        });
    });

    describe("countCardsInFile", () => {
        it("should read file and count cards", () => {
            const mockContent = `4 Lightning Bolt\n3 Counterspell`;
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

            const result = countCardsInFile("/path/to/deck.txt");

            expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/deck.txt", "utf-8");
            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
        });
    });

    describe("countCardsFromArgs", () => {
        it("should count cards from array of strings", () => {
            const args = ["4 Lightning Bolt", "3x Counterspell", "Sol Ring"];
            const result = countCardsFromArgs(args);

            expect(result.totalCards).toBe(8);
            expect(result.uniqueCards).toBe(3);
            expect(result.cards[0]).toEqual({ name: "Lightning Bolt", quantity: 4 });
            expect(result.cards[1]).toEqual({ name: "Counterspell", quantity: 3 });
            expect(result.cards[2]).toEqual({ name: "Sol Ring", quantity: 1 });
        });

        it("should handle empty array", () => {
            const result = countCardsFromArgs([]);

            expect(result.totalCards).toBe(0);
            expect(result.uniqueCards).toBe(0);
        });

        it("should skip empty strings", () => {
            const args = ["4 Lightning Bolt", "", "   ", "3 Counterspell"];
            const result = countCardsFromArgs(args);

            expect(result.totalCards).toBe(7);
            expect(result.uniqueCards).toBe(2);
        });
    });

    describe("formatDeckCount", () => {
        it("should format basic deck count", () => {
            const count = {
                totalCards: 60,
                uniqueCards: 20,
                cardsByCategory: new Map(),
                cards: [],
            };

            const result = formatDeckCount(count);

            expect(result).toContain("Total Cards: 60");
            expect(result).toContain("Unique Cards: 20");
        });

        it("should format deck count with categories", () => {
            const count = {
                totalCards: 60,
                uniqueCards: 20,
                cardsByCategory: new Map([
                    ["Ramp", 10],
                    ["Draw", 8],
                    ["Removal", 12],
                ]),
                cards: [],
            };

            const result = formatDeckCount(count);

            expect(result).toContain("Total Cards: 60");
            expect(result).toContain("Unique Cards: 20");
            expect(result).toContain("Cards by Category:");
            expect(result).toContain("Ramp: 10");
            expect(result).toContain("Draw: 8");
            expect(result).toContain("Removal: 12");
        });
    });

    describe("validateCategoryCounts", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it("should validate correct category counts", () => {
            const content = `## Ramp (4)
4 Sol Ring

## Draw (3)
3 Rhystic Study`;

            (fs.readFileSync as jest.Mock).mockReturnValue(content);

            const result = validateCategoryCounts("/path/to/deck.txt");

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it("should detect incorrect category counts", () => {
            const content = `## Ramp (5)
4 Sol Ring

## Draw (10)
3 Rhystic Study`;

            (fs.readFileSync as jest.Mock).mockReturnValue(content);

            const result = validateCategoryCounts("/path/to/deck.txt");

            expect(result.valid).toBe(false);
            expect(result.errors).toHaveLength(2);
            expect(result.errors[0]).toContain("Ramp: expected 5, found 4");
            expect(result.errors[1]).toContain("Draw: expected 10, found 3");
        });

        it("should validate multiple cards in category", () => {
            const content = `## Ramp (10)
4 Sol Ring
3 Mana Vault
2x Arcane Signet
1 Mana Crypt`;

            (fs.readFileSync as jest.Mock).mockReturnValue(content);

            const result = validateCategoryCounts("/path/to/deck.txt");

            expect(result.valid).toBe(true);
        });

        it("should skip comments and section headers", () => {
            const content = `## Ramp (4)
# This is a comment
// Another comment
Mainboard:
4 Sol Ring
Sideboard:`;

            (fs.readFileSync as jest.Mock).mockReturnValue(content);

            const result = validateCategoryCounts("/path/to/deck.txt");

            expect(result.valid).toBe(true);
        });

        it("should handle categories without count headers", () => {
            const content = `4 Sol Ring
3 Rhystic Study`;

            (fs.readFileSync as jest.Mock).mockReturnValue(content);

            const result = validateCategoryCounts("/path/to/deck.txt");

            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
    });
});
