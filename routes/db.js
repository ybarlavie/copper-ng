var MongoClient = require('mongodb');
var express = require('express');

const uri = "mongodb://root:AYNIL#$%678liayn@blcloud.ddns.net:27017";
//const uri = "mongodb://localhost:27017";

var router = express.Router();

router.get('/:collection', function (req, res) {
    console.log(req.params.collection + ' sync');

    MongoClient.connect(uri, function(err, client) {
        if(err) { return console.dir(err); }

        var db = client.db('copper-db');

        var collection = db.collection(req.params.collection);
        var filter = {};
        filter[req.query.qv] = new RegExp(req.query.qe, 'i');

        collection.find(filter).toArray(function(err, items) {
            return res.status(200).send(items);
        });

        client.close();
    });
});

module.exports = router;