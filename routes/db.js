var MongoClient = require('mongodb');
var express = require('express');

const uri = "mongodb://root:" + encodeURIComponent('AYNIL#$%678liayn') + "@blcloud.ddns.net:27017";

var router = express.Router();

router.get('/:collection', function (req, res) {
    console.log(req.params.collection + ' get');

    MongoClient.connect(uri, function(err, client) {
        if(err) { return console.dir(err); }

        var db = client.db('copper-db');

        var collection = db.collection(req.params.collection);
        var filter = {};
        var projection = {};
        var findOne = false;

        if (req.query.q) {
            try {
                q = JSON.parse(req.query.q);
                filter[q.qv] = new RegExp(q.qe, 'i');
            } catch {
                return res.status(404).end();
            }

            if (q.prj) {
                projection = { projection: q.prj };
            }
        }

        collection.find(filter, projection).toArray(function(err, items) {
            return res.status(200).send(items);
        });

        client.close();
    });
});

module.exports = router;