// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as utils from './utils';
import { SsiDocumentContentProvider } from './SsiDocumentContentProvider';

const myScheme = 'vscode-ssi-viewer';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const myProvider = new SsiDocumentContentProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(myScheme, myProvider));

	const registerFunction = async (withComment: boolean) => {
		if (vscode.window.activeTextEditor) {
			const { document } = vscode.window.activeTextEditor;
			const viewUri = vscode.Uri.parse(`${myScheme}:${utils.getValidUriText(document.uri.path)}`, true);
			myProvider.changeCommentMode(withComment);
			myProvider.setEol(document.eol);
			myProvider.onDidChangeEmitter.fire(viewUri);
			await vscode.window.showTextDocument(viewUri, { preview: false });
		};
	};

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(
		vscode.commands.registerCommand('vscode-ssi-viewer.load', async () => { await registerFunction(false); }),
		vscode.commands.registerCommand('vscode-ssi-viewer.load-with-comment', async () => { await registerFunction(true); })
	);
}

// this method is called when your extension is deactivated
export function deactivate() { }

