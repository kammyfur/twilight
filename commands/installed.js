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

module.exports = async () => {
    let packages = JSON.parse(fs.readFileSync(home + "/repository/list.json").toString()).sort();
    let installed = JSON.parse(fs.readFileSync(home + "/installed.json").toString()).map(i => i.id);
    let installs = JSON.parse(fs.readFileSync(home + "/installed.json").toString());

    let signs = {};
    let dates = {};
    let platforms = {};

    for (let pkg of packages) {
        let dir = pkg.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
        let pack = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + pkg + ".json").toString());

        let signed = false;
        let signInfo = "";
        let verified = false;

        if (pack.sign.signed) {
            signed = true;
            verified = pack.sign.verified;
            if (pack.sign.signer.name && pack.sign.signer.email && pack.sign.key) {
                signInfo = pack.sign.signer.name + " <" + pack.sign.signer.email + "> " + c.gray("(" + pack.sign.key + ")");
            } else if (pack.sign.signer.name && pack.sign.key) {
                signInfo = pack.sign.signer.name + c.gray(" (" + pack.sign.key + ")");
            } else if (pkg.sign.signer.email && pkg.sign.key) {
                signInfo = pkg.sign.signer.email + c.gray(" (" + pkg.sign.key + ")");
            } else if (pkg.sign.key) {
                signInfo = pkg.sign.key;
            }
        }

        if (signed) {
            if (verified) {
                signs[pack.id] = c.green("verified");
            } else {
                signs[pack.id] = c.yellow("unverified");
            }
        } else {
            signs[pack.id] = c.red("unsafe");
        }

        if (pack.platforms.windows === 2 && pack.platforms.linux === 2 && pack.platforms.mac === 2 && pack.platforms.alicorn === 2) {
            platforms[pack.id] = c.cyan("all");
        } else if (pack.platforms.windows === 1 && pack.platforms.linux === 1 && pack.platforms.mac === 1 && pack.platforms.alicorn === 1) {
            platforms[pack.id] = c.yellow("all");
        } else {
            platforms[pack.id] = "";
            if (pack.platforms.windows === 1) { platforms[pack.id] += c.yellow("win32") + "," }
            if (pack.platforms.windows === 2) { platforms[pack.id] += c.cyan("win32") + "," }
            if (pack.platforms.linux === 1) { platforms[pack.id] += c.yellow("linux") + "," }
            if (pack.platforms.linux === 2) { platforms[pack.id] += c.cyan("linux") + "," }
            if (pack.platforms.mac === 1) { platforms[pack.id] += c.yellow("macos") + "," }
            if (pack.platforms.mac === 2) { platforms[pack.id] += c.cyan("macos") + "," }
            if (pack.platforms.alicorn === 1) { platforms[pack.id] += c.yellow("alicorn") + "," }
            if (pack.platforms.alicorn === 2) { platforms[pack.id] += c.cyan("alicorn") + "," }

            if (platforms[pack.id].endsWith(",")) { platforms[pack.id] = platforms[pack.id].substring(0, platforms[pack.id].length - 1) }
        }
    }

    for (let pkg of packages) {
        let dir = pkg.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
        let pack = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + pkg + ".json").toString());

        let add = "";
        if (installed.includes(pack.id)) {
            console.log(c.green(pack.id) + "/" + signs[pack.id] + " " + pack.verdata.latest + " " + platforms[pack.id] + add)
        }
    }
}