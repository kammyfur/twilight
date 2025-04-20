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
    if (installed.map(i => i.id).includes(argv.package)) {
        die(c.red("error: ") + "package '" + argv.package + "' is already installed (version " + installed.filter(i => i.id === argv.package)[0].version + ", installed " + moment(installed.filter(i => i.id === argv.package)[0].date).fromNow() + ")");
    }

    let spinner = ora("Reading package lists...").start();
    let packages = JSON.parse(fs.readFileSync(home + "/repository/list.json").toString());
    spinner.succeed("Reading packages lists... done");

    if (!packages.includes(argv.package)) {
        die(c.red("error: ") + "package '" + argv.package + "' not in repository");
    }

    let dir = argv.package.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
    let pkg = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString());

    let replacement = null;
    if (twiplatform === "win32" && pkg.platforms.windows === 0) {
        if (typeof pkg.replaced.windows === "string") {
            replacement = pkg.replaced.windows
        }
    } else if (twiplatform === "linux" && pkg.platforms.linux === 0) {
        if (typeof pkg.replaced.linux === "string") {
            replacement = pkg.replaced.linux
        }
    } else if (twiplatform === "darwin" && pkg.platforms.mac === 0) {
        if (typeof pkg.replaced.mac === "string") {
            replacement = pkg.replaced.mac
        }
    } else if (twiplatform === "alicorn" && pkg.platforms.alicorn === 0) {
        if (typeof pkg.replaced.alicorn === "string") {
            replacement = pkg.replaced.alicorn
        }
    }

    if (twiplatform === "win32" && pkg.platforms.windows === 0) {
        if (typeof replacement === "string") {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'win32', replaced by '" + replacement + "'");
        } else {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'win32', no replacement available");
        }
    } else if (twiplatform === "linux" && pkg.platforms.linux === 0) {
        if (typeof replacement === "string") {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'linux', replaced by '" + replacement + "'");
        } else {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'linux', no replacement available");
        }
    } else if (twiplatform === "darwin" && pkg.platforms.mac === 0) {
        if (typeof replacement === "string") {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'macos', replaced by '" + replacement + "'");
        } else {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'macos', no replacement available");
        }
    } else if (twiplatform === "alicorn" && pkg.platforms.alicorn === 0) {
        if (typeof replacement === "string") {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'alicorn', replaced by '" + replacement + "'");
        } else {
            die(c.red("error: ") + "package '" + argv.package + "' not available on platform 'alicorn', no replacement available");
        }
    }

    if (twiplatform === "win32" && pkg.platforms.windows === 1) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' is experimental on platform 'win32'");
    } else if (twiplatform === "linux" && pkg.platforms.linux === 1) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' is experimental on platform 'linux'");
    } else if (twiplatform === "darwin" && pkg.platforms.mac === 1) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' is experimental on platform 'macos'");
    } else if (twiplatform === "alicorn" && pkg.platforms.alicorn === 1) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' is experimental on platform 'alicorn'");
    }

    spinner = ora("Checking dependencies...").start();
    for (let dependency of pkg.depends) {
        let cmd = "which";
        if (twiplatform === "win32") { cmd = "where"; }
        try {
            if (require('child_process').spawnSync(cmd, [dependency]).status !== 0) {
                spinner.fail("Checking dependencies... failed")
                die(c.red("error: ") + "package '" + argv.package + "' depends on '" + dependency + "' which is not installed");
            }
        } catch (e) {
            spinner.fail("Checking dependencies... failed")
            die(c.red("error: ") + "unable to check for '" + dependency + "'");
        }
    }
    spinner.succeed("Checking dependencies... done")

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

    console.log("  Installing '" + pkg.name + "'...")
    console.log("      version:   " + version);
    console.log("      release:   " + date);
    console.log("      publisher: " + publisher + " <" + publisherMail + ">");

    if (signed) {
        if (verified) {
            console.log("      security:  " + c.green("verified") + " " + signInfo);
        } else {
            console.log("      security:  " + c.yellow("unverified") + " " + signInfo);
        }
    } else {
        console.log("      security:  " + c.red.inverse("unsafe"));
    }

    if (typeof pkg.deprecated === "string") {
        if (pkg.deprecated.toString().trim() !== "") {
            console.log(c.yellow("warn: ") + "package '" + pkg.id + "' has been marked as deprecated: " + pkg.deprecated);
        } else {
            console.log(c.yellow("warn: ") + "package '" + pkg.id + "' has been marked as deprecated");
        }
    }

    try {
        if (!signed && !(await prompts.confirm({
            message: "This package is unsafe, installing it may damage your system. Are you sure you want to continue?",
            initial: false
        }))) {
            die();
        }
    } catch (e) {
        die();
    }

    if (fs.existsSync(home + "/buildroot")) { fs.rmSync(home + "/buildroot", { recursive: true }) }
    require('../hooks/clone')(pkg.repo, pkg.branch, () => {
        spinner = ora("Extracting package...").start();
        fs.renameSync(home + "/buildroot", home + "/packages/" + (twiplatform === "alicorn" ? pkg.id.replaceAll("_", "-").replaceAll(".", "-").split("-").map((i) => { return i.substring(0, 1).toUpperCase() + i.substring(1).toLowerCase() }).join("") : pkg.id));
        installed.push({
            id: pkg.id,
            date: new Date().toISOString(),
            version,
            files: require('../hooks/files')(pkg.id)
        })
        fs.writeFileSync(os.homedir() + "/.twilight/installed.json", JSON.stringify(installed));
        spinner.succeed("Extracting package... done");
        console.log("  Size change: +" + require('../hooks/size')(pkg.id));

        let exec = argv.package;
        if (typeof JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).execname === "string") {
            exec = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).execname;
        }

        if (twiplatform === "win32" && typeof pkg.executable.windows === "string") {
            fs.writeFileSync(os.homedir() + "/.twilight/binaries/" + exec + ".bat", pkg.executable.windows);
        } else if (twiplatform === "linux" && typeof pkg.executable.linux === "string") {
            fs.writeFileSync(os.homedir() + "/.twilight/binaries/" + exec, pkg.executable.linux);
            require('child_process').spawnSync("chmod", [ "+x", os.homedir() + "/.twilight/binaries/" + exec ])
        } else if (twiplatform === "darwin" && typeof pkg.executable.mac === "string") {
            fs.writeFileSync(os.homedir() + "/.twilight/binaries/" + exec, pkg.executable.mac);
            require('child_process').spawnSync("chmod", [ "+x", os.homedir() + "/.twilight/binaries/" + exec ])
        } else if (twiplatform === "alicorn" && typeof pkg.executable.alicorn === "string") {
            fs.writeFileSync(os.homedir() + "/.twilight/binaries/" + exec, pkg.executable.alicorn);
            require('child_process').spawnSync("chmod", [ "+x", os.homedir() + "/.twilight/binaries/" + exec ])
        }

        let postinstall = [];
        if (twiplatform === "win32") postinstall = pkg.postinstall.windows;
        if (twiplatform === "linux") postinstall = pkg.postinstall.linux;
        if (twiplatform === "darwin") postinstall = pkg.postinstall.mac;
        if (twiplatform === "alicorn") postinstall = pkg.postinstall.alicorn;

        if (postinstall.length > 0) {
            spinner = ora("Running post-install hooks...").start();
            for (let hook of postinstall) {
                require('child_process').execSync(hook, { stdio: "inherit" })
            }
            spinner.succeed("Running post-install hooks... done");
        }
    })
}