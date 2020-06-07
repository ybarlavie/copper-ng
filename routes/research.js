var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var MongoDB = require('../mongoUtils');

const router = express.Router();

const searches = [
    { coll: 'documents', fields: [ 'text', 'keywords' ], prj: { sug: 'מסמך בר כוכבא', item_id: '$doc_id', name: 1, title: 1, keywords: 1 } },
    { coll: 'ext_documents', fields: [ 'text', 'keywords' ], prj: { sug: 'מסמך חיצוני', item_id: '$edoc_id', name: 1, title: 1, keywords: 1 } },
    { coll: 'locations', fields: [ 'keywords' ], prj: { sug: 'מיקום', item_id: '$loc_id', name: 1, title: 1, keywords: 1 } },
    { coll: 'persons', fields: [ 'name', 'aliases', 'keywords'], prj: { sug: 'דמות', item_id: '$prsn_id', name: 1, title: 1, keywords: 1 } }
];

const _regexBuilder = ((word) => {
    return new RegExp(word, 'im');
});

const _queryBuilder = ((exclude_id, fields, re) => {
    var q0 = {};

    if (fields.length > 1) {
        var aq = [];
        fields.forEach(f => {
            var fo = {}; fo[f] = re;
            aq.push(fo);
        });
        q0['$or'] = aq;
    } else {
        q0[fields[0]] = re;
    }

    if (exclude_id) {
        var aq = [];
        aq.push({ _id: { $ne: exclude_id }});
        aq.push(q0);
        return {'$and': aq};
    } else {
        return q0;
    }
});

router.get('/by_word/:id/:limit/:word', function (req, resp) {
    console.log('by_word: exclude id:' + req.params.id + ' searh for "' + req.params.word +'"');

    const limit = req.params.limit<100 ? parseInt(req.params.limit) : 5;
    const re = _regexBuilder(req.params.word);

    exclude_id = null;
    try {
        exclude_id = ObjectID(req.params.id);
    } catch {
        exclude_id = null;
    }

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connet to DB");

        let proms = [];
        searches.forEach(s => {
            proms.push(
                new Promise((resolve, reject) => {
                    MongoDB.getDB()
                    .collection(s.coll)
                    .aggregate( [ { $match: _queryBuilder(exclude_id, s.fields, re) }, { $project: s.prj } ] )
                    .limit(limit)
                    .toArray((err, data) => {
                        err ? reject(err) : resolve(data);
                    })
                })
            );
        });

        let items = [];
        Promise.all(proms).then(values => {
            values.forEach(v => {
                items.push(...v);
            });

            MongoDB.disconnectDB();
            return resp.status(200).send(items);
        });
    });
});

module.exports = router;