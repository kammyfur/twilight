/*
 * MIT License
 *
 * Copyright (c) 2022- Minteck
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

module.exports = async (argv) => {
    const installed = JSON.parse(fs.readFileSync(home + "/installed.json").toString());
    if (!installed.map(i => i.id).includes(argv.package)) {
        die(c.red("error: ") + "package '" + argv.package + "' is not installed");
    }

    let spinner = ora("Reading package lists...").start();
    let packages = JSON.parse(fs.readFileSync(home + "/repository/list.json").toString());
    spinner.succeed("Reading packages lists... done");

    let dir = argv.package.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");

    if (!packages.includes(argv.package)) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' not in repository anymore");
        name = argv.package;
    } else {
        name = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).name;
    }

    instInfo = installed.filter(i => i.id === argv.package)[0];

    console.log("  Purging '" + name + "'...")
    console.log("      version:   " + instInfo.version);
    console.log("      installed: " + moment(instInfo.date).fromNow());

    try {
        if (!(await prompts.confirm({
            message: "Purging this package will delete all associated data. Are you sure you want to continue?",
            initial: false
        }))) {
            die();
        }
    } catch (e) {
        die();
    }

    spinner = ora("Reading files list...").start();
    files1 = instInfo.files;
    files2 = require('../hooks/files')(instInfo.id);
    filesR = files2.filter(f => !files1.includes(f));
    spinner.succeed("Reading files list... done");
    if (filesR.length === 0) {
        die(c.red("error: ") + "this installation of package '" + argv.package + "' cannot be purged, use 'twi reinstall' instead");
    }

    spinner = ora("Removing user files...").start();
    let index = 0
    for (let file of filesR) {
        spinner.text = "Removing user files... " + Math.round((index / filesR.length) * 100) + "%";
        fs.rmSync(home + "/packages/" + argv.package + "/" + file);
        index++;
    }
    spinner.succeed("Removing user files... done");
}