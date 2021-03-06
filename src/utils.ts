import * as path from 'path';
import { workspace, TextDocument } from 'vscode';

export enum IncludeType {
	file = "FILE",
	virtual = "VIRTUAL",
}

export function getIncludeType(type: string): IncludeType {
	if (type.toUpperCase() === IncludeType.file) {
		return IncludeType.file;
	}
	return IncludeType.virtual;
}

/**
 * get include full path
 * @param includeType : FILE or VIRTUAL
 * @param includeFilePath
 * @param baseDoc 
 * @returns 
 */
export function getIncludeFullPath(includeType: IncludeType, includeFilePath: string, baseDoc: TextDocument): string {
	if (includeType === IncludeType.file && !includeFilePath.startsWith('/')) {
		//get relative path from the current file.
		return path.join(path.dirname(baseDoc.fileName), includeFilePath);
	} else if (includeType === IncludeType.virtual) {
		//get the path from root.
		const workspacePath = workspace.getWorkspaceFolder(baseDoc.uri)?.uri.path;
		if (workspacePath) {
			return path.join(workspacePath, includeFilePath);
		}
	}
	return "";
}

/**
 * get include comment with comment
 * @param text 
 * @param depth 
 * @param type 
 * @param path 
 * @returns 
 */
export function getIncludeTextWithComment(text: string, depth: number, type: string, path: string, withComment: boolean): string {
	if (withComment) {
		const beginComment = `${"  ".repeat((depth - 1))}'# Depth:${depth} # BEGIN INCLUDE ${type.toUpperCase()}: ${path} ${"-".repeat(120)}`.substr(0, 120);
		const endOfComment = `${"  ".repeat((depth - 1))}'# Depth:${depth} # END__ INCLUDE ${type.toUpperCase()}: ${path} ${"-".repeat(120)}`.substr(0, 120);
		text = `${getCommentText(beginComment)}
${text}
${getCommentText(endOfComment)}`;
	}
	return text;
}

/**
 * get comment text
 * @param text 
 * @returns 
 */
export function getCommentText(text: string) {
	return `<!-- ${text} -->`;
}

/**
 * escape invalid uri character
 * @param text 
 * @returns 
 */
export function getValidUriText(text: string): string {
	text = text.replace("#", "%23");
	text = text.replace("$", "%24");
	text = text.replace("&", "%26");
	text = text.replace("+", "%2B");
	text = text.replace(",", "%2C");
	text = text.replace(";", "%3B");
	text = text.replace("=", "%3D");
	text = text.replace("@", "%40");
	return text;
}

/**
 * type of FileCounter
 */
export type FileCounter = {
	incrementFile(type: IncludeType): void,
	incrementFail(): void,
	getResultText(): string
};

/**
 * create file counter
 * @returns FileCounter
 */
export function createFileCounter(): FileCounter {
	let countFile = 0;
	let countVirtual = 0;
	let countFail = 0;
	return {
		incrementFile(type: IncludeType) {
			if (type === IncludeType.file) { countFile++; }
			else if (type === IncludeType.virtual) { countVirtual++; }
		},
		incrementFail() { countFail++; },
		getResultText() { return `#include loaded | file:${countFile} | virtual:${countVirtual} | fail:${countFail}`; }
	};
}