const utils = require('../utils');
eval(utils.console.setup);

module.exports = function(app) {
    app.post('/data/stage/create', (req, res) => {
        var req_json = res.json(req.body);
        var level = req_json.level;
        var round = req_json.round;
        var enemy = req_json.enemy;
        group_id = utils.guid();
        // TODO: 存入数据库
        res.json({
            "code": 200,
            "stage_id": group_id
        });
    });
    app.get('/data/stage/:stage_id', (req, res) => {
        group_id = utils.guid();
        // TODO: 读取数据库
        res.json({
            "code": 200,
            //...
        });
    });
};