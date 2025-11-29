import { Cards } from "scryfall-api";
import { ScryfallClient } from "../scryfall-client";

jest.mock("scryfall-api");

const MockedCards = Cards as jest.Mocked<typeof Cards>;

describe("ScryfallClient", () => {
    let client: ScryfallClient;
    let consoleWarnSpy: jest.SpyInstance;

    const mockScryfallResponse: any = {
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
            MockedCards.byName.mockResolvedValueOnce(mockScryfallResponse);

            const result = await client.getCardByName("Lightning Bolt");

            expect(MockedCards.byName).toHaveBeenCalledWith("Lightning Bolt", false);
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

        it("should return null when card is not found", async () => {
            MockedCards.byName.mockResolvedValueOnce(undefined);

            const result = await client.getCardByName("Nonexistent Card");

            expect(MockedCards.byName).toHaveBeenCalledWith("Nonexistent Card", false);
            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("Card not found: Nonexistent Card");
        });

        it("should handle API errors gracefully", async () => {
            const error = new Error("Card not found");
            MockedCards.byName.mockRejectedValueOnce(error);

            const result = await client.getCardByName("Error Card");

            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("Card not found: Error Card");
        });

        it("should handle 404 status errors", async () => {
            const error = { message: "Card not found", status: 404 };
            MockedCards.byName.mockRejectedValueOnce(error);

            const result = await client.getCardByName("Missing Card");

            expect(result).toBeNull();
            expect(consoleWarnSpy).toHaveBeenCalledWith("Card not found: Missing Card");
        });

        it("should rethrow non-404 errors", async () => {
            const error = new Error("Network error");
            MockedCards.byName.mockRejectedValueOnce(error);

            await expect(client.getCardByName("Network Error Card")).rejects.toThrow(
                "Network error"
            );
        });

        it("should handle cards with dual faces", async () => {
            const dualFaceCard: any = {
                ...mockScryfallResponse,
                image_uris: null,
                card_faces: [
                    {
                        image_uris: {
                            small: "https://example.com/front-small.jpg",
                            normal: "https://example.com/front-normal.jpg",
                            large: "https://example.com/front-large.jpg",
                        },
                    },
                ],
            };

            MockedCards.byName.mockResolvedValueOnce(dualFaceCard);

            const result = await client.getCardByName("Dual Face Card");

            expect(result?.image_uris).toEqual({
                small: "https://example.com/front-small.jpg",
                normal: "https://example.com/front-normal.jpg",
                large: "https://example.com/front-large.jpg",
            });
        });
    });

    describe("getCardsByNames", () => {
        it("should fetch multiple cards successfully", async () => {
            const mockScryfallResponse2: any = {
                ...mockScryfallResponse,
                id: "card-id-456",
                name: "Counterspell",
                mana_cost: "{U}{U}",
                cmc: 2,
                colors: ["U"],
                color_identity: ["U"],
            };

            MockedCards.byName
                .mockResolvedValueOnce(mockScryfallResponse)
                .mockResolvedValueOnce(mockScryfallResponse2);

            const result = await client.getCardsByNames(["Lightning Bolt", "Counterspell"]);

            expect(MockedCards.byName).toHaveBeenCalledTimes(2);
            expect(MockedCards.byName).toHaveBeenCalledWith("Lightning Bolt", false);
            expect(MockedCards.byName).toHaveBeenCalledWith("Counterspell", false);
            expect(result.size).toBe(2);
            expect(result.get("Lightning Bolt")?.name).toBe("Lightning Bolt");
            expect(result.get("Counterspell")?.name).toBe("Counterspell");
        });

        it("should skip cards that are not found", async () => {
            MockedCards.byName
                .mockResolvedValueOnce(mockScryfallResponse)
                .mockResolvedValueOnce(undefined);

            const result = await client.getCardsByNames(["Lightning Bolt", "Nonexistent Card"]);

            expect(MockedCards.byName).toHaveBeenCalledTimes(2);
            expect(result.size).toBe(1);
            expect(result.get("Lightning Bolt")?.name).toBe("Lightning Bolt");
            expect(result.has("Nonexistent Card")).toBe(false);
        });

        it("should handle errors when fetching individual cards", async () => {
            const error = new Error("Card not found");
            MockedCards.byName
                .mockResolvedValueOnce(mockScryfallResponse)
                .mockRejectedValueOnce(error);

            const result = await client.getCardsByNames(["Lightning Bolt", "Error Card"]);

            expect(result.size).toBe(1);
            expect(result.get("Lightning Bolt")?.name).toBe("Lightning Bolt");
            expect(result.has("Error Card")).toBe(false);
        });

        it("should return empty map for empty input", async () => {
            const result = await client.getCardsByNames([]);

            expect(MockedCards.byName).not.toHaveBeenCalled();
            expect(result.size).toBe(0);
        });
    });
});
