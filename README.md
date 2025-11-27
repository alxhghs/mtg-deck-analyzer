# MTG Deck Builder

A TypeScript Node.js application that analyzes Magic: The Gathering decklists by fetching card data from the Scryfall API and providing detailed deck statistics.

## Features

- 📋 Parse decklist files in common formats
- 🌐 Fetch card data from Scryfall API
- 💾 Cache card data locally in JSON files
- 📊 Analyze deck composition:
  - Color distribution
  - Mana curve
  - Card type breakdown
  - Average CMC
- 🤖 Ready for AI-powered recommendations via GitHub Copilot Chat

## Installation

```bash
npm install
```

## Usage

### Analyze a Deck

```bash
npm run dev example-deck.txt
```

Or build and run:

```bash
npm run build
npm start example-deck.txt
```

### Decklist Format

The parser supports multiple common decklist formats:

```
# Comments start with # or //

# Quantity first (with or without 'x')
4 Lightning Bolt
4x Monastery Swiftspear

# Card name only (defaults to 1)
Mountain

# Section headers are ignored
Mainboard:
4 Lightning Bolt

Sideboard:
3 Abrade
```

## Project Structure

```
mtg-deck-builder/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── scryfall-client.ts    # Scryfall API client
│   ├── card-cache.ts         # JSON file caching system
│   ├── deck-parser.ts        # Decklist parser
│   └── deck-analyzer.ts      # Deck analysis logic
├── cache/                     # Card cache directory (auto-created)
│   └── cards.json            # Cached card data
├── example-deck.txt          # Sample decklist
├── package.json
└── tsconfig.json
```

## How It Works

1. **Parse Decklist**: Reads a text file and extracts card names and quantities
2. **Check Cache**: Looks for previously fetched cards in the local cache
3. **Fetch Missing Cards**: Retrieves card data from Scryfall API for uncached cards
4. **Update Cache**: Saves newly fetched cards to cache for future use
5. **Analyze Deck**: Generates statistics and visualizations
6. **Display Results**: Shows deck composition and suggestions for AI analysis

## Using with GitHub Copilot Chat

After running the analyzer, use GitHub Copilot Chat in VS Code to get AI-powered deck recommendations:

### Example Prompts

- "Based on this deck analysis, what cards would improve the mana curve?"
- "What are this deck's weaknesses against control decks?"
- "Suggest 5 sideboard cards for this strategy"
- "How can I improve the consistency of this deck?"
- "What are some budget alternatives for the expensive cards?"
- "Analyze this deck's matchup against aggro/midrange/control"

The analyzer provides all the deck data in an easy-to-read format that Copilot can understand and analyze.

## API

The application uses the [Scryfall API](https://scryfall.com/docs/api) to fetch card data. The API is free and doesn't require authentication, but please be respectful:

- Includes 100ms delay between requests
- Caches all fetched cards to minimize API calls
- Follows Scryfall's rate limiting guidelines

## Cache Management

Card data is automatically cached in `./cache/cards.json`. This:
- Speeds up repeated deck analyses
- Reduces API calls
- Works offline for previously fetched cards

To clear the cache, simply delete the `cache` directory.

## Scripts

- `npm run dev <file>` - Run with ts-node (development)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start <file>` - Run compiled JavaScript
- `npm run analyze <file>` - Build and run in one command

## Example Output

```
🎴 MTG Deck Analyzer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Loading decklist from: /path/to/example-deck.txt

Found 14 unique cards (60 total)

📦 0 cards found in cache
🌐 Fetching 14 cards from Scryfall API...

✅ Successfully loaded 14 cards

=== DECK ANALYSIS ===

Total Cards: 60
Unique Cards: 14

Color Distribution:
  Red: 40 (66.7%)
  Colorless: 20 (33.3%)

Mana Curve:
  0: 0
  1: ████ 8
  2: ████████ 16
  3: ████████ 16
  ...
```

## License

ISC
