import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

export class SsiDocumentContentProvider implements vscode.TextDocumentContentProvider {
	constructor() { }

	private withComment: boolean = false;
	changeCommentMode(withComment: boolean) {
		this.withComment = withComment;
	}

	private eol: String = "\n";
	setEol(eol: vscode.EndOfLine) {
		if (eol === vscode.EndOfLine.LF) {
			this.eol = "\n";
		} else if (eol === vscode.EndOfLine.CRLF) {
			this.eol = "\r\n";
		}
	}

	onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
	onDidChange = this.onDidChangeEmitter.event;

	async loadInclude(filePath: string, depth: number, withComment: boolean, counter: utils.FileCounter): Promise<string> {
		try {
			const baseDoc = await vscode.workspace.openTextDocument(filePath);
			const replaceDic: { [key: string]: string } = {};

			let baseText = baseDoc.getText();
			const regex: RegExp = /<!--.*?#include\s+(.+?\s)?(?<type>file|virtual)\s*=\s*"(?<file>.+?)".*?-->/gi;
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
					let includeText = await this.loadInclude(includeFullPath, depth, withComment, counter);
					includeText = utils.getIncludeTextWithComment(includeText, depth, includeType, path.basename(includeFullPath), withComment);

					depth--;
					replaceDic[match[0]] = includeText;
				} else {
					if (includeType === "FILE" && includePath.startsWith('/')) {
						counter.incrementFail();
						const errmsg = `Error: [#include file] does not start with "/": [${includePath}]`;
						vscode.window.showInformationMessage(errmsg);
						replaceDic[match[0]] = utils.getCommentText(errmsg);
						continue;
					}
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
	};

	async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
		const counter = utils.createFileCounter();
		let result = await this.loadInclude(uri.path, 0, this.withComment, counter);
		result = result.trimEnd();
		result = result + this.eol;
		vscode.window.showInformationMessage(counter.getResultText());
		return result;
	}
};
