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
    let pkgInstalled = false
    if (installed.map(i => i.id).includes(argv.package)) {
        pkgInstalled = true;
    }

    let packages = JSON.parse(fs.readFileSync(home + "/repository/list.json").toString());

    if (!packages.includes(argv.package)) {
        die(c.red("error: ") + "package '" + argv.package + "' not in repository");
    }

    let dir = argv.package.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
    let pkg = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString());

    let compatible = true;
    let replacement = null;
    if (twiplatform === "win32" && pkg.platforms.windows === 0) {
        compatible = false;
        if (typeof pkg.replaced.windows === "string") {
            replacement = pkg.replaced.windows
        }
    } else if (twiplatform === "linux" && pkg.platforms.linux === 0) {
        compatible = false;
        if (typeof pkg.replaced.linux === "string") {
            replacement = pkg.replaced.linux
        }
    } else if (twiplatform === "darwin" && pkg.platforms.mac === 0) {
        compatible = false;
        if (typeof pkg.replaced.mac === "string") {
            replacement = pkg.replaced.mac
        }
    } else if (twiplatform === "alicorn" && pkg.platforms.alicorn === 0) {
        compatible = false;
        if (typeof pkg.replaced.alicorn === "string") {
            replacement = pkg.replaced.alicorn
        }
    }

    let experimental = false;
    if (twiplatform === "win32" && pkg.platforms.windows === 1) {
        experimental = true;
    } else if (twiplatform === "linux" && pkg.platforms.linux === 1) {
        experimental = true;
    } else if (twiplatform === "darwin" && pkg.platforms.mac === 1) {
        experimental = true;
    } else if (twiplatform === "alicorn" && pkg.platforms.alicorn === 1) {
        experimental = true;
    }

    let version = pkg.verdata.latest;
    let publisher = pkg.verdata.publisher.name;
    let publisherMail = pkg.verdata.publisher.email;
    let date = moment(pkg.verdata.date).fromNow();

    let signed = false;
    let signInfo = "";
    let verified = false;

    if (pkg.sign.signed) {
        signed = true;
        verified = pkg.sign.verified;
        if (pkg.sign.signer.name && pkg.sign.signer.email && pkg.sign.key) {
            signInfo = pkg.sign.signer.name + " <" + pkg.sign.signer.email + "> " + c.gray("(" + pkg.sign.key + ")");
        } else if (pkg.sign.signer.name && pkg.sign.key) {
            signInfo = pkg.sign.signer.name + c.gray(" (" + pkg.sign.key + ")");
        } else if (pkg.sign.signer.email && pkg.sign.key) {
            signInfo = pkg.sign.signer.email + c.gray(" (" + pkg.sign.key + ")");
        } else if (pkg.sign.key) {
            signInfo = pkg.sign.key;
        }
    }

    console.log(c.bold(pkg.name + ": " + pkg.description))
    console.log("    " + c.magentaBright("version:") + "     " + version);
    console.log("    " + c.magentaBright("last update:") + " " + date);
    console.log("    " + c.magentaBright("publisher:") + "   " + publisher + " <" + publisherMail + ">");

    if (signed) {
        if (verified) {
            console.log("    " + c.magentaBright("security:") + "    " + c.green("verified") + "\n                 " + signInfo);
        } else {
            console.log("    " + c.magentaBright("security:") + "    " + c.yellow("unverified") + "\n                 " + signInfo);
        }
    } else {
        console.log("    " + c.magentaBright("security:") + "    " + c.red.inverse("unsafe"));
    }

    if (pkgInstalled) {
        if (experimental) {
            console.log("    " + c.magentaBright("state:") + "       " + c.cyan("installed") + " (" + moment(installed.filter(i => i.id === pkg.id)[0].date).fromNow() + "), " + c.yellow("experimental"))
        } else {
            console.log("    " + c.magentaBright("state:") + "       " + c.cyan("installed") + " (" + moment(installed.filter(i => i.id === pkg.id)[0].date).fromNow() + ")")
        }
    } else {
        if (compatible) {
            if (experimental) {
                console.log("    " + c.magentaBright("state:") + "       " + c.green("compatible") + ", " + c.yellow("experimental"));
            } else {
                console.log("    " + c.magentaBright("state:") + "       " + c.green("compatible"));
            }
        } else {
            if (typeof replacement === "string") {
                console.log("    " + c.magentaBright("state:") + "       " + c.red("incompatible") + " (replaced by: " + replacement + ")");
            } else {
                console.log("    " + c.magentaBright("state:") + "       " + c.red("incompatible") + " (no replacement)");
            }
        }
    }

    if (typeof pkg.deprecated === "string") {
        if (pkg.deprecated.toString().trim() !== "") {
            console.log("    " + c.magentaBright("support:") + "     " + c.red("unsupported") + " (" + pkg.deprecated + ")");
        } else {
            console.log("    " + c.magentaBright("support:") + "     " + c.red("unsupported"));
        }
    } else if (typeof pkg.extended === "string") {
        if (pkg.extended.toString().trim() !== "") {
            console.log("    " + c.magentaBright("support:") + "     " + c.yellow("extended") + " (" + pkg.extended + ")");
        } else {
            console.log("    " + c.magentaBright("support:") + "     " + c.yellow("extended"));
        }
    } else {
        console.log("    " + c.magentaBright("support:") + "     " + c.green("supported"));
    }
}