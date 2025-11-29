import { exec } from "child_process";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);

export async function analyzeDeckCommand(uri?: vscode.Uri) {
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

        // Show progress
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Analyzing deck...",
                cancellable: false,
            },
            async (progress) => {
                const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

                // Run the deck analyzer
                const { stdout, stderr } = await execAsync(`npm run dev "${deckPath}"`, {
                    cwd: workspaceRoot,
                });

                if (stderr && !stderr.includes("jest-haste-map")) {
                    throw new Error(stderr);
                }

                // Show results in output channel
                const outputChannel = vscode.window.createOutputChannel("MTG Deck Analysis");
                outputChannel.clear();
                outputChannel.appendLine(`Analysis for: ${path.basename(deckPath)}`);
                outputChannel.appendLine("=".repeat(60));
                outputChannel.appendLine(stdout);
                outputChannel.show();

                vscode.window.showInformationMessage("Deck analysis complete!");
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Error analyzing deck: ${error}`);
    }
}
