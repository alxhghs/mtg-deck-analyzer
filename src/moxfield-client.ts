import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { MoxfieldCache } from "./moxfield-cache";

const MOXFIELD_API_BASE = "https://api2.moxfield.com/v3/decks/all";

interface MoxfieldCard {
    quantity: number;
    card?: {
        name: string;
    };
    name?: string;
}

interface MoxfieldBoard {
    count: number;
    cards: Record<string, MoxfieldCard>;
}

interface MoxfieldDeck {
    name: string;
    format: string;
    main?: any;
    boards?: {
        mainboard?: MoxfieldBoard;
        sideboard?: MoxfieldBoard;
        commanders?: MoxfieldBoard;
    };
}

export class MoxfieldClient {
    private cache: MoxfieldCache;

    constructor() {
        this.cache = new MoxfieldCache();
    }

    /**
     * Fetch a deck from Moxfield by its public ID
     * Example: https://www.moxfield.com/decks/abc123xyz -> ID is "abc123xyz"
     */
    async getDeck(deckId: string): Promise<MoxfieldDeck> {
        try {
            const response = await axios.get(`${MOXFIELD_API_BASE}/${deckId}`);
            return response.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                throw new Error(`Deck not found: ${deckId}. Make sure the deck is public.`);
            }
            throw new Error(`Failed to fetch deck from Moxfield: ${error.message}`);
        }
    }

    /**
     * Convert Moxfield deck to our decklist format and save to deck folder
     * @returns Path to the deck folder
     */
    async saveDeckToFile(
        deckId: string,
        deckName?: string,
        forceRefresh: boolean = false
    ): Promise<string> {
        // Fetch deck data first
        const deck = await this.getDeck(deckId);

        // Determine deck folder path
        const formatDir = this.getFormatDirectory(deck.format);
        const folderName = deckName
            ? this.sanitizeFileName(deckName)
            : this.sanitizeFileName(deck.name);
        const deckFolder = path.join("decks", formatDir, folderName);
        const filePath = path.join(deckFolder, "moxfield.txt");

        // Check if we need to fetch from API
        if (!forceRefresh && !this.cache.shouldFetch(deckId, filePath)) {
            const metadata = this.cache.getMetadata(deckId);
            const timeUntilExpiry = this.cache.getTimeUntilExpiry(deckId);
            const minutesUntilExpiry = timeUntilExpiry ? Math.ceil(timeUntilExpiry / 1000 / 60) : 0;

            console.log(
                `📦 Using cached deck (fetched ${new Date(metadata!.lastFetched).toLocaleString()})`
            );
            console.log(`   Cache expires in ${minutesUntilExpiry} minutes`);
            console.log(`   Use --force to refresh now\n`);
            return deckFolder;
        }

        // Build decklist content
        let content = `# ${deck.name}\n`;
        content += `# Format: ${deck.format}\n`;
        content += `# Imported from Moxfield: https://www.moxfield.com/decks/${deckId}\n\n`;

        // Add commander if present (main card in Commander format)
        if (deck.main) {
            content += "# Commander\n";
            content += `1 ${deck.main.name}\n\n`;
        } else if (deck.boards?.commanders?.cards) {
            // Add commanders from boards if no main commander
            content += "# Commander\n";
            Object.values(deck.boards.commanders.cards).forEach((cardData) => {
                const name = cardData.card?.name || cardData.name;
                if (name) {
                    content += `${cardData.quantity} ${name}\n`;
                }
            });
            content += "\n";
        }

        // Add mainboard
        if (deck.boards?.mainboard?.cards) {
            content += "# Mainboard\n";
            Object.values(deck.boards.mainboard.cards).forEach((cardData) => {
                const name = cardData.card?.name || cardData.name;
                if (name) {
                    content += `${cardData.quantity} ${name}\n`;
                }
            });
            content += "\n";
        }

        // Add sideboard if present
        if (deck.boards?.sideboard?.cards) {
            content += "# Sideboard\n";
            Object.values(deck.boards.sideboard.cards).forEach((cardData) => {
                const name = cardData.card?.name || cardData.name;
                if (name) {
                    content += `${cardData.quantity} ${name}\n`;
                }
            });
        }

        // Ensure directory exists
        if (!fs.existsSync(deckFolder)) {
            fs.mkdirSync(deckFolder, { recursive: true });
        }

        // Save moxfield.txt
        fs.writeFileSync(filePath, content);

        // Update cache
        this.cache.updateCache(deckId, filePath);

        return deckFolder;
    }

    /**
     * Get the appropriate directory based on format
     */
    private getFormatDirectory(format: string): string {
        const formatLower = format.toLowerCase();

        if (formatLower.includes("standard")) return "standard";
        if (formatLower.includes("modern")) return "modern";
        if (formatLower.includes("commander") || formatLower.includes("edh")) return "commander";
        if (formatLower.includes("pioneer")) return "other";
        if (formatLower.includes("legacy")) return "other";
        if (formatLower.includes("vintage")) return "other";
        if (formatLower.includes("pauper")) return "other";

        return "other";
    }

    /**
     * Sanitize deck name for use as filename
     */
    private sanitizeFileName(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .substring(0, 50);
    }

    /**
     * Extract deck ID from a Moxfield URL
     */
    static extractDeckId(urlOrId: string): string {
        // If it's already just an ID, return it
        if (!urlOrId.includes("/") && !urlOrId.includes("http")) {
            return urlOrId;
        }

        // Extract from URL
        const match = urlOrId.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
        if (match) {
            return match[1];
        }

        throw new Error("Invalid Moxfield URL or deck ID");
    }
}
