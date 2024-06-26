/**
 * @file utils.js 一些实用函数
 * @author 延时qwq <yanshiqwq@126.com>
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
		 * @function init 将所有的utils函数公开为全局函数
		 * @since v1.3.1
		 * @descript 只有主脚本运行时才会用得到
		 * @example utils.console.init();
		 */
		init: function(logLevel){
			for(var value in utils){
				if(value != "console"){
					global[value] = utils[value];
				}
			}
			var logGroup = ["debug", "log", "info", "warn", "error", "fatal"];
			global.logLevel = logGroup.indexOf(logLevel);
			// console.log(`logLevel="${logLevel}", global.logLevel="${global.logLevel}"`);
		},
		/**
		 * @function fatal 严重错误
		 * @since v1.1
		 * @param {any} log - 要显示的内容
		 * @param {bool} hideTime - 是否隐藏时间
		 * @param {string} cws - 获取运行此函数脚本的名称(Current Working Script)
		 * @descript 可以搭配 @see emptyLine 使用
		 * @example fatal("qwq", false, "server.js");
		 */
		fatal: function(log, hideTime, cws){
			if(global.logLevel <= 5 || !global.logLevel){
				console.error(chalk.bold.red(hideTime ? log : `${utils.getTime()} [${cws}] [F] ${log}`));
			}
		},
		/**
		 * @function error 错误
		 * @see fatal
		 */
		error: function(log, hideTime, cws){
			if(global.logLevel <= 4 || !global.logLevel){
				console.error(chalk.bold.red(hideTime ? log : `${utils.getTime()} [${cws}] [E] ${log}`));
			}
		},
		/**
		 * @function warn 警告
		 * @see fatal
		 */
		warn: function(log, hideTime, cws){
			if(global.logLevel <= 3 || !global.logLevel){
				console.warn(chalk.bold.yellow(hideTime ? log : `${utils.getTime()} [${cws}] [W] ${log}`));
			}
		},
		/**
		 * @function log 日志
		 * @see fatal
		 */
		log: function(log, hideTime, cws){
			if(global.logLevel <= 2 || !global.logLevel){
				console.log(chalk.bold.cyan(hideTime ? log : `${utils.getTime()} [${cws}] [L] ${log}`));
			}
		},
		/**
		 * @function info 信息
		 * @see fatal
		 */
		info: function(log, hideTime, cws){
			if(global.logLevel <= 1 || !global.logLevel){
				console.info(chalk.bold.greenBright(hideTime ? log : `${utils.getTime()} [${cws}] [I] ${log}`));
			}
		},
		/**
		 * @function debug 调试
		 * @see fatal
		 */
		debug: function(log, hideTime, cws){
			if(global.logLevel <= 0){
				console.debug(chalk.bold.grey(hideTime ? "" : `${utils.getTime()} [${cws}] [D] ${log}`));
			}
		},
		/**
		 * @function setup 初始化
		 * @descript 每个脚本都需eval执行此字符串函数以初始化utils
		 * @example eval(utils.console.setup);
		 * 
		 * @function String.prototype.render 渲染
		 * @descript 将变量载入字符串
		 * @example info(lang.server.serverRunningAt.render(config.server.host, config.server.port));
		 */
		setup: `
			var types = ["debug", "log", "info", "warn", "error", "fatal"];
			String.prototype.render = function(...args){
				return require("util").format(this.toString(), ...args);
			}
			for(var type in types){
				var scriptName = require("path").basename(__filename);
				eval(\`
					function \${types[type]}(log, hideTime){
						var line = new Error().stack.split(":")[7];
						utils.console.\${types[type]}(log, hideTime, '\${scriptName}:' + line);
					}
				\`)
			}
		`
	},
	/**
	 * @instance rl readline模块初始化
	 * @since v1.1
	 * @descript 可以通过rl调用readline
	 * @example rl.prompt();
	 */
	rl: readline.createInterface({
		input: process.stdin,
		output: process.stdout
	}),
	/**
	 * @function getCookie 获取cookie
	 * @since v1.3
	 * @deprecated v1.3
	 * @param {object} req - express的req对象
	 * @returns {list} cookie列表
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
	 * @function emptyLine 清空当前行
	 * @since v1.1
	 * @descript 一般会搭配输出命令使用
	 * @param {Bool} hidePrompt - 是否隐藏命令提示符
	 * 
	 * @callback callback
	 * @function callback 清空行执行的回调函数
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
	 * @function timeStamp 获取时间戳
	 * @since v1.1
	 * @example console.log(timeStamp());
	 * @returns {string} 时间戳
	 */
	timeStamp: function(){
		return new Date().getTime();
	},
	/**
	 * @function getTime 获取时间
	 * @since v1.0
	 * @example console.log(guid());
	 * @returns {string} 时间
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
	 * @function randStr 生成随机字符串
	 * @since v1.4
	 * @param {number} length - 字符串长度
	 * @param {string} chars - 字符列表
	 * @returns {string} 生成的随机字符串
	 */
	randStr: function(length, chars){
		var result = '';
		for(var i = length; i > 0; --i){
			result += chars[Math.floor(Math.random() * chars.length)];
		}
		return result;
	},
	/**
	 * @function getPromise 将request模块的get promise化
	 * @since v1.4
	 * @see request.get
	 * @returns {Promise} get请求返回值
	 */
	getPromise: util.promisify(request.get),
	/**
	 * @function testUrl 检测字符串是否为Url链接
	 * @since v1.3.1
	 * @param {string} url 
	 * @returns {bool} 是否为Url
	 */
	testUrl: function(url){
		return new RegExp(/^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$/).test(url);
	},
	/**
	 * @function exit 执行函数并退出
	 * @since v1.4.1
	 * @param {callback} func 清空行后需要执行的函数
	 * @param {Number} code 程序返回值
	 */
	exit: async function(func, code){
		await this.emptyLine(func, true);
		setTimeout(() => {process.exit(code || 1)});
	}
}
// 公开所有函数
for(var value in utils){
	exports[value] = utils[value];
}