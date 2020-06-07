var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var MongoDB = require('../mongoUtils');

var router = express.Router();

router.get('/:collection', function (req, resp) {
    console.log(req.params.collection + ' get');

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
        if (err) return resp.status(500).send("cannot connet to DB");

        const collection = MongoDB.getDB().collection(req.params.collection);

        collection.find(filter, projection).toArray(function(err, items) {
            MongoDB.disconnectDB();
            return resp.status(200).send(items);
        });
    });
});

router.post('/:collection', async (req, resp, next) => {
    var collName = req.params.collection;
    var newDoc = req.body;

    if (newDoc.hasOwnProperty('_id')) delete newDoc['_id'];
    
    MongoDB.getNextId(collName, newDoc)
    .then(([nextId, id_col]) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) return resp.status(500).send("cannot connet to DB");

            newDoc[id_col] = nextId;

            MongoDB.getDB()
            .collection(collName)
            .insertOne(newDoc, function(err1, res1) {
                MongoDB.disconnectDB();

                if (err1) return resp.status(500).send("failed insert: " + JSON.stringify(newDoc));

                MongoDB.incrementNext(collName)
                .then(newTadmin => {
                    return resp.status(200).send(res1.insertedId);
                }, reason => {
                    return resp.status(500).send("failed increment for " + collName);
                });
            })
        });
    }, reason => {
        return resp.status(500).send("failed get nextId for " + collName);
    });
});

module.exports = router;