import * as assert from 'assert';
import { join } from 'path';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as myExtension from '../../extension';
import * as myProvider from '../../SsiDocumentContentProvider';
import * as myUtils from '../../utils';

const rootTestDir = "../../../src/test/file/";
const rootResultDir = "../../../src/test/result/";

suite('Extension Test Suite', () => {
	async function getResult(testFile: string) {
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(join(__dirname, rootTestDir, testFile)));
		const actual = await myProvider.loadInclude(document.fileName, 0, false, myUtils.createFileCounter());
		const expected = fs.readFileSync(join(__dirname, rootResultDir, testFile), { encoding: 'utf8' });
		return { actual: actual, expected: expected };
	}

	test('test1', async () => {
		const result = await getResult('test1.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test2', async () => {
		const result = await getResult('test2.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test3', async () => {
		const result = await getResult('test3.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test4', async () => {
		const result = await getResult('test4.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test5', async () => {
		const result = await getResult('xxx/test5.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test6', async () => {
		const result = await getResult('xxx/test6.asp');
		assert.strictEqual(result.actual, result.expected);
	});

});
