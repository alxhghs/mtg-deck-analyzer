import axios from "axios";
import { ScryfallClient } from "../scryfall-client";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ScryfallClient", () => {
    let client: ScryfallClient;
    let consoleWarnSpy: jest.SpyInstance;

    const mockScryfallResponse = {
        id: "card-id-123",
        name: "Lightning Bolt",
        mana_cost: "{R}",
        cmc: 1,
        type_line: "Instant",
        oracle_text: "Lightning Bolt deals 3 damage to any target.",
        colors: ["R"],
        color_identity: ["R"],
        set: "lea",
        rarity: "common",
        prices: {
            usd: "0.50",
            usd_foil: "2.00",
        },
        image_uris: {
            small: "https://example.com/small.jpg",
            normal: "https://example.com/normal.jpg",
            large: "https://example.com/large.jpg",
        },
    };

    beforeEach(() => {
        client = new ScryfallClient();
        consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
        jest.clearAllMocks();
    });

    afterEach(() => {
        consoleWarnSpy.mockRestore();
    });

    describe("getCardByName", () => {
        it("should fetch and map card data successfully", async () => {
            mockedAxios.get.mockResolvedValueOnce({ data: mockScryfallResponse });

            const result = await client.getCardByName("Lightning Bolt");

            expect(mockedAxios.get).toHaveBeenCalledWith("https://api.scryfall.com/cards/named", {
                params: { exact: "Lightning Bolt" },
            });

            expect(result).toEqual({
                id: "card-id-123",
                name: "Lightning Bolt",
                mana_cost: "{R}",
                cmc: 1,
                type_line: "Instant",
                oracle_text: "Lightning Bolt deals 3 damage to any target.",
                colors: ["R"],
                color_identity: ["R"],
                set: "lea",
                rarity: "common",
                prices: {
                    usd: "0.50",
                    usd_foil: "2.00",
                },
                image_uris: {
                    small: "https://example.com/small.jpg",
                    normal: "https://example.com/normal.jpg",
                    large: "https://example.com/large.jpg",
                },
            });
        });

        it("should return null for 404 errors", async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 404 },
            });

            const result = await client.getCardByName("Nonexistent Card");

            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("Card not found: Nonexistent Card");
        });

        it("should throw error for non-404 errors", async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 500 },
                message: "Server error",
            });

            await expect(client.getCardByName("Lightning Bolt")).rejects.toMatchObject({
                response: { status: 500 },
            });
        });

        it("should handle card with double-faced layout (card_faces)", async () => {
            const doubleFacedCard = {
                ...mockScryfallResponse,
                image_uris: undefined,
                card_faces: [
                    {
                        image_uris: {
                            small: "https://example.com/front-small.jpg",
                            normal: "https://example.com/front-normal.jpg",
                            large: "https://example.com/front-large.jpg",
                        },
                    },
                    {
                        image_uris: {
                            small: "https://example.com/back-small.jpg",
                            normal: "https://example.com/back-normal.jpg",
                            large: "https://example.com/back-large.jpg",
                        },
                    },
                ],
            };

            mockedAxios.get.mockResolvedValueOnce({ data: doubleFacedCard });

            const result = await client.getCardByName("Delver of Secrets");

            expect(result?.image_uris).toEqual({
                small: "https://example.com/front-small.jpg",
                normal: "https://example.com/front-normal.jpg",
                large: "https://example.com/front-large.jpg",
            });
        });

        it("should handle card with no image_uris", async () => {
            const cardNoImages = {
                ...mockScryfallResponse,
                image_uris: undefined,
            };

            mockedAxios.get.mockResolvedValueOnce({ data: cardNoImages });

            const result = await client.getCardByName("Test Card");

            expect(result?.image_uris).toBeUndefined();
        });

        it("should handle card with missing optional fields", async () => {
            const minimalCard = {
                id: "minimal-id",
                name: "Minimal Card",
                cmc: 0,
                type_line: "Land",
                set: "tst",
                rarity: "common",
                colors: [],
                color_identity: [],
            };

            mockedAxios.get.mockResolvedValueOnce({ data: minimalCard });

            const result = await client.getCardByName("Minimal Card");

            expect(result).toEqual({
                id: "minimal-id",
                name: "Minimal Card",
                mana_cost: undefined,
                cmc: 0,
                type_line: "Land",
                oracle_text: undefined,
                colors: [],
                color_identity: [],
                set: "tst",
                rarity: "common",
                prices: undefined,
                image_uris: undefined,
            });
        });

        it("should respect API delay between requests", async () => {
            mockedAxios.get.mockResolvedValue({ data: mockScryfallResponse });

            const startTime = Date.now();
            await client.getCardByName("Card 1");
            const endTime = Date.now();

            // Should take at least 100ms due to delay
            expect(endTime - startTime).toBeGreaterThanOrEqual(95); // Allow small margin
        });
    });

    describe("getCardsByNames", () => {
        it("should fetch multiple cards", async () => {
            const card1 = { ...mockScryfallResponse, name: "Card 1" };
            const card2 = { ...mockScryfallResponse, name: "Card 2" };

            mockedAxios.get
                .mockResolvedValueOnce({ data: card1 })
                .mockResolvedValueOnce({ data: card2 });

            const result = await client.getCardsByNames(["Card 1", "Card 2"]);

            expect(result.size).toBe(2);
            expect(result.get("Card 1")?.name).toBe("Card 1");
            expect(result.get("Card 2")?.name).toBe("Card 2");
            expect(mockedAxios.get).toHaveBeenCalledTimes(2);
        });

        it("should skip cards that return null (404)", async () => {
            const card1 = { ...mockScryfallResponse, name: "Card 1" };

            mockedAxios.get
                .mockResolvedValueOnce({ data: card1 })
                .mockRejectedValueOnce({ response: { status: 404 } });

            const result = await client.getCardsByNames(["Card 1", "Nonexistent"]);

            expect(result.size).toBe(1);
            expect(result.has("Card 1")).toBe(true);
            expect(result.has("Nonexistent")).toBe(false);
        });

        it("should handle empty array", async () => {
            const result = await client.getCardsByNames([]);

            expect(result.size).toBe(0);
            expect(mockedAxios.get).not.toHaveBeenCalled();
        });

        it("should fetch cards sequentially with delays", async () => {
            mockedAxios.get.mockResolvedValue({ data: mockScryfallResponse });

            const startTime = Date.now();
            await client.getCardsByNames(["Card 1", "Card 2", "Card 3"]);
            const endTime = Date.now();

            // Should take at least 300ms (3 cards * 100ms delay each)
            expect(endTime - startTime).toBeGreaterThanOrEqual(285);
        });

        it("should propagate non-404 errors", async () => {
            mockedAxios.get.mockRejectedValueOnce({
                response: { status: 500 },
                message: "Server error",
            });

            await expect(client.getCardsByNames(["Card 1"])).rejects.toMatchObject({
                response: { status: 500 },
            });
        });
    });

    describe("edge cases", () => {
        it("should handle card names with special characters", async () => {
            const specialCard = {
                ...mockScryfallResponse,
                name: "Jace, the Mind Sculptor",
            };

            mockedAxios.get.mockResolvedValueOnce({ data: specialCard });

            const result = await client.getCardByName("Jace, the Mind Sculptor");

            expect(result?.name).toBe("Jace, the Mind Sculptor");
            expect(mockedAxios.get).toHaveBeenCalledWith("https://api.scryfall.com/cards/named", {
                params: { exact: "Jace, the Mind Sculptor" },
            });
        });

        it("should handle network timeout", async () => {
            mockedAxios.get.mockRejectedValueOnce(new Error("Network timeout"));

            await expect(client.getCardByName("Lightning Bolt")).rejects.toThrow("Network timeout");
        });

        it("should map all card properties correctly", async () => {
            const fullCard = {
                id: "full-id",
                name: "Full Card",
                mana_cost: "{2}{U}{U}",
                cmc: 4,
                type_line: "Creature — Merfolk Wizard",
                oracle_text: "When this enters, draw a card.",
                colors: ["U"],
                color_identity: ["U"],
                set: "m21",
                rarity: "rare",
                prices: {
                    usd: "5.00",
                    usd_foil: "10.00",
                },
                image_uris: {
                    small: "https://example.com/s.jpg",
                    normal: "https://example.com/n.jpg",
                    large: "https://example.com/l.jpg",
                },
            };

            mockedAxios.get.mockResolvedValueOnce({ data: fullCard });

            const result = await client.getCardByName("Full Card");

            expect(result).toMatchObject({
                id: "full-id",
                name: "Full Card",
                mana_cost: "{2}{U}{U}",
                cmc: 4,
                type_line: "Creature — Merfolk Wizard",
                oracle_text: "When this enters, draw a card.",
                colors: ["U"],
                color_identity: ["U"],
                set: "m21",
                rarity: "rare",
                prices: {
                    usd: "5.00",
                    usd_foil: "10.00",
                },
            });
        });
    });
});
