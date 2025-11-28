---
title: Optimize Deck (AI Multi-Analysis)
description: Run AI deck analysis 100 times with different priorities to find statistically optimal card selection
agent: agent
model: Claude Sonnet 4.5
---

# Optimize Deck (AI Multi-Analysis)

You are helping the user find the statistically optimal version of their Magic: The Gathering deck by running the deck reduction analysis **100 times** (or a user-specified number) with different strategic priorities, then aggregating the results to find which cards appear most frequently.

## High-Level Process

1. Identify the deck and target size
2. Create a timestamped output folder for all iterations
3. Run the reduction analysis N times (default: 100) with varying priorities
4. Track which cards are kept across all iterations
5. Generate consolidated "BEST" list based on frequency
6. Create analysis report with recommendations

## Detailed Steps

**⚠️ CRITICAL: WORK SILENTLY THROUGH ITERATIONS**

- **DO NOT** provide summaries or explanations for each iteration in chat
- **DO NOT** describe what you're cutting or why during iterations
- **ONLY** show brief progress updates like "Completed 10/100 iterations..."
- **SAVE** all analysis and reasoning to the iteration files themselves
- **PROVIDE** a comprehensive summary ONLY at the end after all iterations complete
- The user wants speed and efficiency - verbose iteration commentary slows down the process significantly

### 1. Setup Phase

**Identify the deck:**

- Ask which deck to optimize if not clear from context
- Verify deck exists: `decks/<format>/<deck-name>/moxfield.txt`
- Verify cache exists: `decks/<format>/<deck-name>/moxfield-cache.json`
- Count current cards and determine how many to cut

**Determine parameters:**

- **Target size**: Default 100 for Commander (99 mainboard + 1 commander), ask for other formats
- **Number of iterations**: Default 100, user can request 50, 200, etc.
- **Output folder**: Create `decks/<format>/<deck-name>/YYYYMMDD-HHMM-ai-optimize/`

### 2. Iteration Phase (Repeat N Times)

For each iteration (1 through N):

**A. Vary the cutting priority/perspective:**

Each iteration should use a **different strategic lens** for analysis. Rotate through these approaches:

1. **Mana Curve Focus** (Iterations 1-10)
    - Prioritize smooth mana curve
    - Cut redundant CMC slots
    - Favor efficient spells

2. **Synergy Focus** (Iterations 11-20)
    - Maximize deck synergies
    - Cut cards that don't fit main strategy
    - Prioritize combo pieces

3. **Removal/Interaction Focus** (Iterations 21-30)
    - Preserve interaction and removal
    - Cut win-more cards
    - Prioritize answers over threats

4. **Card Advantage Focus** (Iterations 31-40)
    - Keep card draw engines
    - Cut redundant effects
    - Prioritize value generation

5. **Speed/Efficiency Focus** (Iterations 41-50)
    - Cut slow cards
    - Keep fast mana
    - Prioritize low CMC spells

6. **Resilience Focus** (Iterations 51-60)
    - Keep protection and recursion
    - Cut fragile strategies
    - Prioritize survival tools

7. **Power Level Focus** (Iterations 61-70)
    - Keep highest power level cards
    - Cut budget/weak cards
    - Prioritize staples

8. **Commander Support Focus** (Iterations 71-80)
    - Maximize commander synergy
    - Cut cards that don't support commander
    - Prioritize commander protection

9. **Land Optimization Focus** (Iterations 81-90)
    - Optimize land count and quality (MAINTAIN 37-38 lands for Commander)
    - Cut ONLY poor utility lands or excessive basics if curve is very low
    - Balance color fixing vs utility
    - **WARNING**: These iterations should rarely cut below 37 lands in Commander

10. **Balanced/Holistic Focus** (Iterations 91-100)
    - Consider all factors equally
    - Cut weakest overall cards
    - Maintain deck balance

**B. For each iteration, analyze and recommend cuts:**

Use the **same analytical process as reduce-deck-size**:

1. Read the deck's cache file for card details
2. Consider the current iteration's focus/priority
3. Identify exactly N cards to cut (where N = current size - target size)
4. Provide brief reasoning based on current focus

**CRITICAL: Maintain Proper Land Counts**

- **Commander decks need 37-38 lands minimum** (never go below 37)
- **Standard/Modern decks need 23-26 lands minimum** (never go below 22)
- **Land cuts should be RARE and only when:**
    - Deck has exceptionally low mana curve (avg CMC < 2.5)
    - Deck has 15+ mana rocks/dorks providing alternative sources
    - You're cutting utility lands that underperform, not core manabase
- **When in doubt, keep lands over spells**
- **Count lands carefully** - don't accidentally cut more lands than intended
- **Prioritize cutting spells** when reducing deck size, not lands

**C. Create iteration file:**

Save to: `decks/<format>/<deck-name>/YYYYMMDD-HHMM-ai-optimize/iteration-XXX.txt`

Format:

