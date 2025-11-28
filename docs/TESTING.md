# Testing

This project uses [Jest](https://jestjs.io/) with [ts-jest](https://kulshekhar.github.io/ts-jest/) for unit testing TypeScript code.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

Tests are located in `src/__tests__/` directory, colocated with the source files they test.

### Test Files

- **`deck-parser.test.ts`** (28 tests) - Tests for parsing decklist formats
    - Different quantity formats (4, 4x, no quantity)
    - Comments and section headers
    - Empty lines and whitespace handling
    - Mixed format decklists
    - Edge cases: special characters, unicode, large quantities, single cards, card names starting with numbers

- **`deck-analyzer.test.ts`** (22 tests) - Tests for deck analysis and statistics
    - Color distribution calculation
    - Mana curve visualization
    - Card type breakdown
    - Average CMC calculation
    - Edge cases: empty decks, expensive cards, colorless cards, multicolor, artifact creatures

- **`card-cache.test.ts`** (28 tests) - Tests for card caching functionality
    - Cache loading and saving
    - Card retrieval and storage
    - Cache statistics
    - Error handling
    - Minimal storage format verification
    - Edge cases: corrupted files, empty caches, special characters

- **`card-counter.test.ts`** (39 tests) - Tests for card counting utilities
    - Card counting in text and files
    - Category parsing and validation
    - Command-line argument parsing
    - Formatted output generation
    - Edge cases: large quantities, zero quantities, nested categories, whitespace

- **`moxfield-cache.test.ts`** (19 tests) - Tests for Moxfield deck caching
    - Cache persistence and expiry
    - Metadata management
    - File existence validation
    - Time-based cache invalidation
    - Multi-deck support

- **`moxfield-client.test.ts`** (33 tests) - Tests for Moxfield API client
    - Deck fetching from Moxfield API
    - Deck saving to local files
    - Format directory mapping (commander, standard, modern, other)
    - Deck ID extraction from URLs
    - File naming and sanitization
    - Cache integration
    - Error handling (404, network errors)
    - Edge cases: empty boards, missing data, long names, special characters

- **`scryfall-client.test.ts`** (15 tests) - Tests for Scryfall API client
    - Card fetching by name
    - Batch card fetching
    - Card data mapping
    - API rate limiting (100ms delays)
    - Error handling (404, network errors)
    - Edge cases: double-faced cards, special characters, missing fields

## Coverage

Current coverage (184 tests total):

- `deck-parser.ts`: **100%** statements, **94.11%** branches (28 tests)
- `scryfall-client.ts`: **100%** statements, **100%** branches (15 tests)
- `moxfield-cache.ts`: **100%** statements, **100%** branches (19 tests)
- `moxfield-client.ts`: **98.88%** statements, **87.71%** branches (33 tests)
- `card-cache.ts`: **98.14%** statements, **95%** branches (28 tests)
- `deck-analyzer.ts`: **98.75%** statements, **89.47%** branches (22 tests)
- `card-counter.ts`: **75.19%** statements, **75.28%** branches (39 tests)

**Overall: 92.23% statement coverage, 85.59% branch coverage, 98.55% function coverage**

Entry point scripts (`index.ts`, `import-moxfield.ts`, `ai-optimize-deck.ts`) and type definitions (`types.ts`) are excluded from coverage as they are CLI entry points without testable business logic.

## Bugs Discovered and Fixed

During comprehensive test writing, the following bugs were discovered and fixed:

### 1. Deck Parser - Restrictive Card Name Regex (Fixed)

**File:** `src/deck-parser.ts`

**Issue:** The parser used pattern `/^([a-zA-Z].+)$/` which required card names to start with a letter. This failed to parse cards with:

- Numbers at the start (e.g., "8.5 Tails")
- Special characters at the start (e.g., "Æther Vial")

**Fix:** Changed pattern to `/^(.+)$/` with additional validation to exclude pure numbers:

```typescript
// Before
const match = line.match(/^([a-zA-Z].+)$/);

// After
const match = line.match(/^(.+)$/);
if (match && !/^\d+$/.test(match[1])) {
    return { quantity: 1, cardName: match[1].trim() };
}
```

**Test Coverage:** Added tests for "8.5 Tails" and "Æther Vial" to prevent regression.

### 2. Moxfield Client - Unsafe Metadata Access (Fixed)

**File:** `src/moxfield-client.ts`

**Issue:** The code accessed `metadata!.lastFetched` without checking if `metadata` was undefined:

```typescript
const metadata = this.cache.getMetadata(deckId);
console.log(`📦 Using cached deck (fetched ${new Date(metadata!.lastFetched).toLocaleString()})`);
```

This caused `TypeError: Cannot read properties of undefined (reading 'lastFetched')` when cache metadata didn't exist.

**Fix:** Added null check before accessing metadata:

```typescript
const metadata = this.cache.getMetadata(deckId);
if (metadata) {
    const timeUntilExpiry = this.cache.getTimeUntilExpiry(deckId);
    const minutesUntilExpiry = timeUntilExpiry ? Math.ceil(timeUntilExpiry / 1000 / 60) : 0;

    console.log(
        `📦 Using cached deck (fetched ${new Date(metadata.lastFetched).toLocaleString()})`
    );
    console.log(`   Cache expires in ${minutesUntilExpiry} minutes`);
    console.log(`   Use --force to refresh now\n`);
    return deckFolder;
}
```

**Test Coverage:** Added tests to verify cache behavior with and without existing metadata.

## Writing Tests

When adding new features:

1. Create test file in `src/__tests__/` directory
2. Name test file with `.test.ts` suffix
3. Use descriptive `describe` and `it` blocks
4. Mock external dependencies (filesystem, HTTP calls) with `jest.mock()`
5. Test both happy paths and edge cases
6. Aim for high coverage of business logic (>90%)

### Example Test Structure

```typescript
import { MyClass } from "../my-class";
import * as fs from "fs";

jest.mock("fs");

describe("MyClass", () => {
    describe("myMethod", () => {
        it("should handle normal case", () => {
            // Arrange
            const input = "test";

            // Act
            const result = MyClass.myMethod(input);

            // Assert
            expect(result).toBe("expected");
        });

        it("should handle edge case", () => {
            // Test edge cases
        });
    });
});
```

## Continuous Integration

Tests should be run before committing code. Consider adding a pre-commit hook:

```bash
npm test
```
