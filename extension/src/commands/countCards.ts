import { exec } from "child_process";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);

export async function countCardsCommand(uri?: vscode.Uri) {
    try {
        // Get the deck file path
        let deckPath: string;

        if (uri) {
            // Called from tree view context menu
            deckPath = uri.fsPath;
        } else {
            // Called from command palette - use active editor
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No deck file is currently open");
                return;
            }
            deckPath = editor.document.uri.fsPath;
        }

        // Verify it's a deck file
        if (!deckPath.includes("/decks/") || !deckPath.endsWith(".txt")) {
            vscode.window.showErrorMessage("Please open a deck file (.txt in decks folder)");
            return;
        }

        const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

        // Run the card counter
        const { stdout } = await execAsync(`npx ts-node src/card-counter.ts "${deckPath}"`, {
            cwd: workspaceRoot,
        });

        // Parse the output
        const lines = stdout.trim().split("\n");
        const totalMatch = lines.find((l) => l.startsWith("Total Cards:"));
        const uniqueMatch = lines.find((l) => l.startsWith("Unique Cards:"));

        if (totalMatch && uniqueMatch) {
            const total = totalMatch.split(":")[1].trim();
            const unique = uniqueMatch.split(":")[1].trim();

            const message = `${path.basename(deckPath)}: ${total} total cards, ${unique} unique`;

            if (total === "100" || total === "60") {
                vscode.window.showInformationMessage(`✅ ${message}`);
            } else {
                vscode.window.showWarningMessage(`⚠️ ${message}`);
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error counting cards: ${error}`);
    }
}
