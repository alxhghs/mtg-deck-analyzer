import * as fs from "fs";
import * as path from "path";
import { CachedCard, Card } from "./types";

export class CardCache {
    private cacheDir: string;
    private cacheFile: string;
    private cache: Map<string, CachedCard>;

    constructor(cacheFilePath?: string) {
        if (cacheFilePath) {
            // Use per-deck cache file
            this.cacheFile = cacheFilePath;
            this.cacheDir = path.dirname(cacheFilePath);
        } else {
            // Fallback to global cache
            this.cacheDir = "./cache";
            this.cacheFile = path.join(this.cacheDir, "cards.json");
        }
        this.cache = new Map();
        this.loadCache();
    }

    /**
     * Load cache from disk
     */
    private loadCache(): void {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }

            if (fs.existsSync(this.cacheFile)) {
                const data = fs.readFileSync(this.cacheFile, "utf-8");
                const cacheData = JSON.parse(data);

                Object.entries(cacheData).forEach(([name, cachedCard]) => {
                    this.cache.set(name, cachedCard as CachedCard);
                });

                console.log(`Loaded ${this.cache.size} cards from cache`);
            }
        } catch (error) {
            console.error("Error loading cache:", error);
        }
    }

    /**
     * Save cache to disk (minimal format)
     */
    private saveCache(): void {
        try {
            const cacheData: Record<string, { card: any; cachedAt: string }> = {};
            this.cache.forEach((value, key) => {
                // Store only essential fields
                cacheData[key] = {
                    card: {
                        name: value.card.name,
                        mana_cost: value.card.mana_cost,
                        cmc: value.card.cmc,
                        type_line: value.card.type_line,
                        oracle_text: value.card.oracle_text,
                        colors: value.card.colors,
                        color_identity: value.card.color_identity,
                    },
                    cachedAt: value.cachedAt,
                };
            });

            fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
            console.log(`Saved ${this.cache.size} cards to cache`);
        } catch (error) {
            console.error("Error saving cache:", error);
        }
    }

    /**
     * Get a card from cache
     */
    get(cardName: string): Card | null {
        const cached = this.cache.get(cardName);
        if (cached) {
            return cached.card;
        }
        return null;
    }

    /**
     * Check if a card exists in cache
     */
    has(cardName: string): boolean {
        return this.cache.has(cardName);
    }

    /**
     * Add a card to cache
     */
    set(cardName: string, card: Card): void {
        const cachedCard: CachedCard = {
            card,
            cachedAt: new Date().toISOString(),
        };
        this.cache.set(cardName, cachedCard);
        this.saveCache();
    }

    /**
     * Add multiple cards to cache
     */
    setMany(cards: Map<string, Card>): void {
        const now = new Date().toISOString();
        cards.forEach((card, name) => {
            const cachedCard: CachedCard = {
                card,
                cachedAt: now,
            };
            this.cache.set(name, cachedCard);
        });
        this.saveCache();
    }

    /**
     * Clear the cache
     */
    clear(): void {
        this.cache.clear();
        if (fs.existsSync(this.cacheFile)) {
            fs.unlinkSync(this.cacheFile);
        }
        console.log("Cache cleared");
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        oldestEntry: string | null;
        newestEntry: string | null;
    } {
        if (this.cache.size === 0) {
            return { size: 0, oldestEntry: null, newestEntry: null };
        }

        let oldest: string | null = null;
        let newest: string | null = null;

        this.cache.forEach((cached) => {
            if (!oldest || cached.cachedAt < oldest) {
                oldest = cached.cachedAt;
            }
            if (!newest || cached.cachedAt > newest) {
                newest = cached.cachedAt;
            }
        });

        return {
            size: this.cache.size,
            oldestEntry: oldest,
            newestEntry: newest,
        };
    }
}
