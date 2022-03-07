import * as vscode from 'vscode';
import * as path from 'path';
import * as utils from './utils';

export class SsiDocumentContentProvider implements vscode.TextDocumentContentProvider {
	constructor() { }

	private withComment: boolean = false;
	changeCommentMode(withComment: boolean) {
		this.withComment = withComment;
	}

	private eol: vscode.EndOfLine = vscode.EndOfLine.LF;
	setEol(eol: vscode.EndOfLine) {
		this.eol = eol;
	}

	onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
	onDidChange = this.onDidChangeEmitter.event;

	async loadInclude(filePath: string, depth: number, withComment: boolean, counter: utils.FileCounter): Promise<string> {
		try {
			const baseDoc = await vscode.workspace.openTextDocument(filePath);
			const replaceDic: { [key: string]: string } = {};

			let baseText = baseDoc.getText();
			const baseRegex: RegExp = /<!--.+?-->/gis;
			let baseMatch = null;
			while (baseMatch = baseRegex.exec(baseText)) {
				const regex: RegExp = /#include\s+[\s\S]*?(?<type>file|virtual)\s*=\s*("|')?(?<file>[^"'\s]+)("|')?/gi;
				const match = regex.exec(baseMatch[0]);
				if (!match) { continue; }
				const includePath = match.groups?.file || "";
				const includeType: utils.IncludeType = utils.getIncludeType(match.groups?.type || '');

				const includeFullPath = utils.getIncludeFullPath(includeType, includePath, baseDoc);
				if (includeFullPath) {
					depth++;
					try {
						const fstat = await vscode.workspace.fs.stat(vscode.Uri.file(includeFullPath));
						if (fstat.type === vscode.FileType.Directory) {
							throw new Error();
						}
					} catch {
						counter.incrementFail();
						const errmsg = `Error: cannot open file: [${includePath}]`;
						vscode.window.showInformationMessage(errmsg);
						replaceDic[baseMatch[0]] = utils.getCommentText(errmsg);
						continue;
					}

					counter.incrementFile(includeType);
					let includeText = await this.loadInclude(includeFullPath, depth, withComment, counter);
					includeText = utils.getIncludeTextWithComment(includeText, depth, includeType, path.basename(includeFullPath), withComment);

					depth--;
					replaceDic[baseMatch[0]] = includeText;
				} else {
					if (includeType === utils.IncludeType.file && includePath.startsWith('/')) {
						counter.incrementFail();
						const errmsg = `Error: [#include file] does not start with "/": [${includePath}]`;
						vscode.window.showInformationMessage(errmsg);
						replaceDic[baseMatch[0]] = utils.getCommentText(errmsg);
						continue;
					}
				}
			}

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
		result = result + (this.eol === vscode.EndOfLine.LF ? "\n" : "\r\n");
		vscode.window.showInformationMessage(counter.getResultText());
		return result;
	}
};
