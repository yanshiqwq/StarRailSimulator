const express = require("express");
const yaml = require("yaml");
const fs = require("fs");
const app = express();

const utils = require("./utils");
eval(utils.console.setup);
utils.console.init("log");

const process = require("process");
process.on("uncaughtException", async function (err) {
	exit(error(`Fetched an uncaught exception: ${err.stack}.`));
});

async function cmdLoop() {
	while (1) {
		var input = await rlsync.question();
		var argv = input.split(config.server.argv_split);
		if (argv[0] != "") {
			debug(`cmdEval: ${argv.join(" ")}`);
			if (argv[0] == "eval") {
				try {
					eval(argv.slice(1).join(" "));
				} catch (err) {
					emptyLine().then(error(err.stack));
				}
			} else {
				if (!(argv[0] in cmdApi)) {
					emptyLine()
						.then(warn(lang.server.invalidCmd.render(argv[0])))
						.then(rl.prompt());
				} else {
					var cmd = `cmdApi.${argv[0]}(${
						"`" + argv.slice(1).join("`,`") + "`"
					})`;
					emptyLine().then(debug(cmd));
					try {
						eval(cmd);
					} catch (err) {
						emptyLine().then(error(err.stack));
					}
				}
			}
		}
	}
}

const child_process = require("child_process");
const chalk = require("chalk");
const version = `v${child_process
	.execSync("git tag", { encoding: "utf8" })
	.trim()}-${child_process
	.execSync('git log --oneline -n 1 --format="%h"', { encoding: "utf8" })
	.trim()}`;

const cmdApi = require("./cmd");
const battleManager = require("./api/battle");
const dataManager = require("./api/data");
new Promise(async function (resolve, reject) {
	var parseConfig = function () {
		return new Promise(async function (resolve, reject) {
			try {
				var configFile = await yaml.parse(
					fs.readFileSync(`${__dirname}/config.yml`, "utf-8")
				);
				resolve(configFile);
			} catch (err) {
				reject(new Error(`Failed to parse config file: ${err.stack}`));
			}
		});
	};
	var parseLang = function (configFile) {
		return new Promise(function (resolve, reject) {
			try {
				var lang = configFile.server.lang;
				var langFile = yaml.parse(
					fs.readFileSync(`${__dirname}/lang.yml`, "utf-8")
				);
				if (lang in langFile) {
					resolve(langFile[configFile.server.lang]);
				} else {
					reject(new Error(`Invalid language: ${lang}`));
				}
			} catch (err) {
				reject(
					new Error(`Failed to parse language file: ${err.stack}`)
				);
			}
		});
	};
	try {
		var configFile = await parseConfig();
		var langFile = await parseLang(configFile);
		resolve([configFile, langFile]);
	} catch (err) {
		reject(err);
	}
})
	.then((files) => {
		global.config = files[0];
		global.lang = files[1];

		app.use(express.json());
		app.use(function (err, next) {
			error(err.message);
			next(err);
		});

		app.use("./api/battle", battleManager);
		app.use("./api/data", dataManager);

		app.listen(config.server.port, config.server.host, async () => {
			console.info(
				chalk.bold.blueBright(lang.server.motd.render(version))
			);
			info(
				lang.server.serverStart.render(
					config.server.host,
					config.server.port
				)
			);
			cmdLoop();
		});
	})
	.catch((err) => {
		error(lang.mainLoopError.render(err));
	});
