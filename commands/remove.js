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

module.exports = async (argv, reinstalling) => {
    if (reinstalling === undefined) {
         reinstalling = false;
    }

    const installed = JSON.parse(fs.readFileSync(home + "/installed.json").toString());
    if (!installed.map(i => i.id).includes(argv.package)) {
        die(c.red("error: ") + "package '" + argv.package + "' is not installed");
    }

    let spinner = ora("Reading package lists...").start();
    let packages = JSON.parse(fs.readFileSync(home + "/repository/list.json").toString());
    spinner.succeed("Reading packages lists... done");
    let updated = false;

    let dir = argv.package.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");

    if (!packages.includes(argv.package)) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' not in repository anymore, unable to fetch for name");
        name = argv.package;
    } else {
        name = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).name;
    }

    if (argv.package === "twilight") {
        die(c.red("error: ") + "package 'twilight' is system package and cannot be uninstalled, use 'twilight-setup' instead");
    }

    instInfo = installed.filter(i => i.id === argv.package)[0];

    console.log("  Uninstalling '" + name + "'...")
    console.log("      version:   " + instInfo.version);
    console.log("      installed: " + moment(instInfo.date).fromNow());
    console.log("      size:      " + require('../hooks/size.js')(argv.package));

    if (reinstalling) {
        try {
            if (!(await prompts.confirm({
                message: "Reinstalling this package will delete all associated data. Are you sure you want to continue?",
                initial: false
            }))) {
                die();
            }
        } catch (e) {
            die();
        }
    } else {
        try {
            if (!(await prompts.confirm({
                message: "Uninstalling this package will also delete all associated data. Are you sure you want to continue?",
                initial: false
            }))) {
                die();
            }
        } catch (e) {
            die();
        }
    }

    spinner = ora("Removing package...").start();
    fs.rmSync(home + "/packages/" + (twiplatform === "alicorn" ? argv.package.replaceAll("_", "-").replaceAll(".", "-").split("-").map((i) => { return i.substring(0, 1).toUpperCase() + i.substring(1).toLowerCase() }).join("") : argv.package), { recursive: true });
    delete installed[installed.map(i => i.id).indexOf(argv.package)];
    fs.writeFileSync(os.homedir() + "/.twilight/installed.json", JSON.stringify(installed));

    let exec = argv.package;
    if (!packages.includes(argv.package)) {
        exec = argv.package;
    } else if (typeof JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).execname === "string") {
        exec = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).execname;
    }
    if (fs.existsSync(os.homedir() + "/.twilight/binaries/" + exec + ".bat")) fs.unlinkSync(os.homedir() + "/.twilight/binaries/" + exec + ".bat");
    if (fs.existsSync(os.homedir() + "/.twilight/binaries/" + exec + ".sh")) fs.unlinkSync(os.homedir() + "/.twilight/binaries/" + exec + ".sh");
    if (fs.existsSync(os.homedir() + "/.twilight/binaries/" + exec)) fs.unlinkSync(os.homedir() + "/.twilight/binaries/" + exec);

    spinner.succeed("Removing package... done");

    if (!packages.includes(argv.package)) {
        console.log(c.yellow("warn: ") + "package '" + argv.package + "' not in repository anymore, unable to fetch for post-remove hooks");
    } else {
        ppr = JSON.parse(fs.readFileSync(home + "/repository/" + dir + "/" + argv.package + ".json").toString()).postremove;

        let postremove = [];
        if (twiplatform === "win32") postremove = ppr.windows;
        if (twiplatform === "linux") postremove = ppr.linux;
        if (twiplatform === "darwin") postremove = ppr.mac;
        if (twiplatform === "alicorn") postremove = ppr.alicorn;

        if (postremove.length > 0) {
            spinner = ora("Running post-remove hooks...").start();
            for (let hook of postremove) {
                require('child_process').execSync(hook, { stdio: "inherit" })
            }
            spinner.succeed("Running post-remove hooks... done");
        }
    }
}