# Deck Organization

This directory contains all your MTG decklists organized by format.

## Directory Structure

```
decks/
├── standard/          # Standard format decks
├── modern/            # Modern format decks
├── commander/         # Commander/EDH decks
└── other/             # Other formats (Pioneer, Legacy, Pauper, etc.)
```

## Naming Convention

Use descriptive names for your deck files:
- `red-deck-wins.txt`
- `azorius-control.txt`
- `elves-combo.txt`
- `kess-storm.txt` (for Commander)

## Decklist Format

All decklists support the following formats:

```
# Comments start with # or //

# Quantity + card name
4 Lightning Bolt
4x Monastery Swiftspear

# Card name only (defaults to 1)
Mountain

# Section headers (optional)
Mainboard:
4 Lightning Bolt

Sideboard:
3 Abrade
```

## Importing from Moxfield

Import your decks directly from Moxfield (must be public):

```bash
npm run import https://www.moxfield.com/decks/abc123xyz
npm run import abc123xyz
```

The deck will be automatically saved to the correct format folder.

## Analyzing a Deck

```bash
npm run dev decks/standard/red-deck-wins.txt
npm run dev decks/modern/elves-combo.txt
npm run dev decks/commander/kess-storm.txt
```

## Getting AI Recommendations

After analyzing a deck:
1. Review the deck analysis output
2. Open GitHub Copilot Chat
3. Ask for specific recommendations:
   - "What improvements would you suggest for this deck?"
   - "What are good sideboard options against control?"
   - "How can I improve the mana base?"
   - "What budget alternatives exist for expensive cards?"
