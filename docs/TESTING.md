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

- **`deck-parser.test.ts`** - Tests for parsing decklist formats
    - Different quantity formats (4, 4x, no quantity)
    - Comments and section headers
    - Empty lines and whitespace handling
    - Mixed format decklists

- **`deck-analyzer.test.ts`** - Tests for deck analysis and statistics
    - Color distribution calculation
    - Mana curve visualization
    - Card type breakdown
    - Average CMC calculation
    - Edge cases (empty decks, expensive cards, colorless cards)

- **`card-cache.test.ts`** - Tests for card caching functionality
    - Cache loading and saving
    - Card retrieval and storage
    - Cache statistics
    - Error handling
    - Minimal storage format verification

- **`card-counter.test.ts`** - Tests for card counting utilities
    - Card counting in text and files
    - Category parsing and validation
    - Command-line argument parsing
    - Formatted output generation

## Coverage

Current coverage targets core business logic:

- `card-cache.ts`: 98.14% coverage
- `deck-analyzer.ts`: 98.75% coverage
- `deck-parser.ts`: 96.77% coverage
- `card-counter.ts`: 75.19% coverage

API clients (`scryfall-client.ts`, `moxfield-client.ts`) and entry point scripts are excluded from coverage requirements as they primarily make HTTP calls and require integration testing.

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
