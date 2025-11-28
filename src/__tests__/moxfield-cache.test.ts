import * as fs from "fs";
import { MoxfieldCache } from "../moxfield-cache";

jest.mock("fs");

describe("MoxfieldCache", () => {
    const mockDeckId = "abc123";
    const mockFilePath = "/path/to/deck.txt";

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, "log").mockImplementation();
        jest.spyOn(console, "error").mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should create cache with default directory", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            new MoxfieldCache();

            expect(fs.existsSync).toHaveBeenCalledWith("./cache");
        });

        it("should create cache with custom directory", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            new MoxfieldCache("/custom/cache");

            expect(fs.existsSync).toHaveBeenCalledWith("/custom/cache");
        });

        it("should load existing cache file", () => {
            const mockCacheData = {
                deck123: {
                    deckId: "deck123",
                    filePath: "/path/to/deck.txt",
                    lastFetched: "2025-11-27T10:00:00.000Z",
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            new MoxfieldCache();

            expect(fs.readFileSync).toHaveBeenCalled();
        });

        it("should create cache directory if it does not exist", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            new MoxfieldCache();

            expect(fs.mkdirSync).toHaveBeenCalledWith("./cache", {
                recursive: true,
            });
        });

        it("should handle errors when loading cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockImplementation(() => {
                throw new Error("Read error");
            });

            expect(() => new MoxfieldCache()).not.toThrow();
            expect(console.error).toHaveBeenCalledWith(
                "Error loading Moxfield cache:",
                expect.any(Error)
            );
        });

        it("should accept custom cache expiry hours", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new MoxfieldCache("./cache", 24);

            expect(cache).toBeDefined();
        });
    });

    describe("shouldFetch", () => {
        it("should return true if deck not in cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new MoxfieldCache();
            const result = cache.shouldFetch(mockDeckId, mockFilePath);

            expect(result).toBe(true);
        });

        it("should return true if file does not exist", () => {
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: new Date().toISOString(),
                },
            };

            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(true) // Cache dir check
                .mockReturnValueOnce(true) // Cache file check
                .mockReturnValueOnce(false); // Deck file check
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache();
            const result = cache.shouldFetch(mockDeckId, mockFilePath);

            expect(result).toBe(true);
        });

        it("should return true if cache expired", () => {
            const oneHourAgo = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: oneHourAgo.toISOString(),
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache("./cache", 1); // 1 hour expiry
            const result = cache.shouldFetch(mockDeckId, mockFilePath);

            expect(result).toBe(true);
        });

        it("should return false if cache valid and not expired", () => {
            const recentTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: recentTime.toISOString(),
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache("./cache", 1); // 1 hour expiry
            const result = cache.shouldFetch(mockDeckId, mockFilePath);

            expect(result).toBe(false);
        });
    });

    describe("updateCache", () => {
        it("should update cache and save to disk", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new MoxfieldCache();
            cache.updateCache(mockDeckId, mockFilePath);

            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        it("should update existing deck in cache", () => {
            const oldTime = "2025-11-27T10:00:00.000Z";
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: "/old/path.txt",
                    lastFetched: oldTime,
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));
            (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);

            const cache = new MoxfieldCache();
            cache.updateCache(mockDeckId, "/new/path.txt");

            const metadata = cache.getMetadata(mockDeckId);
            expect(metadata?.filePath).toBe("/new/path.txt");
            expect(metadata?.lastFetched).not.toBe(oldTime);
        });

        it("should handle errors when saving cache", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
            (fs.writeFileSync as jest.Mock).mockImplementation(() => {
                throw new Error("Write error");
            });

            const cache = new MoxfieldCache();

            expect(() => cache.updateCache(mockDeckId, mockFilePath)).not.toThrow();
            expect(console.error).toHaveBeenCalledWith(
                "Error saving Moxfield cache:",
                expect.any(Error)
            );
        });
    });

    describe("getMetadata", () => {
        it("should return metadata for existing deck", () => {
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: "2025-11-27T10:00:00.000Z",
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache();
            const metadata = cache.getMetadata(mockDeckId);

            expect(metadata).toEqual(mockCacheData[mockDeckId]);
        });

        it("should return null for non-existent deck", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new MoxfieldCache();
            const metadata = cache.getMetadata("nonexistent");

            expect(metadata).toBeNull();
        });
    });

    describe("getTimeUntilExpiry", () => {
        it("should return null for non-existent deck", () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);

            const cache = new MoxfieldCache();
            const time = cache.getTimeUntilExpiry("nonexistent");

            expect(time).toBeNull();
        });

        it("should return time until expiry for cached deck", () => {
            const now = Date.now();
            const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: thirtyMinutesAgo.toISOString(),
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache("./cache", 1); // 1 hour expiry
            const time = cache.getTimeUntilExpiry(mockDeckId);

            // Should be approximately 30 minutes (allowing some margin for test execution time)
            expect(time).toBeGreaterThan(25 * 60 * 1000);
            expect(time).toBeLessThanOrEqual(30 * 60 * 1000);
        });

        it("should return 0 for expired cache", () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: twoHoursAgo.toISOString(),
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache("./cache", 1); // 1 hour expiry
            const time = cache.getTimeUntilExpiry(mockDeckId);

            expect(time).toBe(0);
        });

        it("should handle recently cached deck", () => {
            const justNow = new Date(Date.now() - 1000); // 1 second ago
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: justNow.toISOString(),
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache("./cache", 1); // 1 hour expiry
            const time = cache.getTimeUntilExpiry(mockDeckId);

            // Should be very close to 1 hour
            expect(time).toBeGreaterThan(59 * 60 * 1000);
            expect(time).toBeLessThanOrEqual(60 * 60 * 1000);
        });
    });

    describe("cache persistence", () => {
        it("should persist cache across instances", () => {
            const mockCacheData = {
                [mockDeckId]: {
                    deckId: mockDeckId,
                    filePath: mockFilePath,
                    lastFetched: "2025-11-27T10:00:00.000Z",
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache1 = new MoxfieldCache();
            const metadata1 = cache1.getMetadata(mockDeckId);

            const cache2 = new MoxfieldCache();
            const metadata2 = cache2.getMetadata(mockDeckId);

            expect(metadata1).toEqual(metadata2);
        });

        it("should handle multiple deck entries", () => {
            const mockCacheData = {
                deck1: {
                    deckId: "deck1",
                    filePath: "/path/to/deck1.txt",
                    lastFetched: "2025-11-27T10:00:00.000Z",
                },
                deck2: {
                    deckId: "deck2",
                    filePath: "/path/to/deck2.txt",
                    lastFetched: "2025-11-27T11:00:00.000Z",
                },
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockCacheData));

            const cache = new MoxfieldCache();

            expect(cache.getMetadata("deck1")).toBeTruthy();
            expect(cache.getMetadata("deck2")).toBeTruthy();
            expect(cache.getMetadata("deck1")?.deckId).toBe("deck1");
            expect(cache.getMetadata("deck2")?.deckId).toBe("deck2");
        });
    });
});
