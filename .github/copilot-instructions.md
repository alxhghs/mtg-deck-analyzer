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

- Stores fetched cards in per-deck cache files (e.g., `moxfield-cache.json`)
- Each deck gets its own cache file in the same directory as the deck file
- Cache files are small (~30-60KB) and contain minimal card data:
    - `name`, `mana_cost`, `cmc`, `type_line`, `oracle_text`, `colors`, `color_identity`
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
- `moxfield-cache.json` - Per-deck card cache with minimal card data (auto-generated)
- `organized.txt` - Deck organized by card function (optional)
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

## Card Counting Tool

**ALWAYS use the card counting tool before finalizing deck recommendations!**

The `card-counter.ts` utility provides accurate card counting and validation:

```bash
# Count cards in any decklist
npx ts-node src/card-counter.ts decks/commander/blood-rites/moxfield.txt

# Validate category counts match headers
npx ts-node src/card-counter.ts decks/commander/blood-rites/organized.txt --validate
```

**When to use:**

- Before suggesting cuts (to know exact current count)
- After creating variant files (to verify final count)
- When validating organized decklists (to ensure category headers are correct)
- When user questions your card count

**The tool:**

- Counts total cards and unique cards
- Breaks down counts by category
- Validates category headers match actual card counts
- Handles all deck formats (4 Card Name, 4x Card Name, Card Name)

## When User Asks About a Specific Deck

When the user asks about a deck by name (e.g., "help me get the blood-rites deck down to 100 cards"), you should:

1. **First, check if the deck folder exists** in `decks/` directories
    - Search for the deck folder using `file_search` or `list_dir`
    - Common locations: `decks/commander/<deck-name>/`, `decks/standard/<deck-name>/`, etc.
    - The main decklist is in `moxfield.txt` within the deck folder

2. **If deck exists locally:**
    - Run `npm run dev decks/<format>/<deck-name>/moxfield.txt` to analyze it
    - Read the deck file to see current card list
    - **Read `decks/<format>/<deck-name>/moxfield-cache.json`** to access detailed card information for recommendations
    - The cache file contains minimal but complete card data: mana cost, type, oracle text, colors

3. **If deck doesn't exist or user wants to update from Moxfield:**
    - Ask user for Moxfield URL if not clear from context
    - Run `npm run import <moxfield-url> <deck-name>` (optional deck name, will use Moxfield name if omitted)
    - Then run analysis: `npm run dev decks/<format>/<deck-name>/moxfield.txt`
    - **Read `decks/<format>/<deck-name>/moxfield-cache.json`** for card details

4. **Use the per-deck cached card data for recommendations:**
    - **ALWAYS read the deck's own cache file:** `decks/<format>/<deck-name>/<deckfile>-cache.json`
    - Each deck has its own cache file (e.g., `moxfield-cache.json`, `organized-cache.json`)
    - Cache contains minimal essential data: `name`, `mana_cost`, `cmc`, `type_line`, `oracle_text`, `colors`, `color_identity`
    - Cache files are small (~30-60KB, ~1000-2000 lines) and fit comfortably in context windows
    - Use this data to make specific, accurate recommendations based on actual card abilities and interactions
    - Consider the deck's mana curve, color distribution, and card types from analysis
    - Reference oracle text to understand card synergies and combos

5. **For deck reduction requests (getting to exactly 100 cards, etc.):**
    - **USE THE CARD COUNTER TOOL FIRST:** `npx ts-node src/card-counter.ts <deck-file>`
    - Verify the exact current card count before making recommendations
    - **Read the deck's cache file** to understand what each card does
    - Identify redundant effects or weakest cards by comparing oracle text
    - Suggest specific cuts based on mana curve, redundancy, or strategy fit
    - Reference actual card data from the per-deck cache to justify recommendations
    - Create variant files in the same deck folder with different configurations (e.g., `cuts-recommendation.txt`, `budget-version.txt`)

## Creating Deck Recommendations and Variants

When the user asks for deck recommendations or wants to try different strategies, create timestamped variant files:

### File Naming Convention

Use this format: `YYYYMMDD-HHMM-description.txt`

Examples:

- `20251127-1430-drain-focus.txt` - Focus on drain effects
- `20251127-1445-budget-version.txt` - Budget-friendly version
- `20251127-1500-aggro-variant.txt` - More aggressive build
- `20251127-1515-cuts-to-100.txt` - Cuts to reach 100 cards

### Creating Recommendation Files

1. **Use the card counter tool** to get accurate baseline counts
2. **Analyze the current deck** (read moxfield.txt and organized.txt if available)
3. **Understand the request** (more aggro, budget, specific theme, etc.)
4. **Create a new timestamped file** in the deck folder with your recommendations
5. **Verify your recommendation** with the card counter tool before finalizing
6. **Create a new timestamped file** in the deck folder with your recommendations
7. **Use the same format as organized.txt** with categories and card counts
8. **Include a header explaining the changes:**

```
# <Deck Name> - <Variant Description>
# Created: <timestamp>
# Based on: moxfield.txt
# Goal: <description of what this variant aims to achieve>
# Changes: <summary of major changes>

## Category Name (X)
1 Card Name
...
### Best Practices

- **ALWAYS use card counter tool**: Verify counts before and after creating recommendations
- **Keep history**: Never delete old recommendation files - they serve as version history
- **Be specific**: Include detailed explanations in the header about why changes were made
- **Reference cards by name**: Make it easy to compare with other versions
- **Track the delta**: Mention what cards were added/removed compared to the base deck
- **Timestamp everything**: Use current date/time for the filename (YYYYMMDD-HHMM format)
- **Descriptive names**: Use clear, concise descriptions (drain-focus, token-heavy, control-build, etc.)
- **Validate organized files**: Use `--validate` flag to ensure category counts are accurate
- **Timestamp everything**: Use current date/time for the filename (YYYYMMDD-HHMM format)
- **Descriptive names**: Use clear, concise descriptions (drain-focus, token-heavy, control-build, etc.)

### Example Workflow

User: "Make the blood-rites deck more focused on drain effects"

You should:

1. Read `decks/commander/blood-rites/moxfield.txt` and `organized.txt`
2. Analyze current drain effects in the deck
3. Create `decks/commander/blood-rites/20251127-1430-drain-focus.txt`
4. Include more drain payoffs, cut non-synergistic cards
5. Explain the changes in the header
6. Organize by categories like the organized.txt format

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

## Commander (1)

1 Commander Name

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

## Stats

Total Cards: 99
Unique Cards: 87

Card Types:
Creature: 30 (30.3%)
Instant: 10 (10.1%)
Sorcery: 8 (8.1%)
Enchantment: 6 (6.1%)
Artifact: 8 (8.1%)
Planeswalker: 1 (1.0%)
Land: 36 (36.4%)

```

Include card counts per category to help track deck balance.

**ALWAYS include stats at the bottom of every generated decklist:**
- Run the card counter tool after creating the file
- Add a `## Stats` section at the end with the breakdown
- Format: Total Cards, Unique Cards, then Card Types with counts and percentages
- Calculate percentages as (count / total) * 100, rounded to 1 decimal place

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
```
