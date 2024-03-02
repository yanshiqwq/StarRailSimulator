const jsonschema = require('jsonschema')
const JSON = require('json');
const UUID = require('uuid');

var battleList = []
const battleSchema = {
    normal: {
        enemy_group: {type: String, required: true},
        buff: {
            type: Array,
            items: {
                id: {type: String},
                value: {type: Number}
            },
            default: []
        }
    },
    chaos: {
        id: {type: Number, required: true, minimum: 100},
        floor: {type: Number, required: true, minimum: 0},
        side: {type: Boolean, required: true} // false=上半, true=下半
    },
    fiction: {
        id: {type: Number, required: true, minimum: 2001},
        floor: {type: Number, required: true, minimum: 0},
        side: {type: Boolean, required: true}, // false=上半, true=下半
        buff: {type: Number, required: true, minimum: 0, maximum: 2}
    }
}
module.exports = function(app, db) {
    app.post('/battle/create', (req, res) => {
        req_json = JSON.parse(req.body);
        switch (req_json.scene) {
            case 'normal':
                if (req.json.chaos_id) {}
                res_json.push(
                    chaos_id = req_json.chaos_id,
                    floor = req_json.floor,
                    select = req_json.select
                );
                res.send(201) // Created
        }
        battles.push()
    });
};