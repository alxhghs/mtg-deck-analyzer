import * as path from 'path';
import { MoxfieldClient } from './moxfield-client';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('\n🎴 Moxfield Deck Importer\n');
    console.log('Usage: npm run import <moxfield-url-or-id> [output-path]');
    console.log('\nExamples:');
    console.log('  npm run import https://www.moxfield.com/decks/abc123xyz');
    console.log('  npm run import abc123xyz');
    console.log('  npm run import abc123xyz decks/modern/my-deck.txt\n');
    process.exit(1);
  }

  const urlOrId = args[0];
  const outputPath = args[1] ? path.resolve(args[1]) : undefined;

  try {
    console.log('\n🌐 Fetching deck from Moxfield...\n');

    const client = new MoxfieldClient();
    const deckId = MoxfieldClient.extractDeckId(urlOrId);
    
    const savedPath = await client.saveDeckToFile(deckId, outputPath);
    
    console.log(`✅ Deck imported successfully!`);
    console.log(`📁 Saved to: ${savedPath}\n`);
    console.log('To analyze this deck, run:');
    console.log(`  npm run dev ${savedPath}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