```
# Iteration XXX - <Focus Name>
# Generated: <timestamp>
# Priority: <description of what this iteration optimized for>
# Target size: 100

## Creature (X)
1 Card Name
...

## Instant (X)
...

[All card types organized by category]

## Stats
Total Cards: 100
Unique Cards: X

## Cards Cut This Iteration (X)
- Card Name 1 - Reason
- Card Name 2 - Reason
...
```

**D. MANDATORY VALIDATION after creating each iteration file:**

After creating each iteration file, you MUST validate it immediately:

```bash
npx ts-node src/ai-optimize-deck.ts validate decks/<format>/<deck-name>/YYYYMMDD-HHMM-ai-optimize/iteration-XXX.txt
```

If validation fails:

- **STOP immediately**
- **Fix the iteration file** to have exactly 100 cards and 35-38 lands
- **Re-validate** before continuing
- **DO NOT proceed to the next iteration** until current one passes validation

This validation step is **NON-NEGOTIABLE** and prevents accumulating errors across iterations.

**E. Progress tracking:**

- Show progress every 10 iterations: "Completed 10/100 iterations..."
- Include iteration focus: "Iteration 23: Removal/Interaction Focus"
- **DO NOT provide summaries or explanations for each iteration in chat**
- **DO NOT explain your reasoning for each iteration in the chat**
- **Work silently through all iterations** - only show brief progress updates
- Save all reasoning and explanations to the iteration files themselves
- The user wants speed, not detailed iteration-by-iteration commentary

### 3. Analysis Phase

After all iterations complete:

**A. VALIDATE ALL ITERATIONS FIRST:**

Before analyzing results, you MUST validate all iteration files:

```bash
npx ts-node src/ai-optimize-deck.ts validate-all decks/<format>/<deck-name>/YYYYMMDD-HHMM-ai-optimize/
```

This will check that ALL iterations:

- Have exactly 100 cards (or target size)
- Have 35-38 lands minimum for Commander
- Include all required sections

If ANY iteration fails validation:

- **STOP the analysis process**
- **Fix all failing iterations**
- **Re-run validate-all** until all pass
- **ONLY THEN proceed to analysis**

**B. Calculate card frequencies:**

- Track how many times each card was kept
- Calculate percentage (kept_count / total_iterations × 100)

**C. Create BEST-consolidated.txt:**

Build the optimal deck by:

1. Sort all cards by frequency (descending)
2. Take enough top cards to reach target size
3. Handle multi-quantity cards (like basic lands) by averaging
4. Organize by card type
5. Include frequency annotations

Format:

```
# AI-Optimized Consolidated Best List
# Generated: <timestamp>
# Based on <N> AI-powered iterations
# Target deck size: <target>
# Method: Each iteration used different strategic priorities

## Commander (1)
1 Commander Name

## Creature (X)
1 Card Name # Kept in 98/100 iterations (98%)
1 Card Name # Kept in 95/100 iterations (95%)
...

## Land (X)
9 Swamp # Avg 8.7 per iteration (97% kept at least 8)
4 Plains # Avg 4.1 per iteration (95% kept at least 4)
...

## Stats
Total Cards: 100
Unique Cards: X
```

**C. Create ANALYSIS-REPORT.md:**

Include:

1. **Executive Summary**
    - Original size vs target size
    - Number of iterations completed
    - Methodology overview

2. **Core Cards (appeared in 90%+ of iterations)**
    - List with percentages
    - These are essential - strong AI consensus

3. **Strong Includes (70-89%)**
    - Very reliable cards
    - High confidence keeps

4. **Solid Cards (50-69%)**
    - Generally good, some variation
    - Context-dependent

5. **Flex Slots (30-49%)**
    - Genuinely debatable
    - Vary by strategic focus
    - Good candidates for meta adjustments

6. **Frequent Cuts (<30%)**
    - Cut in most iterations
    - Weakest cards statistically

7. **Cutting Pattern Analysis**
    - Which iteration types cut which cards most often
    - Example: "Tapped lands were cut in 80% of Speed/Efficiency iterations but only 30% of Resilience iterations"

8. **Recommendations**
    - How to use this data
    - When to deviate from recommendations
    - Meta considerations

### 4. Present Results to User

**Summary the findings:**

- "Completed 100 AI-powered deck analyses with different strategic priorities"
- "Found X core cards (90%+ consensus) that should definitely stay"
- "Identified Y frequent cuts that were removed in most analyses"
- "Created BEST-consolidated.txt with statistically optimal decklist"

**Highlight key insights:**

- Most unanimous keeps (100% agreement)
- Most controversial cards (50/50 split)
- Iteration-specific patterns (e.g., "Fast mana always kept in Speed iterations")

**Ask for feedback:**

- "Would you like me to explain why any specific card was kept/cut?"
- "The flex slots (30-49%) are good candidates for meta tuning - any concerns about specific cards?"

## Important Guidelines

### Land Count is Sacred

