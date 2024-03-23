const utils = require('./utils');
eval(utils.console.setup);

const cmd_api = {
	'stop': function(){
		exit(emptyLine(info(lang.server.serverStop)).then())
	}
}
module.exports = cmd_api;