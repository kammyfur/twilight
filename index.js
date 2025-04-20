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

if (require('fs').existsSync("emuAlicorn") || require('fs').existsSync('/System/AlicornCore')) {
    global.twiplatform = "alicorn";
} else {
    global.twiplatform = require('os').platform();
}

process.on('uncaughtException', async (e) => {
    global.c = (await import('chalk')).default;

    if (!fs.existsSync(os.homedir() + "/.twilight/crashes")) {
        fs.mkdirSync(os.homedir() + "/.twilight/crashes")
    }

    let date = new Date().toISOString().replace(/[^a-zA-Z0-9-]/gm, "-");
    fs.writeFileSync(require('os').homedir() + "/.twilight/crashes/" + date + ".txt", e.stack);

    console.log(c.red("error:") + " an internal error occurred, did you forget to run 'twi update'?");
    if (twiplatform === "alicorn") {
        console.log("       additionally, a crash report has been saved to:\n         /Library/Logs/TwilightCrashes/" + date + ".txt")
    } else {
        console.log("       additionally, a crash report has been saved to:\n         " + require('os').homedir() + (twiplatform === "win32" ? "\\" : "/") + ".twilight" + (twiplatform === "win32" ? "\\" : "/") + "crashes" + (twiplatform === "win32" ? "\\" : "/") + date + ".txt")
    }
    process.exit(2);
})

try {
    (async () => {
        global.yargs = require('yargs/yargs');
        const { hideBin } = require('yargs/helpers');
        global.git = require('simple-git');
        global.ora = (await import('ora')).default;
        global.c = (await import('chalk')).default;
        global.fs = require('fs');
        global.os = require('os');
        global.axios = require('axios');
        global.moment = require('moment');
        global.prompts = require('prompts').prompts;


        if (!fs.existsSync(os.homedir() + "/.twilight")) {
            fs.mkdirSync(os.homedir() + "/.twilight")
        }

        if (!fs.existsSync(os.homedir() + "/.twilight/packages")) {
            fs.mkdirSync(os.homedir() + "/.twilight/packages")
        }

        if (!fs.existsSync(os.homedir() + "/.twilight/crashes")) {
            fs.mkdirSync(os.homedir() + "/.twilight/crashes")
        }

        if (!fs.existsSync(os.homedir() + "/.twilight/binaries")) {
            fs.mkdirSync(os.homedir() + "/.twilight/binaries")
        }

        if (!fs.existsSync(os.homedir() + "/.twilight/installed.json")) {
            fs.writeFileSync(os.homedir() + "/.twilight/installed.json", "[]");
        } else {
            fs.writeFileSync(os.homedir() + "/.twilight/installed.json", JSON.stringify(JSON.parse(fs.readFileSync(os.homedir() + "/.twilight/installed.json").toString()).filter(i => i !== null)));
        }

        global.home = os.homedir() + "/.twilight";

        global.die = (text, code) => {
            fs.rmSync(home + "/runtime.pid");
            if (text) {
                console.log(text);
                if (code) {
                    process.exit(code);
                } else {
                    process.exit();
                }
            } else {
                if (code) {
                    process.exit(code);
                } else {
                    process.exit();
                }
            }
        }
        let pargv = process.argv;
        pargv[1] = "twi";

        global.argv = yargs(pargv.slice(2))
            .command(["install <package>", "i <package>", "a <package>", "add <package>"], "Install a package")
            .command(["reinstall <package>", "ri <package>", "reset <package>", "rs <package>"], "Online reinstall an installed package")
            .command(["remove <package>", "r <package>", "del <package>", "rm <package>", "delete <package>", "uninstall <package>", "u <package>"], "Delete a package")
            .command(["update", "ud", "fetch", "refresh", "reload", "rl"], "Fetches the repository")
            .command(["upgrade [package]", "ug [package]"], "Update one or all package(s)")
            .command(["purge <package>", "p <package>", "ori <package>", "ors <package>", "oreset <package>", "oreinstall <package>"], "Offline reinstall an installed package")
            .command(["info <package>", "inf <package>", "view <package>", "v <package>", "if <package>"], "Get info about a package")
            .command(["list", "l", "ls", "all"], "List all packages in the repository")
            .command(["installed", "il", "lil", "lsil", "allil"], "List all installed packages")
            .command(["installable", "ia", "lia", "lsia", "allia"], "List all compatible packages")
            .help()
            .alias("help", "h")
            .alias("version", "V")
            .example("twi install neutron", "Install Neutron")
            .example("twi update", "Update all packages")
            .example("twi info ponyfind", "Show info about Ponyfind")
            .strictCommands()
            .demandCommand(1)
            .epilog("Twilight Package Manager v" + require('./package.json').version)
            .usage('Usage: twi <command> [arguments...]')
            .argv;

        if (fs.existsSync(home + "/runtime.pid")) {
            let pid = fs.readFileSync(home + "/runtime.pid") - 1 + 1;
            try {
                process.kill(pid, 0);
                die(c.red("error:") + " another instance is running (" + pid + ")");
            } catch (e) {
                console.log(c.yellow("warn:") + " process was stopped unexpectedly");
            }
        }

        fs.writeFileSync(home + "/runtime.pid", process.pid.toString());
        let command = argv._[0];
        let aliases = require('./commands/aliases.json');
        if ([].concat(Object.keys(aliases).map(i => aliases[i])).flat(1).includes(command)) {
            command = Object.keys(aliases).map(i => { if (aliases[i].includes(command)) { return i; } else { return null; } }).filter(i => i !== null)[0];
        }
        await require('./commands/' + command)(argv);

        fs.rmSync(home + "/runtime.pid");
    })()
} catch (e) {
    console.log("error: an internal error occurred, did you forget to run 'twi update'?");
    process.exit(2);
}