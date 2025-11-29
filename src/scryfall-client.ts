import { Cards } from "scryfall-api";
import { Card } from "./types";

const DELAY_MS = 100; // Scryfall requests 50-100ms delay between requests

export class ScryfallClient {
    private async delay(): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }

    /**
     * Search for a card by exact name
     */
    async getCardByName(cardName: string): Promise<Card | null> {
        try {
            await this.delay();

            const scryfallCard = await Cards.byName(cardName, false); // exact match only
            if (!scryfallCard) {
                console.warn(`Card not found: ${cardName}`);
                return null;
            }

            return this.mapScryfallCard(scryfallCard);
        } catch (error: any) {
            if (error.message?.includes("not found") || error.status === 404) {
                console.warn(`Card not found: ${cardName}`);
                return null;
            }
            throw error;
        }
    }

    /**
     * Get multiple cards by name
     */
    async getCardsByNames(cardNames: string[]): Promise<Map<string, Card>> {
        const cards = new Map<string, Card>();

        for (const name of cardNames) {
            const card = await this.getCardByName(name);
            if (card) {
                cards.set(name, card);
            }
        }

        return cards;
    }

    /**
     * Map Scryfall API response to our Card interface
     */
    private mapScryfallCard(data: any): Card {
        return {
            id: data.id,
            name: data.name,
            mana_cost: data.mana_cost,
            cmc: data.cmc,
            type_line: data.type_line,
            oracle_text: data.oracle_text,
            colors: data.colors,
            color_identity: data.color_identity,
            set: data.set,
            rarity: data.rarity,
            prices: data.prices,
            image_uris: data.image_uris || data.card_faces?.[0]?.image_uris,
        };
    }
}
