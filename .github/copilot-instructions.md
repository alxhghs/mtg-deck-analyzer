# MTG Deck Builder - GitHub Copilot Instructions

## Project Overview

This is a TypeScript Node.js application that analyzes Magic: The Gathering (MTG) decklists by:

- Fetching card data from Scryfall API
- Importing decks from Moxfield
- Caching card data locally in JSON
- Analyzing deck composition (mana curve, color distribution, card types)
- Providing deck statistics for AI-powered recommendations via GitHub Copilot Chat

## Tech Stack

- TypeScript with strict mode
- Node.js with axios for HTTP requests
- File-based JSON caching
- Scryfall API for card data
- Moxfield API for deck imports

## Key Components

### Card Data (`src/scryfall-client.ts`)

- Fetches card details from Scryfall API
- Includes 100ms delay between requests (API requirement)
- Maps Scryfall response to internal Card interface

### Caching (`src/card-cache.ts`)

- Stores fetched cards in `cache/cards.json`
- Reduces API calls by caching previously fetched cards
- Saves timestamp for each cached card

### Deck Parsing (`src/deck-parser.ts`)

- Supports formats: "4 Card Name", "4x Card Name", or just "Card Name"
- Ignores comments (lines starting with # or //)
- Handles section headers (Mainboard:, Sideboard:, Commander:)

### Moxfield Import (`src/moxfield-client.ts`)

- Fetches public decks from Moxfield API
- Converts Moxfield format to local decklist format
- Auto-organizes by format (standard/modern/commander/other)

### Analysis (`src/deck-analyzer.ts`)

- Color distribution
- Mana curve visualization
- Card type breakdown
- Average CMC calculation

## Deck Organization

Each deck is stored in its own folder within the format directory:

- `decks/standard/deck-name/` - Standard format decks
- `decks/modern/deck-name/` - Modern format decks
- `decks/commander/deck-name/` - Commander/EDH decks
- `decks/other/deck-name/` - Other formats (Pioneer, Legacy, Pauper, etc.)

Within each deck folder:

- `moxfield.txt` - Original imported decklist from Moxfield
- Additional variant files can be created for different configurations (e.g., `budget.txt`, `competitive.txt`, `cuts.txt`)

## Usage Commands

- `npm run import <moxfield-url> [deck-name]` - Import from Moxfield to `decks/<format>/<deck-name>/`
- `npm run dev <deck-folder>/moxfield.txt` - Analyze a deck (development mode)
- `npm run build` - Compile TypeScript
- `npm start <deck-file>` - Run compiled version

## AI Recommendations Workflow

1. User runs deck analysis to get statistics
2. User opens GitHub Copilot Chat in VS Code
3. User asks questions about deck improvements, weaknesses, or strategies
4. Copilot uses the deck analysis output visible in the terminal/editor

## When User Asks About a Specific Deck

When the user asks about a deck by name (e.g., "help me get the blood-rites deck down to 100 cards"), you should:

1. **First, check if the deck folder exists** in `decks/` directories
    - Search for the deck folder using `file_search` or `list_dir`
    - Common locations: `decks/commander/<deck-name>/`, `decks/standard/<deck-name>/`, etc.
    - The main decklist is in `moxfield.txt` within the deck folder

2. **If deck exists locally:**
    - Run `npm run dev decks/<format>/<deck-name>/moxfield.txt` to analyze it
    - Read the deck file to see current card list
    - Read `cache/cards.json` to access detailed card information for recommendations

3. **If deck doesn't exist or user wants to update from Moxfield:**
    - Ask user for Moxfield URL if not clear from context
    - Run `npm run import <moxfield-url> <deck-name>` (optional deck name, will use Moxfield name if omitted)
    - Then run analysis: `npm run dev decks/<format>/<deck-name>/moxfield.txt`
    - Read `cache/cards.json` for card details

4. **Use the cached card data for recommendations:**
    - Read `cache/cards.json` to access all card details (mana cost, type, abilities, colors)
    - Consider the deck's mana curve, color distribution, and card types from analysis
    - Make specific, data-driven recommendations based on actual card information

5. **For deck reduction requests (getting to exactly 100 cards, etc.):**
    - Count current cards in the deck
    - Identify redundant effects or weakest cards
    - Suggest specific cuts based on mana curve, redundancy, or strategy fit
    - Reference actual card data from cache to justify recommendations
    - Create variant files in the same deck folder with different configurations (e.g., `cuts-recommendation.txt`, `budget-version.txt`)

## Card Categorization and Tagging

When organizing cards by function (for variant decklists or analysis), use these standard categories:

### Core Categories

- **Ramp** - Mana acceleration (Sol Ring, Arcane Signet, land ramp spells)
- **Draw** - Card advantage (draw spells, draw engines)
- **Removal** - Creature removal (single target, board wipes)
- **Interaction** - Counterspells, instant-speed responses
- **Recursion** - Graveyard recursion, reanimation
- **Protection** - Cards that protect your permanents (boots, hexproof)
- **Tutors** - Cards that search your library
- **Win Cons** - Primary win condition cards
- **Synergy** - Cards that synergize with the deck's strategy
- **Utility** - Miscellaneous useful effects

### Commander-Specific Categories

- **Commander Support** - Cards that specifically support your commander
- **Sac Outlets** - Sacrifice outlets for aristocrats/value strategies
- **Token Generation** - Token producers
- **Board Wipes** - Mass removal effects
- **Lands** - Include subcategories (basics, duals, utility lands)

### Format for Organized Decklists

When creating organized variant files, use this format:

```
# Deck Name - Organized by Function

## Ramp (10)
1 Sol Ring
1 Arcane Signet
...

## Draw (8)
1 Rhystic Study
...

## Removal (12)
1 Swords to Plowshares
...
```

Include card counts per category to help track deck balance.

## Coding Conventions

- Use async/await for asynchronous operations
- Handle errors with try/catch and informative messages
- Use fs module for file operations
- Follow TypeScript strict typing
- Keep API rate limiting in mind (Scryfall requires delays)

## When Helping Users

- For deck recommendations: analyze the deck statistics and suggest cards based on:
    - Mana curve gaps
    - Color balance
    - Missing card types (removal, card draw, ramp, etc.)
    - Format-specific staples
    - Budget constraints if mentioned
- For code changes: maintain existing architecture and conventions
- For new features: consider caching, API limits, and error handling
