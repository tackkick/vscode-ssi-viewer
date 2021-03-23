import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

export class SsiDocumentContentProvider implements vscode.TextDocumentContentProvider {
	constructor() { }

	private withComment: boolean = false;
	changeCommentMode(withComment: boolean) {
		this.withComment = withComment;
	}

	onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
	onDidChange = this.onDidChangeEmitter.event;

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		let counter = utils.createFileCounter();
		const result = await loadInclude(uri.path, 0, this.withComment, counter);
		vscode.window.showInformationMessage(counter.getResultText());
		return result;
	}
};

export async function loadInclude(filePath: string, depth: number, withComment: boolean, counter: utils.FileCounter): Promise<string> {
	try {
		const baseDoc = await vscode.workspace.openTextDocument(filePath);
		const replaceDic: { [key: string]: string } = {};

		let baseText = baseDoc.getText();
		const regex: RegExp = /<!--.*?#include\s+(?<type>file|virtual)\s*=\s*"(?<file>.+?)".*?-->/gi;
		let match = regex.exec(baseText);

		do {
			if (!match) { continue; }
			const includePath = match.groups?.file || "";
			const includeType = match.groups?.type.toUpperCase() || "";

			let includeFullPath = utils.getIncludeFullPath(includeType, includePath, baseDoc);
			if (includeFullPath) {
				depth++;
				try {
					await vscode.workspace.fs.stat(vscode.Uri.file(includeFullPath));
				} catch {
					counter.incrementFail();
					const errmsg = `Error: cannot open file: [${includePath}]`;
					vscode.window.showInformationMessage(errmsg);
					replaceDic[match[0]] = utils.getCommentText(errmsg);
					continue;
				}

				if (includeType === "FILE") {
					counter.incrementFile();
				} else {
					counter.incrementVirtual();
				}
				let includeText = await loadInclude(includeFullPath, depth, withComment, counter);
				includeText = utils.getIncludeTextWithComment(includeText, depth, includeType, path.basename(includeFullPath), withComment);
				depth--;

				replaceDic[match[0]] = includeText;
			}
		} while (match = regex.exec(baseText));

		Object.keys(replaceDic).forEach(key => {
			baseText = baseText.split(key).join(replaceDic[key]);
		});

		return baseText;
	} catch {
		counter.incrementFail();
		return "";
	}
}
