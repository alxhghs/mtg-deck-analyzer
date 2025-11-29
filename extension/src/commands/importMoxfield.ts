import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);

export async function importMoxfieldCommand() {
    try {
        // Ask user to choose import method
        const importMethod = await vscode.window.showQuickPick(
            [
                { label: "Import from Moxfield URL", value: "url" },
                { label: "Paste decklist", value: "paste" },
            ],
            { placeHolder: "How would you like to import?" }
        );

        if (!importMethod) {
            return;
        }

        if (importMethod.value === "url") {
            await importFromUrl();
        } else {
            await importFromPaste();
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Error importing deck: ${error}`);
    }
}

async function importFromUrl() {
    // Prompt for Moxfield URL
    const url = await vscode.window.showInputBox({
        prompt: "Enter Moxfield deck URL",
        placeHolder: "https://www.moxfield.com/decks/...",
        validateInput: (value) => {
            if (!value.includes("moxfield.com/decks/")) {
                return "Please enter a valid Moxfield deck URL";
            }
            return null;
        },
    });

    if (!url) {
        return;
    }

    // Prompt for optional deck name
    const deckName = await vscode.window.showInputBox({
        prompt: "Deck name (optional, will use Moxfield name if empty)",
        placeHolder: "my-deck-name",
    });

    // Show progress
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: "Importing deck from Moxfield...",
            cancellable: false,
        },
        async () => {
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;

            const command = deckName
                ? `npm run import "${url}" "${deckName}"`
                : `npm run import "${url}"`;

            const { stdout } = await execAsync(command, { cwd: workspaceRoot });

            // Show results
            const outputChannel = vscode.window.createOutputChannel("MTG Moxfield Import");
            outputChannel.clear();
            outputChannel.appendLine(stdout);
            outputChannel.show();

            vscode.window.showInformationMessage("Deck imported successfully!");
        }
    );
}

async function importFromPaste() {
    // Get clipboard content
    const clipboard = await vscode.env.clipboard.readText();

    // Prompt for deck name and format
    const deckName = await vscode.window.showInputBox({
        prompt: "Deck name",
        placeHolder: "my-deck-name",
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Please enter a deck name";
            }
            return null;
        },
    });

    if (!deckName) {
        return;
    }

    const format = await vscode.window.showQuickPick(["commander", "modern", "standard", "other"], {
        placeHolder: "Select deck format",
    });

    if (!format) {
        return;
    }

    // Parse the pasted decklist
    const lines = clipboard.split("\n");
    let mainboard: string[] = [];
    let sideboard: string[] = [];
    let commander: string[] = [];
    let isInSideboard = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed) continue;

        if (trimmed.toUpperCase().includes("SIDEBOARD")) {
            isInSideboard = true;
            continue;
        }

        // Parse card line: "1 Card Name" or "4 Card Name"
        const match = trimmed.match(/^(\d+)\s+(.+)$/);
        if (match) {
            const quantity = parseInt(match[1]);
            const cardName = match[2];

            // Format as "quantity Card Name"
            const cardLine = `${quantity} ${cardName}`;

            if (isInSideboard) {
                sideboard.push(cardLine);
            } else {
                mainboard.push(cardLine);
            }
        }
    }

    // For commander format, check if last card in sideboard is the commander
    if (format === "commander" && sideboard.length > 0) {
        const lastCard = sideboard[sideboard.length - 1];
        if (lastCard.startsWith("1 ")) {
            commander.push(lastCard);
            sideboard = sideboard.slice(0, -1);
        }
    }

    // Create deck folder
    const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const deckFolder = path.join(workspaceRoot, "decks", format, deckName);

    if (!fs.existsSync(deckFolder)) {
        fs.mkdirSync(deckFolder, { recursive: true });
    }

    // Write deck file
    let deckContent = "";

    if (commander.length > 0) {
        deckContent += "Commander:\n";
        deckContent += commander.join("\n") + "\n\n";
    }

    deckContent += "Mainboard:\n";
    deckContent += mainboard.join("\n");

    if (sideboard.length > 0) {
        deckContent += "\n\nSideboard:\n";
        deckContent += sideboard.join("\n");
    }

    const deckFilePath = path.join(deckFolder, "moxfield.txt");
    fs.writeFileSync(deckFilePath, deckContent, "utf-8");

    // Open the file
    const doc = await vscode.workspace.openTextDocument(deckFilePath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(`Deck imported to ${format}/${deckName}/moxfield.txt`);
}
