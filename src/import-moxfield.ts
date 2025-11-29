import { MoxfieldClient } from "./moxfield-client";

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log("\n🎴 Moxfield Deck Importer\n");
        console.log("Usage: npm run import <moxfield-url-or-id> [deck-name] [--force]");
        console.log("\nExamples:");
        console.log("  npm run import https://www.moxfield.com/decks/abc123xyz");
        console.log("  npm run import abc123xyz");
        console.log("  npm run import abc123xyz my-custom-name");
        console.log("  npm run import -- abc123xyz --force  # Force refresh from Moxfield\n");
        process.exit(1);
    }

    const forceRefresh = args.includes("--force");
    const filteredArgs = args.filter((arg) => arg !== "--force");

    const urlOrId = filteredArgs[0];
    const deckName = filteredArgs[1];

    try {
        console.log("\n🌐 Fetching deck from Moxfield...\n");

        const client = new MoxfieldClient();
        const deckId = MoxfieldClient.extractDeckId(urlOrId);

        const deckFolder = await client.saveDeckToFile(deckId, deckName, forceRefresh);

        console.log(`✅ Deck imported successfully!`);
        console.log(`📁 Saved to: ${deckFolder}/\n`);
        console.log("To analyze this deck, run:");
        console.log(`  npm run dev ${deckFolder}/moxfield.txt\n`);
    } catch (error: any) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

main();
