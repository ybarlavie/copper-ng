var express = require('express');
var MongoDB = require('../mongoUtils');
var Auth = require('../authUtils');

var router = express.Router();

router.get('/:collection', function (req, resp) {
    let filter = {};
    let projection = {};

    if (req.query.q) {
        try {
            q = JSON.parse(req.query.q);
            filter[q.qv] = new RegExp(q.qe, 'i');
        } catch {
            return res.status(400).end();
        }

        if (q.prj) {
            projection = { projection: q.prj };
        }
    }

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB
        .getDB()
        .collection(req.params.collection)
        .find(filter, projection).toArray(function(err1, items) {
            if (err1) {
                console.log(req.params.collection + " had error: " + JSON.stringify(err1));
                return resp.status(500).send(err1);
            }
            console.log(req.params.collection + " returning " + items.length + " items.");
            return resp.status(200).send(items);
        });
    });
});

router.post('/:collection', async (req, resp, next) => {
    var collName = req.params.collection;
    var doc = req.body;
    var _id = doc.hasOwnProperty('_id') ? doc['_id'] : null;
    var dbFunc = MongoDB.insert;

    if (_id) {
        var docExists = await MongoDB.docExists(collName, _id);
        if (docExists) {
            dbFunc = MongoDB.update;
        }
    }

    var who = Auth.getEmailByRequest(req);
    doc['_who'] = who || 'n/a';
    doc['_when'] = Date.now();

    dbFunc(collName, doc)
    .then(id => {
        return resp.status(200).send(id);
    }, reason => {
        return resp.status(500).send(reason);
    });
});

module.exports = router;