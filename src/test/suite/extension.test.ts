import * as assert from 'assert';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { join } from 'path';

const rootTestDir = "../../../src/test/file/";
const rootResultDir = "../../../src/test/result/";

suite('Extension Test Suite', () => {
	async function getResult(testFile: string) {
		const document = await vscode.workspace.openTextDocument(join(__dirname, rootTestDir, testFile));
		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand('vscode-ssi-viewer.load');
		const actual = vscode.window.activeTextEditor?.document.getText();
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

	test('test3_error', async () => {
		const result = await getResult('test3_error.asp');
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

	test('test7_error', async () => {
		const result = await getResult('xxx/test7_error.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test8', async () => {
		const result = await getResult('test8.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test9_error', async () => {
		const result = await getResult('test9_error.asp');
		assert.strictEqual(result.actual, result.expected);
	});

	test('test10', async () => {
		const result = await getResult('test10.asp');
		assert.strictEqual(result.actual, result.expected);
	});

});
