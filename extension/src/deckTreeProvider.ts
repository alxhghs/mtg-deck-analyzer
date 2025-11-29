import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export class DeckTreeProvider implements vscode.TreeDataProvider<DeckItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DeckItem | undefined | null | void> =
        new vscode.EventEmitter<DeckItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DeckItem | undefined | null | void> =
        this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DeckItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: DeckItem): Promise<DeckItem[]> {
        if (!vscode.workspace.workspaceFolders) {
            return [];
        }

        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const decksPath = path.join(workspaceRoot, "decks");

        if (!fs.existsSync(decksPath)) {
            return [];
        }

        // If no element, return format folders
        if (!element) {
            const formats = fs
                .readdirSync(decksPath, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory())
                .map(
                    (dirent) =>
                        new DeckItem(
                            dirent.name,
                            vscode.TreeItemCollapsibleState.Collapsed,
                            vscode.Uri.file(path.join(decksPath, dirent.name)),
                            "format"
                        )
                );
            return formats;
        }

        // If format folder, return deck folders
        if (element.contextValue === "format") {
            const deckFolders = fs
                .readdirSync(element.resourceUri!.fsPath, { withFileTypes: true })
                .filter((dirent) => dirent.isDirectory())
                .map(
                    (dirent) =>
                        new DeckItem(
                            dirent.name,
                            vscode.TreeItemCollapsibleState.Collapsed,
                            vscode.Uri.file(path.join(element.resourceUri!.fsPath, dirent.name)),
                            "deckFolder"
                        )
                );
            return deckFolders;
        }

        // If deck folder, return .txt files
        if (element.contextValue === "deckFolder") {
            const deckFiles = fs
                .readdirSync(element.resourceUri!.fsPath, { withFileTypes: true })
                .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".txt"))
                .map(
                    (dirent) =>
                        new DeckItem(
                            dirent.name,
                            vscode.TreeItemCollapsibleState.None,
                            vscode.Uri.file(path.join(element.resourceUri!.fsPath, dirent.name)),
                            "deckFile"
                        )
                );
            return deckFiles;
        }

        return [];
    }
}

class DeckItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly resourceUri: vscode.Uri,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);

        if (contextValue === "deckFile") {
            this.command = {
                command: "vscode.open",
                title: "Open Deck",
                arguments: [resourceUri],
            };
            this.iconPath = new vscode.ThemeIcon("file-text");
        } else if (contextValue === "deckFolder") {
            this.iconPath = new vscode.ThemeIcon("folder");
        } else if (contextValue === "format") {
            this.iconPath = new vscode.ThemeIcon("folder-library");
        }
    }
}
