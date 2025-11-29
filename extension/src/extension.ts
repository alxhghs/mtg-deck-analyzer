import * as vscode from "vscode";
import { analyzeDeckCommand } from "./commands/analyzeDeck";
import { calculateProbabilityCommand } from "./commands/calculateProbability";
import { countCardsCommand } from "./commands/countCards";
import { importMoxfieldCommand } from "./commands/importMoxfield";
import { DeckTreeProvider } from "./deckTreeProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log("MTG Deck Builder extension is now active!");

    // Register deck tree view
    const deckTreeProvider = new DeckTreeProvider();
    const treeView = vscode.window.createTreeView("mtgDeckExplorer", {
        treeDataProvider: deckTreeProvider,
    });
    context.subscriptions.push(treeView);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand("mtg.analyzeDeck", analyzeDeckCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mtg.countCards", countCardsCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mtg.importMoxfield", importMoxfieldCommand)
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("mtg.calculateProbability", calculateProbabilityCommand)
    );

    // Watch for file changes in decks folder
    const watcher = vscode.workspace.createFileSystemWatcher("**/decks/**/*.txt");
    watcher.onDidChange(() => deckTreeProvider.refresh());
    watcher.onDidCreate(() => deckTreeProvider.refresh());
    watcher.onDidDelete(() => deckTreeProvider.refresh());
    context.subscriptions.push(watcher);
}

export function deactivate() {}
