import * as fs from "fs";
import * as path from "path";

interface DeckMetadata {
    deckId: string;
    filePath: string;
    lastFetched: string;
}

export class MoxfieldCache {
    private cacheDir: string;
    private cacheFile: string;
    private cache: Map<string, DeckMetadata>;
    private cacheExpiryMs: number;

    constructor(cacheDir: string = "./cache", cacheExpiryHours: number = 1) {
        this.cacheDir = cacheDir;
        this.cacheFile = path.join(cacheDir, "moxfield-decks.json");
        this.cache = new Map();
        this.cacheExpiryMs = cacheExpiryHours * 60 * 60 * 1000;
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

                Object.entries(cacheData).forEach(([deckId, metadata]) => {
                    this.cache.set(deckId, metadata as DeckMetadata);
                });
            }
        } catch (error) {
            console.error("Error loading Moxfield cache:", error);
        }
    }

    /**
     * Save cache to disk
     */
    private saveCache(): void {
        try {
            const cacheData: Record<string, DeckMetadata> = {};
            this.cache.forEach((value, key) => {
                cacheData[key] = value;
            });

            fs.writeFileSync(this.cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.error("Error saving Moxfield cache:", error);
        }
    }

    /**
     * Check if a deck needs to be re-fetched
     * Returns true if deck should be fetched (not in cache or expired)
     */
    shouldFetch(deckId: string, filePath: string): boolean {
        const metadata = this.cache.get(deckId);

        if (!metadata) {
            return true;
        }

        // Check if file still exists
        if (!fs.existsSync(filePath)) {
            return true;
        }

        // Check if cache expired
        const lastFetched = new Date(metadata.lastFetched).getTime();
        const now = Date.now();

        if (now - lastFetched > this.cacheExpiryMs) {
            return true;
        }

        return false;
    }

    /**
     * Update cache metadata after fetching a deck
     */
    updateCache(deckId: string, filePath: string): void {
        const metadata: DeckMetadata = {
            deckId,
            filePath,
            lastFetched: new Date().toISOString(),
        };

        this.cache.set(deckId, metadata);
        this.saveCache();
    }

    /**
     * Get metadata for a deck
     */
    getMetadata(deckId: string): DeckMetadata | null {
        return this.cache.get(deckId) || null;
    }

    /**
     * Get time until cache expires for a deck
     */
    getTimeUntilExpiry(deckId: string): number | null {
        const metadata = this.cache.get(deckId);
        if (!metadata) {
            return null;
        }

        const lastFetched = new Date(metadata.lastFetched).getTime();
        const expiresAt = lastFetched + this.cacheExpiryMs;
        const now = Date.now();

        return Math.max(0, expiresAt - now);
    }
}
