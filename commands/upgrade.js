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

async function processQueue() {
    let pack = installed.filter(i => i.id === queue[0])[0];
    let dir = pack.id.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
    let pkg = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + pack.id + ".json").toString());
    let installable = true;

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

    spinner = ora("Checking dependencies...").start();
    for (let dependency of pkg.depends) {
        let cmd = "which";
        if (twiplatform === "win32") { cmd = "where"; }
        try {
            if (require('child_process').spawnSync(cmd, [dependency]).status !== 0) {
                spinner.fail("Checking dependencies... failed")
                die(c.red("error: ") + "package '" + pack.id + "' depends on '" + dependency + "' which is not installed");
            }
        } catch (e) {
            spinner.fail("Checking dependencies... failed")
            die(c.red("error: ") + "unable to check for '" + dependency + "'");
        }
    }
    spinner.succeed("Checking dependencies... done")

    console.log("  Installing '" + pkg.name + "'...")
    console.log("      version:   " + pack.version + " -> " + version);
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

    try {
        if (!signed && !(await prompts.confirm({
            message: "This package is unsafe, installing it may damage your system. Are you sure you want to continue?",
            initial: false
        }))) {
            installable = false;
        }
    } catch (e) {
        installable = false;
    }

    if (installable) {
        if (fs.existsSync(home + "/buildroot")) { fs.rmSync(home + "/buildroot", { recursive: true }) }
        require('../hooks/clone')(pkg.repo, pkg.branch, async () => {
            spinner = ora("Extracting package...").start();
            if (fs.existsSync(home + "/packages/" + pkg.id + "--update-" + version)) fs.rmSync(home + "/packages/" + pkg.id + "--update-" + version, { recursive: true })
            fs.renameSync(home + "/buildroot", home + "/packages/" + pkg.id + "--update-" + version);
            let change = require('../hooks/diff')((twiplatform === "alicorn" ? pkg.id.replaceAll("_", "-").replaceAll(".", "-").split("-").map((i) => { return i.substring(0, 1).toUpperCase() + i.substring(1).toLowerCase() }).join("") : pkg.id), pkg.id + "--update-" + version);
            require('../hooks/apply_update')(pkg.id, pkg.id + "--update-" + version);
            fs.rmSync(home + "/packages/" + pkg.id + "--update-" + version, { recursive: true });
            delete installed[installed.map(i => i.id).indexOf(pkg.id)];
            installed.push({
                id: pkg.id,
                date: new Date().toISOString(),
                version,
                files: require('../hooks/files')(pkg.id)
            })
            fs.writeFileSync(os.homedir() + "/.twilight/installed.json", JSON.stringify(installed));
            spinner.succeed("Extracting package... done");
            console.log("  Size change: " + change);

            let exec = pkg.id;
            if (typeof JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + pkg.id + ".json").toString()).execname === "string") {
                exec = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + pkg.id + ".json").toString()).execname;
            }

            if (twiplatform === "win32" && typeof pkg.executable.windows === "string") {
                fs.writeFileSync(os.homedir() + "/.twilight/binaries/" + pkg.id + ".bat", pkg.executable.windows);
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

            queue.shift();
            if (queue.length > 0) await processQueue();
        })
    }
}

module.exports = async (argv) => {
    global.installed = JSON.parse(fs.readFileSync(home + "/installed.json").toString());

    let spinner = ora("Reading package lists...").start();
    let packages = JSON.parse(fs.readFileSync(home + "/repository/list.json").toString());
    spinner.succeed("Reading packages lists... done");
    let updated = false;
    let affected = false;
    global.queue = [];

    for (let pack of installed) {
        if (!packages.includes(pack.id)) {
            console.log(c.yellow("warn: ") + "package '" + pack.id + "' not in repository anymore");
        } else {
            let installable = true;
            let dir = pack.id.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
            let pkg = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + pack.id + ".json").toString());
            if ((argv.package !== undefined && argv.package === pack.id) || argv.package === undefined) {
                updated = true;

                if (twiplatform === "win32" && pkg.platforms.windows === 0) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' not available on platform 'win32' anymore");
                    installable = false;
                } else if (twiplatform === "linux" && pkg.platforms.linux === 0) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' not available on platform 'linux' anymore");
                    installable = false;
                } else if (twiplatform === "darwin" && pkg.platforms.mac === 0) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' not available on platform 'macos' anymore");
                    installable = false;
                } else if (twiplatform === "alicorn" && pkg.platforms.alicorn === 0) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' not available on platform 'alicorn' anymore");
                    installable = false;
                }

                if (twiplatform === "win32" && pkg.platforms.windows === 1) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' is experimental on platform 'win32'");
                } else if (twiplatform === "linux" && pkg.platforms.linux === 1) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' is experimental on platform 'linux'");
                } else if (twiplatform === "darwin" && pkg.platforms.mac === 1) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' is experimental on platform 'macos'");
                } else if (twiplatform === "alicorn" && pkg.platforms.mac === 1) {
                    console.log(c.yellow("warn: ") + "package '" + pack.id + "' is experimental on platform 'alicorn'");
                }

                if (installable) {
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

                    if (pack.version !== version) {
                        queue.push(pack.id);
                        affected = true;
                    } else if (argv.package !== undefined && argv.package === pack.id) {
                        die(c.red("error: ") + "package '" + argv.package + "' is up to date");
                    }
                } else if (argv.package !== undefined && argv.package === pack.id) {
                    die(c.red("error: ") + "package '" + argv.package + "' cannot be updated");
                }
            }
        }
    }

    if (!updated) {
        die(c.red("error: ") + "package '" + argv.package + "' not installed");
    }

    if (!affected) {
        die("All packages are up to date");
    }

    await processQueue();
}