**MOST IMPORTANT RULE: DO NOT CUT TOO MANY LANDS**

- Commander decks MUST have 37-38 lands (never less than 37)
- Standard/Modern decks MUST have 23-26 lands (never less than 22)
- Only cut lands if:
    - Replacing with mana rocks/dorks (and deck still has 37+ lands total)
    - Average CMC is exceptionally low (< 2.5) AND deck has 15+ ramp sources
    - Cutting clearly bad utility lands (not core manabase)
- When reducing deck size, prioritize cutting spells, NOT lands
- Count your lands in every iteration to verify you haven't gone below minimum
- If you find yourself cutting lands to hit target size, **cut more spells instead**

### Quality Over Speed

- Each iteration should use **real AI analysis**, not random selection
- Consider actual card synergies, power level, and deck strategy
- Vary the **lens** of analysis, not the quality of analysis

### Consistency

- Use the same format for all iteration files
- Track all cards accurately
- Maintain organized output folder

### Transparency

- Show which iteration focus is being used
- Document why cards were cut in each iteration
- Explain methodology in final report

### Statistical Validity

- More iterations = more reliable results
- 50 iterations: Quick baseline
- 100 iterations: Recommended default
- 200+ iterations: Maximum confidence

## Example Interaction

**User:** "Optimize my blood-rites deck using AI analysis"

**You should:**

1. Confirm: "I'll run 100 AI-powered deck analyses with different strategic priorities. Each analysis will intelligently recommend cuts based on a different focus (mana curve, synergy, interaction, etc.). Then I'll aggregate the results to find which cards appear most frequently. This will take a few minutes. Proceed?"

2. Create output folder: `decks/commander/blood-rites/20251127-1430-ai-optimize/`

3. Run iterations:

    ```
    Starting AI optimization with 100 iterations...

    Iteration 1/100: Mana Curve Focus
    Analyzing deck with emphasis on smooth mana curve...
    ✓ Created iteration-001.txt

    Iteration 2/100: Mana Curve Focus
    Analyzing deck with emphasis on efficient CMC distribution...
    ✓ Created iteration-002.txt

    ...

    Completed 10/100 iterations...
    Completed 20/100 iterations...
    ...
    Completed 100/100 iterations!
    ```

4. Generate analysis:

    ```
    📊 Analyzing results across all 100 iterations...
    ✓ Created BEST-consolidated.txt
    ✓ Created ANALYSIS-REPORT.md
    ```

5. Present findings:

    ```
    ## Results Summary

    Found 33 core cards (90%+ consensus) - these are essential
    Found 68 strong includes (70-89%) - very reliable
    Found 8 flex slots (30-49%) - adjust based on meta
    Found 4 frequent cuts (<30%) - weakest cards

    The BEST-consolidated.txt represents the statistical consensus of 100 AI analyses.
    ```

## Key Differences from Manual Tool

| Aspect    | Manual Tool    | AI Prompt               |
| --------- | -------------- | ----------------------- |
| Analysis  | Random weights | AI-powered decisions    |
| Quality   | Mathematical   | Strategic reasoning     |
| Variation | Random factors | Different priorities    |
| Insight   | Frequency only | Why cards were cut      |
| Time      | 10-30 seconds  | 5-15 minutes            |
| Accuracy  | Statistical    | Strategic + Statistical |

## When to Use This Prompt

Use **AI Multi-Analysis** when:

- You want the most thorough, intelligent analysis
- You value strategic reasoning over pure speed
- You want to understand _why_ cards are kept/cut
- You're willing to wait 5-15 minutes for quality results
- You want to see how different priorities affect card selection

Use **Manual optimize tool** when:

- You want fast results (10-30 seconds)
- Statistical frequency is sufficient
- You don't need detailed reasoning
- You're running many experiments

Use **reduce-deck-size prompt** when:

- You want interactive, single analysis
- You have specific strategic preferences
- You want to discuss each cut

## Technical Notes

- This is a **meta-prompt** that runs the reduce-deck-size logic multiple times
- Each iteration is a full AI analysis, not a simple calculation
- Results are aggregated statistically
- Output is similar to manual tool but with AI reasoning
- Significantly slower but more insightful
- Best for important decisions where you want maximum confidence

## Limitations

- Takes significantly longer than manual tool (5-15 minutes vs 30 seconds)
- Each iteration requires AI inference
- More expensive in terms of API calls
- Still may miss meta-specific considerations
- Statistical consensus may not match your playstyle

## Common Mistakes to Avoid

1. **Cutting too many lands** - Most common error! Always verify land count stays at 37-38 for Commander
2. **Over-optimizing mana curve** - Don't sacrifice powerful high-CMC cards just for curve smoothness
3. **Ignoring commander synergy** - Cards that enable your commander are more valuable than raw power
4. **Cutting all "bad" cards at once** - Some flex slots need to stay, don't only keep perfect cards
5. **Not reading oracle text** - Make decisions based on actual card text from cache, not assumptions
