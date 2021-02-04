var express = require('express');
var MongoDB = require('../mongoUtils');
var Auth = require('../authUtils');
const ObjectID = require('mongodb').ObjectID;

var router = express.Router();

const _getMatchExpr = (req, filter) => {
    let role = Auth.getRole(req);
    var q0 = { _exclude: { $ne: role } };
    var q1 = { $or: [
        { _include: { $exists: false } },
        { _include: role }
    ]}; 

    if (filter) {
        if (Array.isArray(filter)) {
            return { $and: [q0, q1].concat(filter) };
        } else {
            return { $and: [q0, q1, filter] };
        }
    } else {
        return { $and: [q0, q1] };
    }
}

const _getStoreData = (req, resp) => {
    var result = {};
    result.item_types = { 
        D: { coll: "documents", s_heb: "תעודת ב.כ.", p_heb: "תעודות ב.כ.", gender: "female" },
        E: { type: "ext_documents", s_heb: "תעודה חיצונית", p_heb: "תעודות חיצוניות", gender: "female"},
        P: { type: "persons", s_heb: "דמות", p_heb: "דמויות", gender: "female"},
        L: { type: "locations", s_heb: "מיקום", p_heb: "מיקומים", gender: "male"},
    };

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB.getDB()
        .collection('keywords')
        .find({})
        .toArray(function(err0, items0) {
            if (err0) {
                return resp.status(500).send(err0);
            }
            result.keywords = items0;

            MongoDB.getDB()
            .collection('ref_types')
            .find({})
            .toArray(function(err1, items1) {
                if (err1) {
                    return resp.status(500).send(err0);
                }

                result.ref_types = items1;

                return resp.status(200).send(result);
            });    
        });
    });
}

router.post('/byIds/:collection', async (req, resp, next) => {
    var collName = req.params.collection;
    var ids = req.body;
    var q1 = collName == 'references' ? { ref_id: { $in: ids } } : { item_id: { $in: ids } };
    var match = _getMatchExpr(req, q1);

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB.getDB()
        .collection(req.params.collection)
        .aggregate([ { $match: match } ])
        .toArray(function(err1, items) {
            if (err1) {
                console.log(req.params.collection + " had error: " + JSON.stringify(err1));
                return resp.status(500).send(err1);
            }
            console.log(req.params.collection + " returning " + items.length + " items.");
            return resp.status(200).send(items);
        });
    });
});



router.get('/:collection', function (req, resp) {
    let aggArray = [];

    if (req.params.collection == 'store_data')
    {
        return _getStoreData(req, resp);
    }

    var q1 = null;
    if (req.query.q) {
        try {
            q = JSON.parse(req.query.q);
            q1 = {};
            q1[q.qv] = new RegExp('\\b' + q.qe + '\\b', 'i');
        } catch {
            return res.status(400).end();
        }

        if (q.prj) {
            aggArray.push({ $project: q.prj });
        }
    }

    var match = _getMatchExpr(req, q1);
    aggArray.push({ $match: match });

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB
        .getDB()
        .collection(req.params.collection)
        .aggregate( aggArray )
        .toArray(function(err1, items) {
            if (err1) {
                console.log(req.params.collection + " had error: " + JSON.stringify(err1));
                return resp.status(500).send(err1);
            }
            console.log(req.params.collection + " returning " + items.length + " items.");
            return resp.status(200).send(items);
        });
    });
});

router.delete('/:collection', async (req, resp, next) => {
    var collName = req.params.collection;
    var doc = req.body;
    var filter = {};
    if (collName == 'references') {
        filter['ref_id'] = doc.ref_id;
    } else {
        filter['item_id'] = doc.item_id;
    }

    MongoDB.remove(collName, filter)
    .then(result => {
        return resp.status(200).send(result);
    }, reason => {
        return resp.status(500).send(reason);
    });
});


router.post('/:collection', async (req, resp, next) => {
    var collName = req.params.collection;
    var doc = req.body;
    var origDoc = null;
    var role = Auth.getRole(req);
    var _id = doc.hasOwnProperty('_id') ? doc['_id'] : null;
    var dbFunc = MongoDB.insert;

    if (_id) {
        origDoc = await MongoDB.firstOrDefault(collName, { _id: ObjectID(_id)} );
        if (origDoc) {
            if (origDoc._restricts && origDoc._restricts.includes(role)) {
                return resp.status(403).send('unauthorized');
            }
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

router.put('/updateFields/:collection/:id', async (req, resp, next) => {
    var filter = {};
    var collName = req.params.collection;
    var docId = req.params.id;

    var docIdName = 'item_id';
    if (collName == 'references') {
        docIdName = 'ref_id';
        filter[docIdName] = docId;
    } else {
        filter[docIdName] = docId;
    }

    var fv = req.body;

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB.getDB().collection(collName)
        .find(filter, {}).toArray((err1, items) => {
            if (err1) return resp.status(500).send(err1);
            if (items.length <=0) return resp.status(500).send('no document to update');
            var item = items[0];
            for (k in fv) {
                if (k != '_id' && k != docIdName && item.hasOwnProperty(k)) {
                    item[k] = fv[k];
                }
            }

            MongoDB.disconnectDB();
            MongoDB.update(collName, item)
            .then(id => {
                return resp.status(200).send(id);
            }, reason => {
                return resp.status(500).send(reason);
            });
        });
    });
});

module.exports = router;