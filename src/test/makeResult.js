const fs = require('fs');
const path = require("path");
const { exec } = require('child_process');

const getAllFiles = (dir, list) => {
    let files = fs.readdirSync(dir);
    list = list || [];
    files.forEach((file) => {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            list = getAllFiles(path.join(dir, file), list);
        } else {
            list.push(path.join(dir, file));
        }
    });
    return list;
};

const site = process.argv[2];
const rootPath = path.join(process.cwd(), "file/");
let files = getAllFiles(rootPath);

if (site) {
    const resultPath = path.join(process.cwd(), "result/");
    files.forEach(file => {
        const name = path.parse(file).name;
        const page = file.replace(rootPath, "");
        const url = `http://${site}/${page}`;
        if (name.startsWith("test") && !name.endsWith("_error")) {
            const cmd = `curl ${url} -o ${resultPath}${page}`;
            console.log(cmd);
            exec(cmd);
        }
    });
} else {
    files = files.sort((x, y) => {
        if (path.parse(x).name < path.parse(y).name) { return -1; }
        if (path.parse(y).name < path.parse(x).name) { return 1; }
        return 0;
    });

    files.forEach(file => {
        const name = path.parse(file).name;
        const page = file.replace(rootPath, "");
        if (name.startsWith("test")) {
            console.log(`test('${name}', async () => {
    const result = await getResult('${page}');
    assert.strictEqual(result.actual, result.expected);
});
`);
        }
    });
}
