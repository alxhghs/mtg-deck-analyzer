import { exec } from "child_process";
import { promisify } from "util";
import * as vscode from "vscode";

const execAsync = promisify(exec);

export async function calculateProbabilityCommand() {
    try {
        // Prompt for parameters
        const deckSize = await vscode.window.showInputBox({
            prompt: "Deck size",
            value: "99",
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    return "Please enter a valid positive number";
                }
                return null;
            },
        });

        if (!deckSize) return;

        const targetCards = await vscode.window.showInputBox({
            prompt: "Number of target cards in deck",
            placeHolder: "e.g., 3 for three combo pieces",
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    return "Please enter a valid positive number";
                }
                return null;
            },
        });

        if (!targetCards) return;

        const cardsDrawn = await vscode.window.showInputBox({
            prompt: "Number of cards drawn",
            value: "7",
            placeHolder: "e.g., 7 for opening hand, 14 for turn 8",
            validateInput: (value) => {
                const num = parseInt(value);
                if (isNaN(num) || num <= 0) {
                    return "Please enter a valid positive number";
                }
                return null;
            },
        });

        if (!cardsDrawn) return;

        const condition = await vscode.window.showQuickPick(
            ["at-least", "exactly", "at-most", "between"],
            { placeHolder: "Select probability condition" }
        );

        if (!condition) return;

        let minValue = "1";
        let maxValue = cardsDrawn;

        if (condition === "between") {
            const min = await vscode.window.showInputBox({
                prompt: "Minimum number of target cards",
                value: "1",
            });
            if (!min) return;
            minValue = min;

            const max = await vscode.window.showInputBox({
                prompt: "Maximum number of target cards",
                value: cardsDrawn,
            });
            if (!max) return;
            maxValue = max;
        } else {
            const value = await vscode.window.showInputBox({
                prompt: `Number of target cards (${condition})`,
                value: "1",
            });
            if (!value) return;
            minValue = value;
        }

        // Build command
        const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
        let command = `npx ts-node src/hypergeometric.ts --deck ${deckSize} --target ${targetCards} --draw ${cardsDrawn}`;

        if (condition === "between") {
            command += ` --between ${minValue} ${maxValue}`;
        } else {
            command += ` --${condition} ${minValue}`;
        }

        // Run calculation
        const { stdout } = await execAsync(command, { cwd: workspaceRoot });

        // Show results
        const outputChannel = vscode.window.createOutputChannel("MTG Probability Calculator");
        outputChannel.clear();
        outputChannel.appendLine(stdout);
        outputChannel.show();
    } catch (error) {
        vscode.window.showErrorMessage(`Error calculating probability: ${error}`);
    }
}
