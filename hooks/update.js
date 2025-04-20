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
    let oldPercentage = -1;
    let oldPercTime = new Date();
    let timePerPerc = -1;
    let timePerPercData = [];
    let eta = -1;

    const spinner = ora("Fetching package lists...").start();
    let list = (await axios.get("https://twipkg.cdn.minteck.org/packages.json")).data;

    if (fs.existsSync(home + "/repository")) {
        for (let item of fs.readdirSync(home + "/repository")) {
            fs.rmSync(home + "/repository/" + item, { recursive: true });
        }
    } else {
        fs.mkdirSync(home + "/repository");
    }

    fs.writeFileSync(home + "/repository/list.json", JSON.stringify(list));

    let index = 0;
    for (let pkg of list) {
        if ((index / list.length) * 100 !== oldPercentage) {
            timePerPercData.push(oldPercTime - new Date());
            timePerPerc = timePerPercData.reduce((x, y) => x + y) / timePerPercData.length;
            eta = -((timePerPerc * (100 - ((index / list.length) * 100))) / 1000);
            oldPercTime = new Date();
        }
        if (eta > 1) {
            if (eta > 60) {
                spinner.text = "Fetching package lists...\n    " + Math.round((index / list.length) * 100) + "% completed\n    about " + Math.round(eta / 60) + " minute" + (Math.round(eta / 60) > 1 ? "s" : "") + " remaining";
            } else {
                spinner.text = "Fetching package lists...\n    " + Math.round((index / list.length) * 100) + "% completed\n    about " + Math.round(eta) + " second" + (Math.round(eta) > 1 ? "s" : "") + " remaining";
            }
        } else {
            spinner.text = "Fetching package lists...\n    " + Math.round((index / list.length) * 100) + "% completed\n    calculating remaining time...";
        }
        let dir = pkg.substring(0, 1).replace(/[^a-zA-Z0-9]/gm, "#");
        try {
            let pack = (await axios.get("https://twipkg.cdn.minteck.org/" + dir + "/" + pkg + ".json")).data;

            let verdata = (await axios.get(pack.version)).data;
            pack.verdata = {
                latest: verdata.commit.short_id,
                publisher: {
                    name: verdata.commit.author_name,
                    email: verdata.commit.author_email
                },
                date: verdata.commit.created_at
            }

            if (typeof pack.pointrelease === "string") {
                pack.verdata.latest = pack.pointrelease;
            }

            let signRaw = { error: "404 Not Found" };
            try {
                signRaw = (await axios.get(pack.signature.replace("{version}", verdata.commit.id))).data;
            } catch (e) {}
            pack.sign = {
                signed: false,
                verified: false,
                key: null,
                signer: {
                    name: null,
                    email: null
                }
            }
            if (signRaw.error !== "404 Not Found") {
                pack.sign.signed = true;
                if (signRaw.verification_status === "verified") {
                    pack.sign.verified = true;
                } else {
                    pack.sign.verified = false;
                }
                if (signRaw.gpg_key_user_name) {
                    pack.sign.signer.name = signRaw.gpg_key_user_name;
                }
                if (signRaw.gpg_key_user_email) {
                    pack.sign.signer.email = signRaw.gpg_key_user_email;
                }
                if (signRaw.gpg_key_primary_keyid) {
                    pack.sign.key = signRaw.gpg_key_primary_keyid;
                }
            }

            if (!fs.existsSync(home + "/repository/" + dir)) {
                fs.mkdirSync(home + "/repository/" + dir);
            }
            fs.writeFileSync(home + "/repository/" + dir + "/" + pkg + ".json", JSON.stringify(pack));
        } catch (e) {
            console.log("\n" + c.yellow("warn:") + " package '" + pkg + "' is not available on the repository yet");
        }

        index++;
    }

    spinner.succeed("Fetching package lists... done");
    //process.exit();
}