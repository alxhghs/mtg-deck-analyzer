import axios from 'axios';
import { DeckCard } from './types';
import * as fs from 'fs';
import * as path from 'path';

const MOXFIELD_API_BASE = 'https://api2.moxfield.com/v3/decks/all';

interface MoxfieldCard {
  quantity: number;
  boardType: string;
  card: {
    name: string;
  };
}

interface MoxfieldDeck {
  name: string;
  format: string;
  mainboard: Record<string, MoxfieldCard>;
  sideboard: Record<string, MoxfieldCard>;
  commanders: Record<string, MoxfieldCard>;
}

export class MoxfieldClient {
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
   * Convert Moxfield deck to our decklist format and save to file
   */
  async saveDeckToFile(deckId: string, outputPath?: string): Promise<string> {
    const deck = await this.getDeck(deckId);
    
    // Determine output path
    let filePath: string;
    if (outputPath) {
      filePath = outputPath;
    } else {
      // Auto-determine based on format
      const formatDir = this.getFormatDirectory(deck.format);
      const fileName = this.sanitizeFileName(deck.name);
      filePath = path.join('decks', formatDir, `${fileName}.txt`);
    }

    // Build decklist content
    let content = `# ${deck.name}\n`;
    content += `# Format: ${deck.format}\n`;
    content += `# Imported from Moxfield: https://www.moxfield.com/decks/${deckId}\n\n`;

    // Add commanders if present (for Commander format)
    if (Object.keys(deck.commanders).length > 0) {
      content += '# Commander\n';
      Object.values(deck.commanders).forEach(card => {
        content += `${card.quantity} ${card.card.name}\n`;
      });
      content += '\n';
    }

    // Add mainboard
    if (Object.keys(deck.mainboard).length > 0) {
      content += '# Mainboard\n';
      Object.values(deck.mainboard).forEach(card => {
        content += `${card.quantity} ${card.card.name}\n`;
      });
      content += '\n';
    }

    // Add sideboard if present
    if (Object.keys(deck.sideboard).length > 0) {
      content += '# Sideboard\n';
      Object.values(deck.sideboard).forEach(card => {
        content += `${card.quantity} ${card.card.name}\n`;
      });
    }

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save to file
    fs.writeFileSync(filePath, content);
    
    return filePath;
  }

  /**
   * Get the appropriate directory based on format
   */
  private getFormatDirectory(format: string): string {
    const formatLower = format.toLowerCase();
    
    if (formatLower.includes('standard')) return 'standard';
    if (formatLower.includes('modern')) return 'modern';
    if (formatLower.includes('commander') || formatLower.includes('edh')) return 'commander';
    if (formatLower.includes('pioneer')) return 'other';
    if (formatLower.includes('legacy')) return 'other';
    if (formatLower.includes('vintage')) return 'other';
    if (formatLower.includes('pauper')) return 'other';
    
    return 'other';
  }

  /**
   * Sanitize deck name for use as filename
   */
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Extract deck ID from a Moxfield URL
   */
  static extractDeckId(urlOrId: string): string {
    // If it's already just an ID, return it
    if (!urlOrId.includes('/') && !urlOrId.includes('http')) {
      return urlOrId;
    }

    // Extract from URL
    const match = urlOrId.match(/moxfield\.com\/decks\/([a-zA-Z0-9_-]+)/);
    if (match) {
      return match[1];
    }

    throw new Error('Invalid Moxfield URL or deck ID');
  }
}
