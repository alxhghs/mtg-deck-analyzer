#!/usr/bin/env ts-node

import * as path from "path";
import { CardCache } from "./src/card-cache";
import { ScryfallClient } from "./src/scryfall-client";

class CardFetcher {
    private client: ScryfallClient;
    private cache: CardCache;

    constructor() {
        this.client = new ScryfallClient();
        this.cache = new CardCache(path.join(__dirname, "scryfall-cache.json"));
    }

    async fetchCard(cardName: string): Promise<void> {
        console.log(`Fetching "${cardName}"...`);

        try {
            const card = await this.client.getCardByName(cardName);

            if (card) {
                console.log("✅ Card found!");
                console.log(`Name: ${card.name}`);
                console.log(`Type: ${card.type_line}`);
                console.log(`Mana Cost: ${card.mana_cost || "N/A"}`);
                console.log(`CMC: ${card.cmc}`);
                console.log(`Colors: [${card.colors?.join(", ") || "Colorless"}]`);
                console.log(`Oracle Text: ${card.oracle_text || "N/A"}`);
                console.log(`Set: ${card.set?.toUpperCase()}`);
                console.log(`Rarity: ${card.rarity}`);

                // Add to cache
                this.cache.set(cardName, card);
                console.log(`\n💾 Cached in scryfall-cache.json`);
            } else {
                console.log("❌ Card not found");
            }
        } catch (error: any) {
            console.error("❌ Error fetching card:", error.message);
        }
    }

    async fetchMultiple(cardNames: string[]): Promise<void> {
        console.log(`Fetching ${cardNames.length} cards...\n`);

        for (let i = 0; i < cardNames.length; i++) {
            const cardName = cardNames[i];
            console.log(`[${i + 1}/${cardNames.length}] ${cardName}`);

            await this.fetchCard(cardName);

            // Rate limiting - wait 100ms between requests
            if (i < cardNames.length - 1) {
                console.log("⏳ Waiting 100ms for rate limit...\n");
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }
    }

    async showCache(): Promise<void> {
        console.log("📚 Current cache contents:");
        const stats = this.cache.getStats();

        if (stats.size === 0) {
            console.log("Cache is empty");
            return;
        }

        console.log(`\n${stats.size} cards cached`);
        console.log("Use --search to find specific cards");
    }

    async searchCache(query: string): Promise<void> {
        console.log(`🔍 Searching cache for "${query}"...`);
        const stats = this.cache.getStats();

        if (stats.size === 0) {
            console.log("Cache is empty");
            return;
        }

        console.log(`\nSearching through ${stats.size} cached cards...`);
        console.log("Note: Individual card lookup not implemented yet.");
        console.log(
            "Cache exists and has data - you can check the scryfall-cache.json file directly."
        );
    }
}

async function main() {
    const args = process.argv.slice(2);
    const fetcher = new CardFetcher();

    if (args.length === 0) {
        console.log("🃏 Card Fetcher - Scryfall Cache Tool");
        console.log("\nUsage:");
        console.log('  npx ts-node fetch-card.ts "Card Name"           # Fetch single card');
        console.log('  npx ts-node fetch-card.ts "Card 1" "Card 2"    # Fetch multiple cards');
        console.log("  npx ts-node fetch-card.ts --cache              # Show cache contents");
        console.log('  npx ts-node fetch-card.ts --search "query"     # Search cache');
        console.log("\nExamples:");
        console.log('  npx ts-node fetch-card.ts "Lightning Bolt"');
        console.log('  npx ts-node fetch-card.ts "Sol Ring" "Mana Crypt"');
        console.log('  npx ts-node fetch-card.ts --search "bolt"');
        return;
    }

    if (args[0] === "--cache") {
        await fetcher.showCache();
        return;
    }

    if (args[0] === "--search" && args[1]) {
        await fetcher.searchCache(args[1]);
        return;
    }

    // Fetch cards
    if (args.length === 1) {
        await fetcher.fetchCard(args[0]);
    } else {
        await fetcher.fetchMultiple(args);
    }
}

main().catch(console.error);
