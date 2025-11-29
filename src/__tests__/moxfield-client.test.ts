import * as fs from "fs";
import MoxfieldApi from "moxfield-api";
import { MoxfieldCache } from "../moxfield-cache";
import { MoxfieldClient } from "../moxfield-client";

jest.mock("moxfield-api");
jest.mock("fs");
jest.mock("../moxfield-cache");

const MockedMoxfieldApi = MoxfieldApi as jest.MockedClass<typeof MoxfieldApi>;
const MockedMoxfieldCache = MoxfieldCache as jest.MockedClass<typeof MoxfieldCache>;

describe("MoxfieldClient", () => {
    let client: MoxfieldClient;
    let mockCache: jest.Mocked<MoxfieldCache>;
    let mockFindById: jest.MockedFunction<any>;
    let consoleLogSpy: jest.SpyInstance;

    // fs mocks
    const mockMkdirSync = jest.mocked(fs.mkdirSync);
    const mockExistsSync = jest.mocked(fs.existsSync);
    const mockWriteFileSync = jest.mocked(fs.writeFileSync);

    const mockDeckResponse = {
        name: "Test Deck",
        format: "commander",
        boards: {
            commanders: {
                cards: {
                    commander1: {
                        quantity: 1,
                        card: {
                            name: "Sol Ring",
                            mana_cost: "{1}",
                            type_line: "Artifact",
                            cmc: 1,
                            oracle_text: "{T}: Add {C}{C}.",
                            colors: [],
                            color_identity: [],
                        },
                    },
                },
            },
            mainboard: {
                cards: {
                    card1: {
                        quantity: 4,
                        card: {
                            name: "Lightning Bolt",
                            mana_cost: "{R}",
                            type_line: "Instant",
                            cmc: 1,
                            oracle_text: "Lightning Bolt deals 3 damage to any target.",
                            colors: ["R"],
                            color_identity: ["R"],
                        },
                    },
                    card2: {
                        quantity: 3,
                        card: {
                            name: "Counterspell",
                            mana_cost: "{U}{U}",
                            type_line: "Instant",
                            cmc: 2,
                            oracle_text: "Counter target spell.",
                            colors: ["U"],
                            color_identity: ["U"],
                        },
                    },
                },
            },
            sideboard: {
                cards: {
                    card3: {
                        quantity: 2,
                        card: {
                            name: "Rest in Peace",
                            mana_cost: "{1}{W}",
                            type_line: "Enchantment",
                            cmc: 2,
                            oracle_text:
                                "When Rest in Peace enters the battlefield, exile all cards from all graveyards. If a card or token would be put into a graveyard from anywhere, exile it instead.",
                            colors: ["W"],
                            color_identity: ["W"],
                        },
                    },
                },
            },
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation();

        // Create mock cache instance
        mockCache = {
            shouldFetch: jest.fn().mockReturnValue(true),
            updateCache: jest.fn(),
            getMetadata: jest.fn().mockReturnValue(undefined),
            getTimeUntilExpiry: jest.fn().mockReturnValue(null),
        } as any;

        // Create a mock function for findById
        mockFindById = jest.fn();

        // Mock the constructors
        MockedMoxfieldCache.mockImplementation(() => mockCache);
        MockedMoxfieldApi.mockImplementation(
            () =>
                ({
                    deckList: {
                        findById: mockFindById,
                    },
                }) as any
        );

        client = new MoxfieldClient();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe("getDeck", () => {
        it("should fetch deck from Moxfield API", async () => {
            mockFindById.mockResolvedValueOnce(mockDeckResponse);

            const result = await client.getDeck("abc123");

            expect(mockFindById).toHaveBeenCalledWith("abc123");
            expect(result).toEqual(mockDeckResponse);
        });

        it("should throw error for 404 not found", async () => {
            mockFindById.mockRejectedValueOnce(new Error("404 not found"));

            await expect(client.getDeck("nonexistent")).rejects.toThrow(
                "Deck not found: nonexistent. Make sure the deck is public."
            );
        });

        it("should throw error for 403 forbidden", async () => {
            mockFindById.mockRejectedValueOnce(new Error("403 forbidden"));

            await expect(client.getDeck("forbidden")).rejects.toThrow(
                "Access forbidden: forbidden. Moxfield API may be temporarily blocked by Cloudflare or require authentication. Try again later."
            );
        });

        it("should throw generic error for other failures", async () => {
            mockFindById.mockRejectedValueOnce(new Error("Network error"));

            await expect(client.getDeck("error")).rejects.toThrow(
                "Failed to fetch deck from Moxfield: Network error"
            );
        });
    });

    describe("saveDeckToFile", () => {
        it("should save deck to file with commanders and mainboard", async () => {
            mockFindById.mockResolvedValueOnce(mockDeckResponse);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/commander/test-deck");
            expect(mockMkdirSync).toHaveBeenCalledWith("decks/commander/test-deck", {
                recursive: true,
            });
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                "decks/commander/test-deck/moxfield.txt",
                expect.stringContaining("# Test Deck")
            );
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                "decks/commander/test-deck/moxfield.txt",
                expect.stringContaining("# Commander (1)")
            );
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                "decks/commander/test-deck/moxfield.txt",
                expect.stringContaining("1 Sol Ring")
            );
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                "decks/commander/test-deck/moxfield.txt",
                expect.stringContaining("# Mainboard (7)")
            );
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                "decks/commander/test-deck/moxfield.txt",
                expect.stringContaining("4 Lightning Bolt")
            );
        });

        it("should use custom deck name when provided", async () => {
            mockFindById.mockResolvedValueOnce(mockDeckResponse);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123", "custom-name");

            expect(result).toBe("decks/commander/custom-name");
            expect(mockMkdirSync).toHaveBeenCalledWith("decks/commander/custom-name", {
                recursive: true,
            });
            expect(mockWriteFileSync).toHaveBeenCalledWith(
                "decks/commander/custom-name/moxfield.txt",
                expect.stringContaining("# Test Deck")
            );
        });

        it("should use cache when not forcing refresh", async () => {
            mockCache.shouldFetch.mockReturnValue(false);
            mockCache.getMetadata.mockReturnValue({
                lastFetched: new Date(Date.now() - 1000).toISOString(),
                deckId: "abc123",
                filePath: "test-path",
            });
            mockCache.getTimeUntilExpiry.mockReturnValue(300000); // 5 minutes
            mockFindById.mockResolvedValueOnce(mockDeckResponse);

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/commander/test-deck");
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("📦 Using cached deck")
            );
        });

        it("should organize different formats correctly", async () => {
            const modernDeck = { ...mockDeckResponse, format: "modern" };
            mockFindById.mockResolvedValueOnce(modernDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/modern/test-deck");
        });
    });

    describe("extractDeckId", () => {
        it("should extract ID from full URL", () => {
            const url = "https://www.moxfield.com/decks/abc123xyz";
            const result = MoxfieldClient.extractDeckId(url);
            expect(result).toBe("abc123xyz");
        });

        it("should extract ID from URL without protocol", () => {
            const url = "moxfield.com/decks/abc123xyz";
            const result = MoxfieldClient.extractDeckId(url);
            expect(result).toBe("abc123xyz");
        });

        it("should return ID if already just an ID", () => {
            const id = "abc123xyz";
            const result = MoxfieldClient.extractDeckId(id);
            expect(result).toBe("abc123xyz");
        });

        it("should throw error for invalid URL", () => {
            expect(() => MoxfieldClient.extractDeckId("https://invalid-url.com/something")).toThrow(
                "Invalid Moxfield URL or deck ID"
            );
        });
    });

    describe("getFormatDirectory", () => {
        it("should map standard format correctly", async () => {
            const standardDeck = { ...mockDeckResponse, format: "standard" };
            mockFindById.mockResolvedValueOnce(standardDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");
            expect(result).toBe("decks/standard/test-deck");
        });

        it("should map modern format correctly", async () => {
            const modernDeck = { ...mockDeckResponse, format: "modern" };
            mockFindById.mockResolvedValueOnce(modernDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");
            expect(result).toBe("decks/modern/test-deck");
        });

        it("should map commander format correctly", async () => {
            const commanderDeck = { ...mockDeckResponse, format: "commander" };
            mockFindById.mockResolvedValueOnce(commanderDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");
            expect(result).toBe("decks/commander/test-deck");
        });

        it("should map unknown formats to other", async () => {
            const otherDeck = { ...mockDeckResponse, format: "pioneer" };
            mockFindById.mockResolvedValueOnce(otherDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");
            expect(result).toBe("decks/other/test-deck");
        });
    });

    describe("sanitizeFileName", () => {
        it("should handle deck names with special characters", async () => {
            const specialDeck = { ...mockDeckResponse, name: "Test Deck! @#$% & More" };
            mockFindById.mockResolvedValueOnce(specialDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");
            expect(result).toBe("decks/commander/test-deck-more");
        });

        it("should handle very long deck names", async () => {
            const longName = "A".repeat(100);
            const longDeck = { ...mockDeckResponse, name: longName };
            mockFindById.mockResolvedValueOnce(longDeck);
            mockExistsSync.mockReturnValue(false);

            const result = await client.saveDeckToFile("abc123");
            expect(result).toContain("decks/commander/");
            expect(result.length).toBeLessThan(100); // Should be truncated
        });
    });
});
