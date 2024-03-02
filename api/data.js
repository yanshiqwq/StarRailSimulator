const utils = require('../utils');
eval(utils.console.setup);
utils.console.global();

module.exports = function(app) {
    app.post('/data/enemy_group/create', (req, res) => {
        var req_json = res.json(req.body);
        var level = req_json.level;
        var round = req_json.round;
        var enemy = req_json.enemy;
        group_id = utils.guid();
        // TODO: 存入数据库
        res.json({
            "code": 200,
            "enemy_group_id": group_id
        });
    });
    app.get('/data/enemy_group/:group_id', (req, res) => {
        group_id = utils.guid();
        // TODO: 读取数据库
        res.json({
            "code": 200,
            //...
        });
    });
};