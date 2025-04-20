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

module.exports = (pkg, tempDir) => {
    let pkg2 = (twiplatform === "alicorn" ? pkg.replaceAll("_", "-").replaceAll(".", "-").split("-").map((i) => { return i.substring(0, 1).toUpperCase() + i.substring(1).toLowerCase() }).join("") : pkg)

    const getAllDirs = function(dirPath, arrayOfFiles) {
        files = fs.readdirSync(dirPath)

        arrayOfFiles = arrayOfFiles || []

        files.forEach(function(file) {
            if (file !== ".git") {
                if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                    arrayOfFiles.push(dirPath + "/" + file)
                    arrayOfFiles = getAllDirs(dirPath + "/" + file, arrayOfFiles)
                }
            }
        })

        return arrayOfFiles
    }

    dirs = getAllDirs((home + "/packages/" + tempDir).replaceAll("\\", "/")).map(i => i.replaceAll("\\", "/").replaceAll((home + "/packages/" + tempDir).replaceAll("\\", "/") + "/", ""));
    for (let dir of dirs) {
        if (!fs.existsSync(home + "/packages/" + pkg2 + "/" + dir)) {
            fs.mkdirSync(home + "/packages/" + pkg2 + "/" + dir);
        }
    }

    files = require('./files')(tempDir);
    for (let file of files) {
        if (file.trim() !== "") {
            fs.copyFileSync(home + "/packages/" + tempDir + "/" + file, home + "/packages/" + pkg2 + "/" + file);
        }
    }
}