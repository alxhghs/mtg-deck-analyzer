---
title: Update Deck
description: Import a deck from Moxfield and create an organized decklist
agent: agent
model: Claude Sonnet 4
---

# Update Deck from Moxfield

You are helping the user update a Magic: The Gathering deck by importing it from Moxfield and creating an organized version.

## Steps to Follow

1. **Import the deck from Moxfield**
    - Run: `npm run import <moxfield-url-or-id> [deck-name] [--force]`
    - The deck will be saved to `decks/<format>/<deck-name>/moxfield.txt`
    - Note the deck folder path from the output

2. **Analyze the deck**
    - Run: `npm run dev <deck-folder>/moxfield.txt`
    - This provides card details, mana curve, color distribution, and card types
    - Review the analysis output to understand the deck's strategy

3. **Read the cached card data**
    - Read `cache/cards.json` to access detailed card information
    - This includes card types, oracle text, mana costs, and abilities

4. **Create the organized decklist**
    - Create a new file: `<deck-folder>/organized.txt`
    - Organize cards by functional categories (see categories below)
    - **IMPORTANT:** Calculate the total mainboard cards (exclude sideboard) for the Total line
    - For Commander decks: Total = Commander + Mainboard (typically 100)
    - For Standard/Modern decks: Total = Mainboard only (typically 60)
    - Use this format:

```
# <Deck Name> - Organized by Function
# Commander: <Commander Name> (for Commander format)
# Format: <format>
# Total: <X> cards (mainboard only, exclude sideboard)

## Category Name (X)
1 Card Name
4 Another Card Name
...

## Next Category (Y)
...
```

## Card Categories

Use these standard categories based on deck type and format:

### Commander Deck Categories

- **Commander** - The commander(s)
- **Ramp** - Mana acceleration (Sol Ring, Arcane Signet, land ramp spells, mana rocks)
- **Draw** - Card advantage (draw spells, draw engines)
- **Tutors** - Cards that search your library
- **Removal** - Single target removal (creature removal, artifact/enchantment removal)
- **Board Wipes** - Mass removal effects
- **Interaction** - Counterspells, instant-speed responses
- **Recursion** - Graveyard recursion, reanimation
- **Protection** - Cards that protect your permanents
- **Win Cons/Finishers** - Primary win condition cards
- **Tribal Synergy** - Tribal payoffs and synergy pieces
- **Token Generation** - Token producers
- **Sac Outlets** - Sacrifice outlets
- **Lifegain/Drain Engines** - Life gain and life drain effects
- **Utility/Support** - Miscellaneous useful effects
- **Lands** - All lands (organize by subcategories if many: duals, utility, basics)

### Standard/Modern Deck Categories

- **Early Game Threats** - 1-2 CMC aggressive creatures
- **Mid-Range Threats** - 3-4 CMC creatures
- **Finishers** - Late game threats
- **Removal/Burn** - Removal spells and burn
- **Card Advantage** - Draw spells and card advantage engines
- **Planeswalkers** - Planeswalker cards
- **Sideboard** - Sideboard cards (if applicable)
- **Lands** - All lands

## Important Notes

- Count cards in each category and include totals: `## Ramp (10)`
- Some cards may fit multiple categories - use your best judgment based on primary function
- Keep the deck's strategy in mind when categorizing
- Reference the card cache for accurate information about card abilities
- Include ALL cards from the moxfield.txt file in the organized version
- Maintain the same card quantities (if a card appears 4x in moxfield.txt, it should be 4x in organized.txt)

## Example Interaction

User: `/update https://www.moxfield.com/decks/abc123xyz`

You should:

1. Run the import command
2. Analyze the deck
3. Read card data from cache
4. Create the organized.txt file with proper categorization
5. Confirm completion with a brief summary of the deck's strategy and card counts

User: `/update blood-rites --force`

You should:

1. Find the existing blood-rites deck folder
2. Run import with --force to refresh from Moxfield
3. Follow steps 2-5 above
4. Update the existing organized.txt file
