import { DeckAnalyzer } from "../deck-analyzer";
import { Card, Deck } from "../types";

describe("DeckAnalyzer", () => {
    let mockCards: Map<string, Card>;
    let mockDeck: Deck;

    beforeEach(() => {
        mockCards = new Map<string, Card>();

        // Add some mock cards
        mockCards.set("Lightning Bolt", {
            id: "1",
            name: "Lightning Bolt",
            mana_cost: "{R}",
            cmc: 1,
            type_line: "Instant",
            oracle_text: "Lightning Bolt deals 3 damage to any target.",
            colors: ["R"],
            color_identity: ["R"],
            set: "LEA",
            rarity: "common",
        });

        mockCards.set("Counterspell", {
            id: "2",
            name: "Counterspell",
            mana_cost: "{U}{U}",
            cmc: 2,
            type_line: "Instant",
            oracle_text: "Counter target spell.",
            colors: ["U"],
            color_identity: ["U"],
            set: "LEA",
            rarity: "uncommon",
        });

        mockCards.set("Sol Ring", {
            id: "3",
            name: "Sol Ring",
            mana_cost: "{1}",
            cmc: 1,
            type_line: "Artifact",
            oracle_text: "{T}: Add {C}{C}.",
            colors: [],
            color_identity: [],
            set: "LEA",
            rarity: "uncommon",
        });

        mockCards.set("Grizzly Bears", {
            id: "4",
            name: "Grizzly Bears",
            mana_cost: "{1}{G}",
            cmc: 2,
            type_line: "Creature — Bear",
            oracle_text: "",
            colors: ["G"],
            color_identity: ["G"],
            set: "LEA",
            rarity: "common",
        });

        mockCards.set("Forest", {
            id: "5",
            name: "Forest",
            mana_cost: "",
            cmc: 0,
            type_line: "Basic Land — Forest",
            oracle_text: "{T}: Add {G}.",
            colors: [],
            color_identity: ["G"],
            set: "LEA",
            rarity: "common",
        });

        mockCards.set("Jace, the Mind Sculptor", {
            id: "6",
            name: "Jace, the Mind Sculptor",
            mana_cost: "{2}{U}{U}",
            cmc: 4,
            type_line: "Legendary Planeswalker — Jace",
            oracle_text: "+2: Look at the top card of target player's library.",
            colors: ["U"],
            color_identity: ["U"],
            set: "WWK",
            rarity: "mythic",
        });

        mockCards.set("Llanowar Elves", {
            id: "7",
            name: "Llanowar Elves",
            mana_cost: "{G}",
            cmc: 1,
            type_line: "Creature — Elf Druid",
            oracle_text: "{T}: Add {G}.",
            colors: ["G"],
            color_identity: ["G"],
            set: "M19",
            rarity: "common",
        });

        mockCards.set("Fireball", {
            id: "8",
            name: "Fireball",
            mana_cost: "{X}{R}",
            cmc: 1,
            type_line: "Sorcery",
            oracle_text: "Fireball deals X damage divided evenly.",
            colors: ["R"],
            color_identity: ["R"],
            set: "LEA",
            rarity: "common",
        });

        mockDeck = {
            cards: [
                { name: "Lightning Bolt", quantity: 4 },
                { name: "Counterspell", quantity: 3 },
                { name: "Sol Ring", quantity: 1 },
                { name: "Grizzly Bears", quantity: 4 },
                { name: "Forest", quantity: 10 },
                { name: "Jace, the Mind Sculptor", quantity: 2 },
                { name: "Llanowar Elves", quantity: 4 },
                { name: "Fireball", quantity: 2 },
            ],
            totalCards: 30,
        };
    });

    describe("analyze", () => {
        it("should return complete analysis string", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("DECK ANALYSIS");
            expect(analysis).toContain("Total Cards: 30");
            expect(analysis).toContain("Color Distribution");
            expect(analysis).toContain("Mana Curve");
            expect(analysis).toContain("Card Types");
            expect(analysis).toContain("Average CMC");
        });

        it("should calculate correct basic stats", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Total Cards: 30");
            expect(analysis).toContain("Unique Cards: 8");
        });

        it("should calculate color distribution correctly", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Red:");
            expect(analysis).toContain("Blue:");
            expect(analysis).toContain("Green:");
            expect(analysis).toContain("Colorless:");
        });

        it("should display mana curve", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Mana Curve:");
            expect(analysis).toMatch(/0:.*10/); // 10 lands at CMC 0
            expect(analysis).toMatch(/1:.*11/); // Lightning Bolt (4) + Sol Ring (1) + Llanowar Elves (4) + Fireball (2)
        });

        it("should calculate type distribution", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Card Types:");
            expect(analysis).toContain("Creature:");
            expect(analysis).toContain("Instant:");
            expect(analysis).toContain("Artifact:");
            expect(analysis).toContain("Land:");
            expect(analysis).toContain("Planeswalker:");
            expect(analysis).toContain("Sorcery:");
        });

        it("should calculate average CMC excluding lands", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Average CMC (non-land):");
            // (4*1 + 3*2 + 1*1 + 4*2 + 2*4 + 4*1 + 2*1) / 20 = 33/20 = 1.65
            expect(analysis).toContain("1.65");
        });
    });

    describe("displayDeckList", () => {
        it("should display complete deck list with card details", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const deckList = analyzer.displayDeckList();

            expect(deckList).toContain("DECK LIST");
            expect(deckList).toContain("4x Lightning Bolt");
            expect(deckList).toContain("3x Counterspell");
            expect(deckList).toContain("1x Sol Ring");
        });

        it("should include card type and mana cost", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const deckList = analyzer.displayDeckList();

            expect(deckList).toContain("Instant");
            expect(deckList).toContain("{R}");
            expect(deckList).toContain("{U}{U}");
        });

        it("should include oracle text preview", () => {
            const analyzer = new DeckAnalyzer(mockDeck, mockCards);
            const deckList = analyzer.displayDeckList();

            expect(deckList).toContain("Lightning Bolt deals 3 damage");
            expect(deckList).toContain("Counter target spell");
        });

        it("should truncate long oracle text", () => {
            const longTextCard: Card = {
                id: "99",
                name: "Long Card",
                cmc: 3,
                type_line: "Enchantment",
                oracle_text:
                    "This is a very long oracle text that exceeds eighty characters and should be truncated with ellipsis at the end",
                set: "TST",
                rarity: "rare",
            };

            const cards = new Map<string, Card>();
            cards.set("Long Card", longTextCard);

            const deck: Deck = {
                cards: [{ name: "Long Card", quantity: 1 }],
                totalCards: 1,
            };

            const analyzer = new DeckAnalyzer(deck, cards);
            const deckList = analyzer.displayDeckList();

            expect(deckList).toContain("...");
        });

        it("should handle cards not found in cache", () => {
            const deck: Deck = {
                cards: [{ name: "Unknown Card", quantity: 1 }],
                totalCards: 1,
            };

            const analyzer = new DeckAnalyzer(deck, new Map());
            const deckList = analyzer.displayDeckList();

            expect(deckList).toContain("Unknown Card (Card data not found)");
        });
    });

    describe("edge cases", () => {
        it("should handle empty deck", () => {
            const emptyDeck: Deck = { cards: [], totalCards: 0 };
            const analyzer = new DeckAnalyzer(emptyDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Total Cards: 0");
            expect(analysis).toContain("Unique Cards: 0");
        });

        it("should handle deck with only colorless cards", () => {
            const colorlessDeck: Deck = {
                cards: [{ name: "Sol Ring", quantity: 10 }],
                totalCards: 10,
            };

            const analyzer = new DeckAnalyzer(colorlessDeck, mockCards);
            const analysis = analyzer.analyze();

            expect(analysis).toContain("Colorless: 10");
        });

        it("should handle cards with CMC above 7", () => {
            const expensiveCard: Card = {
                id: "100",
                name: "Emrakul",
                mana_cost: "{15}",
                cmc: 15,
                type_line: "Legendary Creature — Eldrazi",
                oracle_text: "This costs a lot of mana.",
                colors: [],
                color_identity: [],
                set: "ROE",
                rarity: "mythic",
            };

            const cards = new Map<string, Card>();
            cards.set("Emrakul", expensiveCard);

            const deck: Deck = {
                cards: [{ name: "Emrakul", quantity: 1 }],
                totalCards: 1,
            };

            const analyzer = new DeckAnalyzer(deck, cards);
            const analysis = analyzer.analyze();

            // Should cap at 7+
            expect(analysis).toMatch(/7\+:.*1/);
        });
    });
});
