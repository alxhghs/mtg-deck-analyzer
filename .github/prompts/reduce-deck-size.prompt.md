---
title: Reduce Deck Size
description: Analyze a deck and recommend cards to cut to reach target deck size
---

# Reduce Deck Size

You are helping the user reduce their Magic: The Gathering deck to a specific size by recommending cards to cut.

## Process

1. **Identify the deck**: Ask which deck the user wants to reduce if not clear from context

2. **Read current deck files**:
    - Read the main decklist: `decks/<format>/<deck-name>/moxfield.txt`
    - Read the organized version if it exists: `decks/<format>/<deck-name>/organized.txt`
    - Count the current number of cards in the mainboard (exclude commander and sideboard)

3. **Determine target size**:
    - For Commander/EDH: 99 cards in mainboard (plus 1 commander)
    - For other formats: Ask the user what their target deck size is

4. **Read the deck's cache file** for detailed card information:
    - `decks/<format>/<deck-name>/moxfield-cache.json`
    - This contains the oracle text, mana costs, types, and abilities for every card

5. **Analyze and recommend cuts**:
    - Calculate how many cards need to be cut
    - Consider the deck's strategy from the organized file (if available)
    - Identify cards to cut based on:
        - **Redundancy**: Multiple cards with similar effects
        - **Mana curve**: Cards that create awkward curves
        - **Power level**: Weakest cards relative to strategy
        - **Synergy**: Cards that don't fit the main strategy
        - **Land count**: Overabundance of lands (especially slow/tapped lands)
    - Use the cache file's oracle text to understand exact card abilities
    - Group recommendations by category (e.g., "Weak creatures", "Inefficient removal", "Tapped lands")

6. **Present recommendations clearly**:
    - List each recommended cut with a brief explanation
    - Show before/after card count
    - Organize by category or priority
    - Reference specific card abilities from the cache when explaining cuts

7. **Wait for user approval**:
    - **DO NOT create any files yet**
    - Ask the user to review the recommendations
    - The user may ask for adjustments, alternatives, or approve the cuts

8. **After user accepts** the recommendations:
    - Create a timestamped decklist file: `decks/<format>/<deck-name>/YYYYMMDD-HHMM-reduced.txt`
    - Use the current date and time for the timestamp
    - Copy the deck structure (organized by category if using organized.txt as base)
    - Remove the recommended cuts
    - Include a header explaining what was cut and why:
        ```
        # <Deck Name> - Reduced to <N> Cards
        # Created: <timestamp>
        # Based on: moxfield.txt
        # Goal: Reduce deck to <target> cards
        # Cards Cut (<X>): <list of cut cards>
        # Strategy: <brief note on what was prioritized>
        ```

## Example Interaction

**User**: "Help me get my blood-rites deck down to 99 cards"

**You should**:

1. Read `decks/commander/blood-rites/moxfield.txt`
2. Read `decks/commander/blood-rites/organized.txt`
3. Read `decks/commander/blood-rites/moxfield-cache.json`
4. Count current cards (e.g., "You currently have 113 cards, need to cut 14")
5. Analyze using cache data to understand card abilities
6. Present 14 recommended cuts with explanations
7. Wait for approval
8. Only after approval: Create `decks/commander/blood-rites/20251127-1430-reduced.txt`

## Important Notes

- **Never create files until the user explicitly approves** the recommendations
- Always reference the per-deck cache file for accurate card information
- Consider the deck's overall strategy when making cut recommendations
- Provide clear reasoning for each cut
- Be prepared to discuss alternatives if the user disagrees with specific cuts
- The timestamp format is: `YYYYMMDD-HHMM` (e.g., `20251127-1430`)
