import * as path from 'path';
import { ScryfallClient } from './scryfall-client';
import { CardCache } from './card-cache';
import { DeckParser } from './deck-parser';
import { DeckAnalyzer } from './deck-analyzer';
import { Card } from './types';

async function main() {
  // Get decklist file from command line arguments
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: npm start <decklist-file>');
    console.log('Example: npm start example-deck.txt');
    process.exit(1);
  }

  const decklistPath = path.resolve(args[0]);
  
  console.log(`\n🎴 MTG Deck Analyzer`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Loading decklist from: ${decklistPath}\n`);

  try {
    // Parse the decklist
    const deck = DeckParser.parseDecklist(decklistPath);
    const uniqueCardNames = DeckParser.getUniqueCardNames(deck);
    
    console.log(`Found ${deck.cards.length} unique cards (${deck.totalCards} total)\n`);

    // Initialize cache and API client
    const cache = new CardCache();
    const client = new ScryfallClient();

    // Check which cards we need to fetch
    const cardsToFetch: string[] = [];
    const cachedCards = new Map<string, Card>();

    uniqueCardNames.forEach(name => {
      const cached = cache.get(name);
      if (cached) {
        cachedCards.set(name, cached);
      } else {
        cardsToFetch.push(name);
      }
    });

    console.log(`📦 ${cachedCards.size} cards found in cache`);
    
    if (cardsToFetch.length > 0) {
      console.log(`🌐 Fetching ${cardsToFetch.length} cards from Scryfall API...\n`);
      
      // Fetch cards from API
      const fetchedCards = await client.getCardsByNames(cardsToFetch);
      
      // Add to cache
      if (fetchedCards.size > 0) {
        cache.setMany(fetchedCards);
      }

      // Merge with cached cards
      fetchedCards.forEach((card, name) => {
        cachedCards.set(name, card);
      });
    }

    console.log(`\n✅ Successfully loaded ${cachedCards.size} cards\n`);

    // Analyze the deck
    const analyzer = new DeckAnalyzer(deck, cachedCards);
    
    // Display analysis
    console.log(analyzer.analyze());
    
    // Display full deck list
    console.log(analyzer.displayDeckList());

    // Instructions for AI recommendations
    console.log('\n=== DECK RECOMMENDATIONS ===\n');
    console.log('To get AI-powered deck recommendations:');
    console.log('1. Review the deck analysis above');
    console.log('2. Open GitHub Copilot Chat in VS Code');
    console.log('3. Ask questions like:');
    console.log('   - "What cards would improve this deck\'s mana curve?"');
    console.log('   - "Suggest removal spells for this deck"');
    console.log('   - "What are the deck\'s weaknesses?"');
    console.log('   - "Recommend sideboard cards for this strategy"\n');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the application
main();
