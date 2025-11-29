import MoxfieldApi from "moxfield-api";
import * as fs from "fs";
import * as path from "path";
import { MoxfieldCache } from "./moxfield-cache";

// Define minimal interfaces based on the actual API response structure
interface MoxfieldCard {
    name: string;
    mana_cost?: string | null;
    type_line: string;
    cmc: number;
    oracle_text?: string | null;
    colors: string[];
    color_identity: string[];
}

interface MoxfieldBoardCard {
    quantity: number;
    card: MoxfieldCard;
}

interface MoxfieldBoard {
    cards: Record<string, MoxfieldBoardCard>;
}

interface MoxfieldDeck {
    name: string;
    format: string;
    boards?: {
        commanders?: MoxfieldBoard;
        mainboard?: MoxfieldBoard;
        sideboard?: MoxfieldBoard;
    };
}

export class MoxfieldClient {
    private cache: MoxfieldCache;
    private api: MoxfieldApi;

    constructor() {
        this.cache = new MoxfieldCache();
        this.api = new MoxfieldApi();
    }

    /**
     * Fetch a deck from Moxfield by its public ID
     * Example: https://www.moxfield.com/decks/abc123xyz -> ID is "abc123xyz"
     */
    async getDeck(deckId: string): Promise<MoxfieldDeck> {
        try {
            return (await this.api.deckList.findById(deckId)) as MoxfieldDeck;
        } catch (error: any) {
            // Handle common Moxfield API errors
            if (error.message?.includes("404") || error.message?.includes("not found")) {
                throw new Error(`Deck not found: ${deckId}. Make sure the deck is public.`);
            } else if (error.message?.includes("403") || error.message?.includes("forbidden")) {
                throw new Error(
                    `Access forbidden: ${deckId}. Moxfield API may be temporarily blocked by Cloudflare or require authentication. Try again later.`
                );
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
            if (metadata) {
                const timeUntilExpiry = this.cache.getTimeUntilExpiry(deckId);
                const minutesUntilExpiry = timeUntilExpiry
                    ? Math.ceil(timeUntilExpiry / 1000 / 60)
                    : 0;

                console.log(
                    `📦 Using cached deck (fetched ${new Date(metadata.lastFetched).toLocaleString()})`
                );
                console.log(`   Cache expires in ${minutesUntilExpiry} minutes`);
                console.log(`   Use --force to refresh now\n`);
                return deckFolder;
            }
        }

        // Build decklist content
        let content = `# ${deck.name}\n`;
        content += `# Format: ${deck.format}\n`;
        content += `# Imported from Moxfield: https://www.moxfield.com/decks/${deckId}\n\n`;

        // Add commanders if present
        if (deck.boards?.commanders?.cards) {
            const commanderCards = this.extractCardsFromBoard(deck.boards.commanders.cards);
            const commanderTotal = commanderCards.reduce((sum, card) => sum + card.quantity, 0);
            content += `# Commander (${commanderTotal})\n`;
            commanderCards.forEach((card) => {
                content += `${card.quantity} ${card.name}\n`;
            });
            content += "\n";
        }

        // Add mainboard
        if (deck.boards?.mainboard?.cards) {
            const mainboardCards = this.extractCardsFromBoard(deck.boards.mainboard.cards);
            const mainboardTotal = mainboardCards.reduce((sum, card) => sum + card.quantity, 0);
            content += `# Mainboard (${mainboardTotal})\n`;
            mainboardCards.forEach((card) => {
                content += `${card.quantity} ${card.name}\n`;
            });
            content += "\n";
        }

        // Add sideboard if present
        if (deck.boards?.sideboard?.cards) {
            const sideboardCards = this.extractCardsFromBoard(deck.boards.sideboard.cards);
            const sideboardTotal = sideboardCards.reduce((sum, card) => sum + card.quantity, 0);
            content += `# Sideboard (${sideboardTotal})\n`;
            sideboardCards.forEach((card) => {
                content += `${card.quantity} ${card.name}\n`;
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
     * Extract card data from a board's cards object
     */
    private extractCardsFromBoard(
        cards: Record<string, MoxfieldBoardCard>
    ): Array<{ name: string; quantity: number }> {
        return Object.values(cards).map((cardData) => ({
            name: cardData.card.name,
            quantity: cardData.quantity,
        }));
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
