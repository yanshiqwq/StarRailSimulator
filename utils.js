/**
 * @file utils.js һЩʵ�ú���
 * @author ��ʱqwq <yanshiqwq@126.com>
 * @version v1.4.1
 */

const readline = require('readline');
const request = require('request');
const chalk = require('chalk');
const util = require('util');
const utils = {
	rlsync: {
		moveCursor: function(pos){
			readline.clearLine(process.stdout, pos);
			readline.moveCursor(process.stdout, pos, 0);
		},
		question: function(){
			return new Promise(function(resolve){
				rl.question(config.server.prompt, function(input){
					resolve(input);
				});
			});
		}
	},
	console: {
		/**
		 * @function global �����е�utils��������Ϊȫ�ֺ���
		 * @since v1.3.1
		 * @descript ֻ�г�������ʱ�Ż��õõ�
		 * @example utils.console.global();
		 */
		global: function(){
			for(var value in utils){
				if(value != "console"){
					global[value] = utils[value];
				}
			}
			var logGroup = ["debug", "log", "info", "warn", "error", "fatal"];
			global.logLevel = logGroup.indexOf(global.logLevel);
		},
		/**
		 * @function fatal ���ش���
		 * @since v1.1
		 * @param {any} log - Ҫ��ʾ������
		 * @param {bool} hideTime - �Ƿ�����ʱ��
		 * @param {string} cws - ��ȡ���д˺����ű�������(Current Working Script)
		 * @descript ���Դ��� @see emptyLine ʹ��
		 * @example fatal("qwq", false, "server.js");
		 */
		fatal: function(log, hideTime, cws){
			if(global.logLevel <= 5 || !global.logLevel){
				console.error(chalk.bold.red(hideTime ? log : `${utils.getTime()} [${cws}] [F] ${log}`));
			}
		},
		/**
		 * @function error ����
		 * @see fatal
		 */
		error: function(log, hideTime, cws){
			if(global.logLevel <= 4 || !global.logLevel){
				console.error(chalk.bold.red(hideTime ? log : `${utils.getTime()} [${cws}] [E] ${log}`));
			}
		},
		/**
		 * @function warn ����
		 * @see fatal
		 */
		warn: function(log, hideTime, cws){
			if(global.logLevel <= 3 || !global.logLevel){
				console.warn(chalk.bold.yellow(hideTime ? log : `${utils.getTime()} [${cws}] [W] ${log}`));
			}
		},
		/**
		 * @function log ��־
		 * @see fatal
		 */
		log: function(log, hideTime, cws){
			if(global.logLevel <= 2 || !global.logLevel){
				console.log(chalk.bold.cyan(hideTime ? log : `${utils.getTime()} [${cws}] [L] ${log}`));
			}
		},
		/**
		 * @function info ��Ϣ
		 * @see fatal
		 */
		info: function(log, hideTime, cws){
			if(global.logLevel <= 1 || !global.logLevel){
				console.info(chalk.bold.greenBright(hideTime ? log : `${utils.getTime()} [${cws}] [I] ${log}`));
			}
		},
		/**
		 * @function debug ����
		 * @see fatal
		 */
		debug: function(log, hideTime, cws){
			if(global.logLevel <= 0){
				console.debug(chalk.bold.grey(hideTime ? "" : `${utils.getTime()} [${cws}] [D] ${log}`));
			}
		},
		/**
		 * @function setup ��ʼ��
		 * @descript ÿ���ű�����evalִ�д��ַ��������Գ�ʼ��utils
		 * @example eval(utils.console.setup);
		 * 
		 * @function String.prototype.render ��Ⱦ
		 * @descript �����������ַ���
		 * @example info(lang.server.serverRunningAt.render(config.server.host, config.server.port));
		 */
		setup: `
			var types = ["debug", "log", "info", "warn", "error", "fatal"];
			String.prototype.render = function(...args){
				return require("util").format(this.toString(), ...args);
			}
			for(var type in types){
				eval(\`
					function \${types[type]}(log, hideTime){
						utils.console.\${types[type]}(log, hideTime, '\${require("path").basename(__filename)}:' + new Error().stack.split(":")[7]);
					}
				\`)
			}
		`
	},
	/**
	 * @instance rl readlineģ���ʼ��
	 * @since v1.1
	 * @descript ����ͨ��rl����readline
	 * @example rl.prompt();
	 */
	rl: readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	/**
	 * @function getCookie ��ȡcookie
	 * @since v1.3
	 * @deprecated v1.3
	 * @param {object} req - express��req����
	 * @returns {list} cookie�б�
	 */
	getCookie: function(req){
		var cookies = {};
		req.headers.cookie && req.headers.cookie.split(';').forEach(function(cookie){
			var parts = cookie.split('=');
			cookies[parts[0].trim()] = (parts[1] || '').trim();
		});
		return cookies;
	},
	/**
	 * @function emptyLine ��յ�ǰ��
	 * @since v1.1
	 * @descript һ�������������ʹ��
	 * @param {Bool} hidePrompt - �Ƿ�����������ʾ��
	 * 
	 * @callback callback
	 * @function callback �����ִ�еĻص�����
	 */
	emptyLine: (hidePrompt) => {return new Promise(async function(resolve, reject) {
		readline.clearLine(process.stdout, 0, function(){
			readline.cursorTo(process.stdout, 0, function(){
				if(!hidePrompt){
					this.rl.prompt();
				}
			});
			resolve();
		});
	})},
	/**
	 * @function timeStamp ��ȡʱ���
	 * @since v1.1
	 * @example console.log(timeStamp());
	 * @returns {string} ʱ���
	 */
	timeStamp: function(){
		return new Date().getTime();
	},
	/**
	 * @function getTime ��ȡʱ��
	 * @since v1.0
	 * @example console.log(guid());
	 * @returns {string} ʱ��
	 */
	getTime: function(){
		var date = new Date();
		var hours = date.getHours();
		var minutes = date.getMinutes();
		var seconds = date.getSeconds();
		if (hours < 10) {
			var hours = "0" + hours;
		}
		if (minutes < 10) {
			var minutes = "0" + minutes;
		}
		if (seconds < 10) {
			var seconds = "0" + seconds;
		}
		return `[${hours}:${minutes}:${seconds}]`;
	},
	/**
	 * @function randStr ��������ַ���
	 * @since v1.4
	 * @param {number} length - �ַ�������
	 * @param {string} chars - �ַ��б�
	 * @returns {string} ���ɵ�����ַ���
	 */
	randStr: function(length, chars){
		var result = '';
		for(var i = length; i > 0; --i){
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	},
	/**
	 * @function getPromise ��requestģ���get promise��
	 * @since v1.4
	 * @see request.get
	 * @returns {Promise} get���󷵻�ֵ
	 */
	getPromise: util.promisify(request.get),
	/**
	 * @function testUrl ����ַ����Ƿ�ΪUrl����
	 * @since v1.3.1
	 * @param {string} url 
	 * @returns {bool} �Ƿ�ΪUrl
	 */
	testUrl: function(url){
		return new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/).test(url);
	},
	/**
	 * @function exit ִ�к������˳�
	 * @since v1.4.1
	 * @param {callback} func ����к���Ҫִ�еĺ���
	 * @param {Number} code ���򷵻�ֵ
	 */
	exit: async function(func, code){
		await this.emptyLine(func, true);
		setTimeout(() => {process.exit(code || 1)});
	}
}
// �������к���
for(var value in utils){
	exports[value] = utils[value];
}