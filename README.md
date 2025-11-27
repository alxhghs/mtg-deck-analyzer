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

### Import from Moxfield

Import decks directly from Moxfield (must be public):

```bash
# Using full URL
npm run import https://www.moxfield.com/decks/abc123xyz

# Using just the deck ID
npm run import abc123xyz

# Specify custom output path
npm run import abc123xyz decks/modern/my-deck.txt

# Force refresh (bypass 1-hour cache)
npm run import -- abc123xyz --force
```

**Caching:** Deck imports are cached for 1 hour. Subsequent imports within that time will use the cached version unless you use the `--force` flag.

The deck will be automatically saved to the appropriate format folder based on its format.

### Analyze a Deck

```bash
npm run dev decks/standard/red-deck-wins.txt
npm run dev decks/modern/your-deck.txt
npm run dev decks/commander/your-commander.txt
```

Or build and run:

```bash
npm run build
npm start decks/standard/red-deck-wins.txt
```

### Organizing Your Decks

Store your decklists in the `decks/` directory, organized by format:

- `decks/standard/` - Standard format
- `decks/modern/` - Modern format
- `decks/commander/` - Commander/EDH
- `decks/other/` - Pioneer, Legacy, Pauper, etc.

See `decks/README.md` for more details.

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
├── decks/                     # Your deck collection
│   ├── standard/             # Standard format decks
│   │   └── deck-name/
│   │       ├── moxfield.txt          # Deck list
│   │       └── moxfield-cache.json   # Per-deck card cache
│   ├── modern/               # Modern format decks
│   ├── commander/            # Commander/EDH decks
│   ├── other/                # Other formats
│   └── README.md             # Deck organization guide
├── cache/                     # Global cache directory (legacy)
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

Card data is automatically cached per-deck in `<deck-name>-cache.json` files next to each decklist. This approach:

- **Keeps cache files small** - Each deck has only the cards it needs (~30-60KB)
- **Fits in AI context windows** - Small cache files can be read by Copilot for better recommendations
- **Speeds up repeated analyses** - No need to re-fetch cards
- **Works offline** - Previously analyzed decks work without internet

Each deck gets its own cache file (e.g., `moxfield-cache.json`, `organized-cache.json`) containing minimal card data:

- Card name, mana cost, CMC
- Type line and oracle text
- Colors and color identity

To clear a deck's cache, delete its `*-cache.json` file.

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
