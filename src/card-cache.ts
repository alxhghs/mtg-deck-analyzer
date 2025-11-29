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
     * Load cache from disk (supports both old and new compact format)
     */
    private loadCache(): void {
        try {
            if (!fs.existsSync(this.cacheDir)) {
                fs.mkdirSync(this.cacheDir, { recursive: true });
            }

            if (fs.existsSync(this.cacheFile)) {
                const data = fs.readFileSync(this.cacheFile, "utf-8");
                const cacheData = JSON.parse(data);

                Object.entries(cacheData).forEach(([name, entry]: [string, any]) => {
                    // Support new compact format and old format
                    const card: Card =
                        entry.mc !== undefined
                            ? {
                                  name: name,
                                  mana_cost: entry.mc,
                                  cmc: entry.cmc,
                                  type_line: entry.type,
                                  oracle_text: entry.text,
                                  colors: entry.colors,
                                  color_identity: entry.ci,
                              }
                            : entry.card;

                    const cachedCard: CachedCard = {
                        card: card,
                        cachedAt: entry.cachedAt || new Date().toISOString(),
                    };
                    this.cache.set(name, cachedCard);
                });

                console.log(`Loaded ${this.cache.size} cards from cache`);
            }
        } catch (error) {
            console.error("Error loading cache:", error);
        }
    }

    /**
     * Save cache to disk (minimal format optimized for AI context)
     */
    private saveCache(): void {
        try {
            const cacheData: Record<string, any> = {};
            this.cache.forEach((value, key) => {
                // Skip entries with undefined cards
                if (!value || !value.card) {
                    console.warn(`Skipping cache entry '${key}' - card data is undefined`);
                    return;
                }

                // Store only essential fields in compact format
                // Using short keys to reduce token usage
                cacheData[key] = {
                    mc: value.card.mana_cost, // mana_cost
                    cmc: value.card.cmc, // converted mana cost
                    type: value.card.type_line, // type_line
                    text: value.card.oracle_text, // oracle_text
                    colors: value.card.colors, // colors array
                    ci: value.card.color_identity, // color_identity
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
            // Skip undefined cards
            if (!card) {
                console.warn(`Skipping undefined card: ${name}`);
                return;
            }

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
