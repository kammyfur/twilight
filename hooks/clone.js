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

module.exports = (repo, branch, callback) => {
    const spinner = ora("Downloading package...").start();

    if (twiplatform === "win32") {
        git = require('child_process').execSync("where git").toString().trim();
    } else {
        git = require('child_process').execSync("which git").toString().trim();
    }

    cp = require('child_process').spawn(git, ["clone", "--progress", "-b", branch, "--", repo, home + "/buildroot"], {/*stdio: "inherit"*/});

    cp.stdout.on('data', (data) => {
         spinner.text = data.toString().trim().split("\n")[data.toString().trim().split("\n").length - 1];
    })

    cp.stderr.on('data', (data) => {
        spinner.text = data.toString().trim().split("\n")[data.toString().trim().split("\n").length - 1].replace(/[^0-9a-zA-z: -,.!? \/\(\)]*/gm, "");
    })

    cp.on('close', (code) => {
        if (code !== 0) {
            throw new Error("Process exited with code " + code);
        } else {
            spinner.succeed("Downloading package... done");
            callback();
        }
    })
}