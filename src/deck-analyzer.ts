import { Card, Deck, DeckCard } from './types';

export class DeckAnalyzer {
  private cards: Map<string, Card>;
  private deck: Deck;

  constructor(deck: Deck, cards: Map<string, Card>) {
    this.deck = deck;
    this.cards = cards;
  }

  /**
   * Analyze the deck and return statistics
   */
  analyze(): string {
    let analysis = '\n=== DECK ANALYSIS ===\n\n';

    // Basic stats
    analysis += this.getBasicStats();
    
    // Color distribution
    analysis += this.getColorDistribution();
    
    // Mana curve
    analysis += this.getManaCurve();
    
    // Card types
    analysis += this.getTypeDistribution();
    
    // Average CMC
    analysis += this.getAverageCMC();

    return analysis;
  }

  private getBasicStats(): string {
    let stats = `Total Cards: ${this.deck.totalCards}\n`;
    stats += `Unique Cards: ${this.deck.cards.length}\n\n`;
    return stats;
  }

  private getColorDistribution(): string {
    const colorCount: Record<string, number> = {
      W: 0, U: 0, B: 0, R: 0, G: 0, C: 0
    };

    this.deck.cards.forEach(deckCard => {
      const card = this.cards.get(deckCard.name);
      if (card) {
        if (!card.colors || card.colors.length === 0) {
          colorCount.C += deckCard.quantity;
        } else {
          card.colors.forEach(color => {
            colorCount[color] += deckCard.quantity;
          });
        }
      }
    });

    let distribution = 'Color Distribution:\n';
    const colorNames: Record<string, string> = {
      W: 'White', U: 'Blue', B: 'Black', R: 'Red', G: 'Green', C: 'Colorless'
    };

    Object.entries(colorCount).forEach(([color, count]) => {
      if (count > 0) {
        const percentage = ((count / this.deck.totalCards) * 100).toFixed(1);
        distribution += `  ${colorNames[color]}: ${count} (${percentage}%)\n`;
      }
    });

    return distribution + '\n';
  }

  private getManaCurve(): string {
    const curve: Record<number, number> = {};

    this.deck.cards.forEach(deckCard => {
      const card = this.cards.get(deckCard.name);
      if (card) {
        const cmc = Math.min(card.cmc, 7); // Cap at 7+
        curve[cmc] = (curve[cmc] || 0) + deckCard.quantity;
      }
    });

    let curveDisplay = 'Mana Curve:\n';
    for (let i = 0; i <= 7; i++) {
      const count = curve[i] || 0;
      const bar = '█'.repeat(Math.floor(count / 2));
      const label = i === 7 ? '7+' : i.toString();
      curveDisplay += `  ${label}: ${bar} ${count}\n`;
    }

    return curveDisplay + '\n';
  }

  private getTypeDistribution(): string {
    const types: Record<string, number> = {
      Creature: 0,
      Instant: 0,
      Sorcery: 0,
      Enchantment: 0,
      Artifact: 0,
      Planeswalker: 0,
      Land: 0,
      Other: 0
    };

    this.deck.cards.forEach(deckCard => {
      const card = this.cards.get(deckCard.name);
      if (card) {
        let categorized = false;
        Object.keys(types).forEach(type => {
          if (card.type_line.includes(type)) {
            types[type] += deckCard.quantity;
            categorized = true;
          }
        });
        if (!categorized) {
          types.Other += deckCard.quantity;
        }
      }
    });

    let typeDisplay = 'Card Types:\n';
    Object.entries(types).forEach(([type, count]) => {
      if (count > 0) {
        const percentage = ((count / this.deck.totalCards) * 100).toFixed(1);
        typeDisplay += `  ${type}: ${count} (${percentage}%)\n`;
      }
    });

    return typeDisplay + '\n';
  }

  private getAverageCMC(): string {
    let totalCMC = 0;
    let nonLandCards = 0;

    this.deck.cards.forEach(deckCard => {
      const card = this.cards.get(deckCard.name);
      if (card && !card.type_line.includes('Land')) {
        totalCMC += card.cmc * deckCard.quantity;
        nonLandCards += deckCard.quantity;
      }
    });

    const avgCMC = nonLandCards > 0 ? (totalCMC / nonLandCards).toFixed(2) : '0';
    return `Average CMC (non-land): ${avgCMC}\n`;
  }

  /**
   * Display full deck list with card details
   */
  displayDeckList(): string {
    let output = '\n=== DECK LIST ===\n\n';

    this.deck.cards.forEach(deckCard => {
      const card = this.cards.get(deckCard.name);
      if (card) {
        output += `${deckCard.quantity}x ${card.name}\n`;
        output += `   ${card.type_line} | ${card.mana_cost || 'N/A'} | CMC: ${card.cmc}\n`;
        if (card.oracle_text) {
          const shortText = card.oracle_text.substring(0, 80);
          output += `   ${shortText}${card.oracle_text.length > 80 ? '...' : ''}\n`;
        }
        output += '\n';
      } else {
        output += `${deckCard.quantity}x ${deckCard.name} (Card data not found)\n\n`;
      }
    });

    return output;
  }
}
