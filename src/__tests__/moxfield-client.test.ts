import axios from "axios";
import * as fs from "fs";
import { MoxfieldCache } from "../moxfield-cache";
import { MoxfieldClient } from "../moxfield-client";

jest.mock("axios");
jest.mock("fs");
jest.mock("../moxfield-cache");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedMoxfieldCache = MoxfieldCache as jest.MockedClass<typeof MoxfieldCache>;

describe("MoxfieldClient", () => {
    let client: MoxfieldClient;
    let mockCache: jest.Mocked<MoxfieldCache>;
    let consoleLogSpy: jest.SpyInstance;

    const mockDeckResponse = {
        name: "Test Deck",
        format: "commander",
        main: {
            name: "Sol Ring",
        },
        boards: {
            mainboard: {
                count: 98,
                cards: {
                    card1: {
                        quantity: 4,
                        card: { name: "Lightning Bolt" },
                    },
                    card2: {
                        quantity: 3,
                        card: { name: "Counterspell" },
                    },
                },
            },
            sideboard: {
                count: 2,
                cards: {
                    card3: {
                        quantity: 2,
                        card: { name: "Rest in Peace" },
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

        // Mock the constructor to return our mock
        MockedMoxfieldCache.mockImplementation(() => mockCache);

        client = new MoxfieldClient();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe("getDeck", () => {
        it("should fetch deck from Moxfield API", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            const result = await client.getDeck("abc123");

            expect(mockedAxios.get).toHaveBeenCalledWith(
                "https://api2.moxfield.com/v3/decks/all/abc123"
            );
            expect(result).toEqual(mockDeckResponse);
        });

        it("should throw error for 404 not found", async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 404 },
            });

            await expect(client.getDeck("notfound")).rejects.toThrow(
                "Deck not found: notfound. Make sure the deck is public."
            );
        });

        it("should throw error for other errors", async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error("Network error"));

            await expect(client.getDeck("abc123")).rejects.toThrow(
                "Failed to fetch deck from Moxfield: Network error"
            );
        });
    });

    describe("saveDeckToFile", () => {
        beforeEach(() => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
            mockCache.shouldFetch = jest.fn().mockReturnValue(true);
            mockCache.updateCache = jest.fn();
        });

        it("should save commander deck to correct path", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/commander/test-deck");
            expect(fs.mkdirSync).toHaveBeenCalledWith("decks/commander/test-deck", {
                recursive: true,
            });
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it("should use custom deck name if provided", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            const result = await client.saveDeckToFile("abc123", "My Custom Name");

            expect(result).toBe("decks/commander/my-custom-name");
        });

        it("should sanitize deck names properly", async () => {
            const deckWithSpecialChars = {
                ...mockDeckResponse,
                name: "My Deck! @#$ 123 (Cool)",
            };
            mockedAxios.get.mockResolvedValueOnce({ data: deckWithSpecialChars });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/commander/my-deck-123-cool");
        });

        it("should save standard deck to standard folder", async () => {
            const standardDeck = { ...mockDeckResponse, format: "standard" };
            mockedAxios.get.mockResolvedValueOnce({ data: standardDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/standard/test-deck");
        });

        it("should save modern deck to modern folder", async () => {
            const modernDeck = { ...mockDeckResponse, format: "modern" };
            mockedAxios.get.mockResolvedValueOnce({ data: modernDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/modern/test-deck");
        });

        it("should save unknown format to other folder", async () => {
            const vintageDeck = { ...mockDeckResponse, format: "vintage" };
            mockedAxios.get.mockResolvedValueOnce({ data: vintageDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toBe("decks/other/test-deck");
        });

        it("should generate correct file content with commander", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            await client.saveDeckToFile("abc123");

            const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
            const content = writeCall[1];

            expect(content).toContain("# Test Deck");
            expect(content).toContain("# Format: commander");
            expect(content).toContain(
                "# Imported from Moxfield: https://www.moxfield.com/decks/abc123"
            );
            expect(content).toContain("# Commander (1)");
            expect(content).toContain("1 Sol Ring");
            expect(content).toContain("# Mainboard (7)");
            expect(content).toContain("4 Lightning Bolt");
            expect(content).toContain("3 Counterspell");
            expect(content).toContain("# Sideboard (2)");
            expect(content).toContain("2 Rest in Peace");
        });

        it("should handle deck without main commander", async () => {
            const deckNoMain = {
                ...mockDeckResponse,
                main: undefined,
                boards: {
                    ...mockDeckResponse.boards,
                    commanders: {
                        count: 2,
                        cards: {
                            cmd1: {
                                quantity: 1,
                                card: { name: "Tymna the Weaver" },
                            },
                            cmd2: {
                                quantity: 1,
                                card: { name: "Thrasios, Triton Hero" },
                            },
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValueOnce({ data: deckNoMain });

            await client.saveDeckToFile("abc123");

            const content = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain("# Commander (2)");
            expect(content).toContain("1 Tymna the Weaver");
            expect(content).toContain("1 Thrasios, Triton Hero");
        });

        it("should handle deck without sideboard", async () => {
            const deckNoSideboard = {
                ...mockDeckResponse,
                boards: {
                    mainboard: mockDeckResponse.boards.mainboard,
                },
            };

            mockedAxios.get.mockResolvedValueOnce({ data: deckNoSideboard });

            await client.saveDeckToFile("abc123");

            const content = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).not.toContain("# Sideboard");
        });

        it("should handle cards with name property instead of card.name", async () => {
            const deckWithNameProp = {
                ...mockDeckResponse,
                boards: {
                    mainboard: {
                        count: 4,
                        cards: {
                            card1: {
                                quantity: 4,
                                name: "Island",
                            },
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValueOnce({ data: deckWithNameProp });

            await client.saveDeckToFile("abc123");

            const content = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain("4 Island");
        });

        it("should skip cards without names", async () => {
            const deckWithMissingNames = {
                ...mockDeckResponse,
                boards: {
                    mainboard: {
                        count: 4,
                        cards: {
                            card1: {
                                quantity: 4,
                            },
                        },
                    },
                },
            };

            mockedAxios.get.mockResolvedValueOnce({ data: deckWithMissingNames });

            await client.saveDeckToFile("abc123");

            const content = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).not.toContain("4 undefined");
        });

        it("should use cached deck if not expired", async () => {
            mockCache.shouldFetch = jest.fn().mockReturnValue(false);
            mockCache.getMetadata = jest.fn().mockReturnValue({
                deckId: "abc123",
                filePath: "decks/commander/test-deck/moxfield.txt",
                lastFetched: new Date().toISOString(),
            });
            mockCache.getTimeUntilExpiry = jest.fn().mockReturnValue(3000000); // 50 minutes

            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            const result = await client.saveDeckToFile("abc123");

            // Should still fetch to get format/name for folder path
            expect(mockedAxios.get).toHaveBeenCalled();
            // Should log cache status when metadata exists
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("Using cached deck")
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(
                expect.stringContaining("Cache expires in 50 minutes")
            );
            // Should return folder path without writing file
            expect(result).toBe("decks/commander/test-deck");
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it("should force refresh when forceRefresh is true", async () => {
            mockCache.shouldFetch = jest.fn().mockReturnValue(false);
            mockCache.getMetadata = jest.fn().mockReturnValue({
                deckId: "abc123",
                filePath: "decks/commander/test-deck/moxfield.txt",
                lastFetched: new Date().toISOString(),
            });
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            await client.saveDeckToFile("abc123", undefined, true);

            // Should bypass cache and write file
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(mockCache.updateCache).toHaveBeenCalled();
        });

        it("should update cache after saving", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            await client.saveDeckToFile("abc123");

            expect(mockCache.updateCache).toHaveBeenCalledWith(
                "abc123",
                "decks/commander/test-deck/moxfield.txt"
            );
        });

        it("should handle very long deck names", async () => {
            const longName = "A".repeat(100);
            const deckLongName = { ...mockDeckResponse, name: longName };
            mockedAxios.get.mockResolvedValueOnce({ data: deckLongName });

            const result = await client.saveDeckToFile("abc123");

            // Should truncate to 50 characters
            expect(result).toBe("decks/commander/" + "a".repeat(50));
        });
    });

    describe("extractDeckId", () => {
        it("should extract deck ID from full URL", () => {
            const result = MoxfieldClient.extractDeckId("https://www.moxfield.com/decks/abc123xyz");
            expect(result).toBe("abc123xyz");
        });

        it("should extract deck ID from URL without protocol", () => {
            const result = MoxfieldClient.extractDeckId("moxfield.com/decks/abc123xyz");
            expect(result).toBe("abc123xyz");
        });

        it("should return deck ID if already just an ID", () => {
            const result = MoxfieldClient.extractDeckId("abc123xyz");
            expect(result).toBe("abc123xyz");
        });

        it("should handle deck IDs with hyphens and underscores", () => {
            const result = MoxfieldClient.extractDeckId(
                "https://www.moxfield.com/decks/abc-123_xyz"
            );
            expect(result).toBe("abc-123_xyz");
        });

        it("should throw error for invalid URLs", () => {
            expect(() => MoxfieldClient.extractDeckId("https://google.com")).toThrow(
                "Invalid Moxfield URL or deck ID"
            );
        });

        it("should throw error for malformed moxfield URL", () => {
            expect(() => MoxfieldClient.extractDeckId("moxfield.com/invalid/path")).toThrow(
                "Invalid Moxfield URL or deck ID"
            );
        });
    });

    describe("format directory mapping", () => {
        it("should map pioneer to other", async () => {
            const pioneerDeck = { ...mockDeckResponse, format: "pioneer" };
            mockedAxios.get.mockResolvedValueOnce({ data: pioneerDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toContain("decks/other/");
        });

        it("should map legacy to other", async () => {
            const legacyDeck = { ...mockDeckResponse, format: "legacy" };
            mockedAxios.get.mockResolvedValueOnce({ data: legacyDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toContain("decks/other/");
        });

        it("should map pauper to other", async () => {
            const pauperDeck = { ...mockDeckResponse, format: "pauper" };
            mockedAxios.get.mockResolvedValueOnce({ data: pauperDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toContain("decks/other/");
        });

        it("should handle case-insensitive format matching", async () => {
            const upperCaseDeck = { ...mockDeckResponse, format: "COMMANDER" };
            mockedAxios.get.mockResolvedValueOnce({ data: upperCaseDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toContain("decks/commander/");
        });

        it("should handle EDH format variation", async () => {
            const edhDeck = { ...mockDeckResponse, format: "edh" };
            mockedAxios.get.mockResolvedValueOnce({ data: edhDeck });

            const result = await client.saveDeckToFile("abc123");

            expect(result).toContain("decks/commander/");
        });
    });

    describe("edge cases", () => {
        it("should handle empty mainboard", async () => {
            const emptyMainboard = {
                ...mockDeckResponse,
                boards: {
                    mainboard: {
                        count: 0,
                        cards: {},
                    },
                },
            };

            mockedAxios.get.mockResolvedValueOnce({ data: emptyMainboard });

            await client.saveDeckToFile("abc123");

            const content = (fs.writeFileSync as jest.Mock).mock.calls[0][1];
            expect(content).toContain("# Mainboard (0)");
        });

        it("should handle deck without boards property", async () => {
            const noBoardsDeck = {
                name: "Test Deck",
                format: "standard",
                main: undefined,
            };

            mockedAxios.get.mockResolvedValueOnce({ data: noBoardsDeck });

            await client.saveDeckToFile("abc123");

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it("should create directory if it does not exist", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            await client.saveDeckToFile("abc123");

            expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining("decks/commander/"), {
                recursive: true,
            });
        });

        it("should not create directory if it already exists", async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            mockedAxios.get.mockResolvedValueOnce({ data: mockDeckResponse });

            await client.saveDeckToFile("abc123");

            expect(fs.mkdirSync).not.toHaveBeenCalled();
        });
    });
});
