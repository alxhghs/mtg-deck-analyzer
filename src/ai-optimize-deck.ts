#!/usr/bin/env ts-node
/**
 * AI-Powered Deck Optimization Script
 *
 * This script provides validation hooks for the AI optimization process
 * to prevent common mistakes like incorrect card counts or land counts.
 *
 * Usage:
 *   npx ts-node src/ai-optimize-deck.ts validate <iteration-file>
 *   npx ts-node src/ai-optimize-deck.ts validate-all <output-folder>
 */

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

interface ValidationResult {
    file: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
    totalCards: number;
    landCount: number;
    uniqueCards: number;
}

function countCardsInFile(filePath: string): { total: number; lands: number; unique: number } {
    try {
        const output = execSync(`npx ts-node src/card-counter.ts "${filePath}"`, {
            encoding: "utf-8",
            cwd: process.cwd(),
        });

        const totalMatch = output.match(/Total Cards:\s+(\d+)/);
        const landMatch = output.match(/Land:\s+(\d+)/);
        const uniqueMatch = output.match(/Unique Cards:\s+(\d+)/);
        return {
            total: totalMatch ? parseInt(totalMatch[1]) : 0,
            lands: landMatch ? parseInt(landMatch[1]) : 0,
            unique: uniqueMatch ? parseInt(uniqueMatch[1]) : 0,
        };
    } catch (error) {
        console.error(`Error counting cards in ${filePath}:`, error);
        return { total: 0, lands: 0, unique: 0 };
    }
}

function validateIterationFile(
    filePath: string,
    targetSize: number = 100,
    minLands: number = 37
): ValidationResult {
    const result: ValidationResult = {
        file: path.basename(filePath),
        valid: true,
        errors: [],
        warnings: [],
        totalCards: 0,
        landCount: 0,
        uniqueCards: 0,
    };

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        result.valid = false;
        result.errors.push(`File does not exist: ${filePath}`);
        return result;
    }

    // Count cards using card-counter tool
    const counts = countCardsInFile(filePath);
    result.totalCards = counts.total;
    result.landCount = counts.lands;
    result.uniqueCards = counts.unique;

    // Validation checks
    if (counts.total !== targetSize) {
        result.valid = false;
        result.errors.push(
            `Card count is ${counts.total}, expected ${targetSize} (off by ${Math.abs(counts.total - targetSize)})`
        );
    }

    if (counts.lands < minLands) {
        result.valid = false;
        result.errors.push(
            `Land count is ${counts.lands}, minimum is ${minLands} for Commander (${minLands - counts.lands} lands short)`
        );
    }

    if (counts.lands > 38) {
        result.warnings.push(
            `Land count is ${counts.lands}, which is higher than typical 37-38 for Commander`
        );
    }

    // Check file content for common issues
    const content = fs.readFileSync(filePath, "utf-8");

    // Check for commander
    if (!content.includes("## Commander")) {
        result.errors.push("Missing Commander section");
        result.valid = false;
    }

    // Check for stats section
    if (!content.includes("## Stats")) {
        result.warnings.push("Missing Stats section");
    }

    // Check for cards cut section
    if (!content.includes("## Cards Cut This Iteration")) {
        result.warnings.push("Missing Cards Cut section - no reasoning documented");
    }

    return result;
}

function validateAllIterations(
    folderPath: string,
    targetSize: number = 100,
    minLands: number = 35
): void {
    console.log(`\n🔍 Validating all iterations in ${folderPath}\n`);

    const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.startsWith("iteration-") && f.endsWith(".txt"))
        .sort();

    if (files.length === 0) {
        console.log("❌ No iteration files found");
        return;
    }

    const results: ValidationResult[] = [];
    let allValid = true;

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const result = validateIterationFile(filePath, targetSize, minLands);
        results.push(result);

        if (!result.valid) {
            allValid = false;
            console.log(`❌ ${result.file}`);
            result.errors.forEach((err) => console.log(`   ERROR: ${err}`));
            result.warnings.forEach((warn) => console.log(`   WARNING: ${warn}`));
        } else {
            console.log(
                `✅ ${result.file} - ${result.totalCards} cards, ${result.landCount} lands`
            );
            if (result.warnings.length > 0) {
                result.warnings.forEach((warn) => console.log(`   WARNING: ${warn}`));
            }
        }
    }

    // Summary
    console.log(`\n${"=".repeat(60)}`);
    console.log(
        `Summary: ${results.filter((r) => r.valid).length}/${results.length} iterations valid`
    );

    if (allValid) {
        console.log("✅ All iterations passed validation!");
    } else {
        console.log("❌ Some iterations have errors - please fix before proceeding");
    }

    // Statistics
    const avgCards = results.reduce((sum, r) => sum + r.totalCards, 0) / results.length;
    const avgLands = results.reduce((sum, r) => sum + r.landCount, 0) / results.length;
    const minCards = Math.min(...results.map((r) => r.totalCards));
    const maxCards = Math.max(...results.map((r) => r.totalCards));
    const minLandsFound = Math.min(...results.map((r) => r.landCount));
    const maxLandsFound = Math.max(...results.map((r) => r.landCount));

    console.log(`\nStatistics:`);
    console.log(`  Card Count: min=${minCards}, max=${maxCards}, avg=${avgCards.toFixed(1)}`);
    console.log(
        `  Land Count: min=${minLandsFound}, max=${maxLandsFound}, avg=${avgLands.toFixed(1)}`
    );

    process.exit(allValid ? 0 : 1);
}

// CLI
const command = process.argv[2];
const target = process.argv[3];

if (!command || !target) {
    console.log("Usage:");
    console.log("  Validate single file:   npx ts-node src/ai-optimize-deck.ts validate <file>");
    console.log(
        "  Validate all in folder: npx ts-node src/ai-optimize-deck.ts validate-all <folder>"
    );
    process.exit(1);
}

if (command === "validate") {
    const result = validateIterationFile(target);
    console.log(`\nValidation Results for ${result.file}:`);
    console.log(`  Total Cards: ${result.totalCards}`);
    console.log(`  Land Count: ${result.landCount}`);
    console.log(`  Unique Cards: ${result.uniqueCards}`);

    if (result.errors.length > 0) {
        console.log("\n❌ Errors:");
        result.errors.forEach((err) => console.log(`  - ${err}`));
    }

    if (result.warnings.length > 0) {
        console.log("\n⚠️  Warnings:");
        result.warnings.forEach((warn) => console.log(`  - ${warn}`));
    }

    if (result.valid) {
        console.log("\n✅ Validation passed!");
    } else {
        console.log("\n❌ Validation failed!");
    }

    process.exit(result.valid ? 0 : 1);
} else if (command === "validate-all") {
    validateAllIterations(target);
} else {
    console.log(`Unknown command: ${command}`);
    process.exit(1);
}
