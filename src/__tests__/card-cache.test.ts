import * as fs from "fs";
import { CardCache } from "../card-cache";
import { Card } from "../types";

jest.mock("fs");

describe("CardCache", () => {
    const mockCard: Card = {
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
    };

    const mockCacheData = {
        "Lightning Bolt": {
            card: {
                name: "Lightning Bolt",
                mana_cost: "{R}",
                cmc: 1,
                type_line: "Instant",
                oracle_text: "Lightning Bolt deals 3 damage to any target.",
                colors: ["R"],
                color_identity: ["R"],
            },
            cachedAt: "2025-11-27T10:00:00.000Z",
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation();
        jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should create cache with custom path", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            expect(fs.existsSync).toHaveBeenCalledWith("/path/to");
        });

        it("should create cache with default path", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache();

            expect(fs.existsSync).toHaveBeenCalledWith("./cache");
        });

        it("should load existing cache file", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new CardCache("/path/to/cache.json");

            expect(fs.readFileSync).toHaveBeenCalledWith("/path/to/cache.json", "utf-8");
            expect(console.log).toHaveBeenCalledWith("Loaded 1 cards from cache");
        });

        it("should create cache directory if it does not exist", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            new CardCache("/path/to/cache.json");

            expect(fs.mkdirSync).toHaveBeenCalledWith("/path/to", { recursive: true });
        });

        it("should handle errors when loading cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error("Read error");
            });

            new CardCache("/path/to/cache.json");

            expect(console.error).toHaveBeenCalledWith("Error loading cache:", expect.any(Error));
        });
    });

    describe("get", () => {
        it("should return card if exists in cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new CardCache("/path/to/cache.json");
            const card = cache.get("Lightning Bolt");

            expect(card).toBeDefined();
            expect(card?.name).toBe("Lightning Bolt");
        });

        it("should return null if card does not exist", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            const card = cache.get("Nonexistent Card");

            expect(card).toBeNull();
        });
    });

    describe("has", () => {
        it("should return true if card exists in cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new CardCache("/path/to/cache.json");

            expect(cache.has("Lightning Bolt")).toBe(true);
        });

        it("should return false if card does not exist", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            expect(cache.has("Nonexistent Card")).toBe(false);
        });
    });

    describe("set", () => {
        it("should add card to cache and save", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            cache.set("Lightning Bolt", mockCard);

            expect(cache.has("Lightning Bolt")).toBe(true);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith("Saved 1 cards to cache");
        });

        it("should update existing card in cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            const updatedCard = { ...mockCard, oracle_text: "Updated text" };
            cache.set("Lightning Bolt", updatedCard);

            const retrieved = cache.get("Lightning Bolt");
            expect(retrieved?.oracle_text).toBe("Updated text");
        });
    });

    describe("setMany", () => {
        it("should add multiple cards to cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            const cards = new Map<string, Card>();
            cards.set("Lightning Bolt", mockCard);
            cards.set("Counterspell", {
                ...mockCard,
                id: "2",
                name: "Counterspell",
                mana_cost: "{U}{U}",
                cmc: 2,
            });

            cache.setMany(cards);

            expect(cache.has("Lightning Bolt")).toBe(true);
            expect(cache.has("Counterspell")).toBe(true);
            expect(console.log).toHaveBeenCalledWith("Saved 2 cards to cache");
        });

        it("should save only once for multiple cards", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            const cards = new Map<string, Card>();
            cards.set("Card1", mockCard);
            cards.set("Card2", mockCard);

            cache.setMany(cards);

            // Should only call writeFileSync once
            expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        });
    });

    describe("clear", () => {
        it("should clear cache and delete file", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));
            (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            cache.clear();

            expect(cache.has("Lightning Bolt")).toBe(false);
            expect(fs.unlinkSync).toHaveBeenCalledWith("/path/to/cache.json");
            expect(console.log).toHaveBeenCalledWith("Cache cleared");
        });

        it("should not throw if cache file does not exist", () => {
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(false) // Initial check in constructor
                .mockReturnValueOnce(false); // Check in clear()
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            expect(() => cache.clear()).not.toThrow();
        });
    });

    describe("getStats", () => {
        it("should return stats for empty cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            const stats = cache.getStats();

            expect(stats).toEqual({
                size: 0,
                oldestEntry: null,
                newestEntry: null,
            });
        });

        it("should return stats with timestamps", () => {
            const cacheWithDates = {
                Card1: {
                    card: mockCard,
                    cachedAt: "2025-11-27T09:00:00.000Z",
                },
                Card2: {
                    card: mockCard,
                    cachedAt: "2025-11-27T11:00:00.000Z",
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(cacheWithDates));

            const cache = new CardCache("/path/to/cache.json");
            const stats = cache.getStats();

            expect(stats.size).toBe(2);
            expect(stats.oldestEntry).toBe("2025-11-27T09:00:00.000Z");
            expect(stats.newestEntry).toBe("2025-11-27T11:00:00.000Z");
        });
    });

    describe("minimal storage format", () => {
        it("should save only essential card fields", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            let savedData: string = "";
            (fs.writeFileSync as jest.Mock).mockImplementation((path, data) => {
                savedData = data;
            });

            const cache = new CardCache("/path/to/cache.json");
            cache.set("Lightning Bolt", mockCard);

            const parsed = JSON.parse(savedData);
            const savedCard = parsed["Lightning Bolt"].card;

            // Should have minimal fields
            expect(savedCard).toHaveProperty("name");
            expect(savedCard).toHaveProperty("mana_cost");
            expect(savedCard).toHaveProperty("cmc");
            expect(savedCard).toHaveProperty("type_line");
            expect(savedCard).toHaveProperty("oracle_text");
            expect(savedCard).toHaveProperty("colors");
            expect(savedCard).toHaveProperty("color_identity");

            // Should not have extra fields
            expect(savedCard).not.toHaveProperty("id");
            expect(savedCard).not.toHaveProperty("set");
            expect(savedCard).not.toHaveProperty("rarity");
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle corrupted cache file gracefully", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue("{ invalid json");

            expect(() => new CardCache("/path/to/cache.json")).not.toThrow();
            expect(console.error).toHaveBeenCalledWith("Error loading cache:", expect.any(Error));
        });

        it("should handle empty cache file", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue("{}");

            const cache = new CardCache("/path/to/cache.json");
            const stats = cache.getStats();

            expect(stats.size).toBe(0);
        });

        it("should handle cache with undefined values", () => {
            const cacheWithUndefined = {
                Card1: {
                    card: mockCard,
                    cachedAt: "2025-11-27T10:00:00.000Z",
                },
                Card2: undefined,
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(cacheWithUndefined));

            const cache = new CardCache("/path/to/cache.json");

            expect(cache.has("Card1")).toBe(true);
            expect(cache.has("Card2")).toBe(false);
        });

        it("should handle card with missing optional fields", () => {
            const minimalCard: Card = {
                id: "1",
                name: "Test Card",
                cmc: 1,
                type_line: "Instant",
                set: "TST",
                rarity: "common",
            };

            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            cache.set("Test Card", minimalCard);

            const retrieved = cache.get("Test Card");
            expect(retrieved?.name).toBe("Test Card");
        });

        it("should handle multiple set operations", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");

            cache.set("Card1", mockCard);
            cache.set("Card2", mockCard);
            cache.set("Card3", mockCard);

            expect(fs.writeFileSync).toHaveBeenCalledTimes(3);
        });

        it("should handle setMany with empty map", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            const emptyMap = new Map<string, Card>();

            cache.setMany(emptyMap);

            expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
        });

        it("should preserve cachedAt timestamp for existing cards", () => {
            const oldTimestamp = "2025-11-27T09:00:00.000Z";
            const mockCacheData = {
                "Lightning Bolt": {
                    card: mockCard,
                    cachedAt: oldTimestamp,
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new CardCache("/path/to/cache.json");
            const stats = cache.getStats();

            expect(stats.oldestEntry).toBe(oldTimestamp);
        });

        it("should handle card names with special characters in cache", () => {
            const specialCard: Card = {
                ...mockCard,
                name: "Lim-Dûl's Vault",
            };

            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            cache.set("Lim-Dûl's Vault", specialCard);

            expect(cache.has("Lim-Dûl's Vault")).toBe(true);
        });

        it("should handle getStats with single card", () => {
            const mockCacheData = {
                Card1: {
                    card: mockCard,
                    cachedAt: "2025-11-27T10:00:00.000Z",
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new CardCache("/path/to/cache.json");
            const stats = cache.getStats();

            expect(stats.size).toBe(1);
            expect(stats.oldestEntry).toBe(stats.newestEntry);
        });

        it("should handle clear when cache is already empty", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new CardCache("/path/to/cache.json");
            cache.clear();

            expect(cache.has("anything")).toBe(false);
        });
    });
});
