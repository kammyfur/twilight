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

const getAllFiles = function(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function(file) {
        if (file !== ".git") {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
            } else {
                arrayOfFiles.push(dirPath + "/" + file)
            }
        }
    })

    return arrayOfFiles
}

module.exports = (pkg1, pkg2) => {
    asize1 = getAllFiles((home + "/packages/" + pkg1).replaceAll("\\", "/")).map(i => i.replaceAll("\\", "/").replaceAll((home + "/packages/" + pkg1).replaceAll("\\", "/") + "/", "")).map(i => fs.readFileSync(home + "/packages/" + pkg1 + "/" + i).length).reduce((a, b) => a + b);
    asize2 = getAllFiles((home + "/packages/" + pkg2).replaceAll("\\", "/")).map(i => i.replaceAll("\\", "/").replaceAll((home + "/packages/" + pkg2).replaceAll("\\", "/") + "/", "")).map(i => fs.readFileSync(home + "/packages/" + pkg2 + "/" + i).length).reduce((a, b) => a + b);

    asize = asize2 - asize1;
    if (asize > 0) {
        s = "+";
    } else if (asize < 0) {
        s = "-";
    } else {
        s = "±";
    }
    asize = Math.abs(asize);

    if (asize > 1024) {
        if (asize > 1048576) {
            return s + (asize / 1048576).toFixed(1) + "M";
        } else {
            return s + (asize / 1024).toFixed(1) + "K";
        }
    } else {
        return s + asize + "B";
    }
}