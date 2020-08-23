var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var MongoDB = require('../mongoUtils');
const { json } = require('body-parser');

const router = express.Router();

const searches = [
    { coll: 'documents', fields: [ 'title', 'text', 'keywords' ], prj: { sug: 'מסמך בר כוכבא', item_id: '$doc_id', name: 1, title: 1, keywords: 1 } },
    { coll: 'ext_documents', fields: [ 'title', 'text', 'keywords' ], prj: { sug: 'מסמך חיצוני', item_id: '$edoc_id', name: 1, title: 1, keywords: 1 } },
    { coll: 'locations', fields: [ 'title', 'keywords' ], prj: { sug: 'מיקום', item_id: '$loc_id', name: 1, title: 1, keywords: 1 } },
    { coll: 'persons', fields: [ 'title', 'name', 'aliases', 'keywords'], prj: { sug: 'דמות', item_id: '$prsn_id', name: 1, title: 1, keywords: 1 } }
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

router.get('/refs/:fromId', function (req, resp){
    console.log('refs of searh for "' + req.params.fromId +'"');

    const limit = req.params.limit<=500 ? parseInt(req.params.limit) : 5;

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connet to DB");

        let proms = [];

        MongoDB.getDB()
        .collection("references")
        .aggregate( [ 
            { $match: { from: req.params.fromId } }
        ])
        .limit(limit)
        .toArray((err, refs) => {
            if (err) return resp.status(500).send("cannot query references");
    
            refs.forEach(ref => {
                var q0 = null;
                var re = new RegExp("\\b" +  ref.to + "\\b", 'i' );
                var prj = { ref_id: ref.ref_id, type: ref.type, description: ref.description, start: ref.start, end: ref.end, name: 1 };
                switch (ref.to.substring(0,1)) {
                    case "D":
                        prj.sug = "מסמך בר כוכבא";
                        prj.item_id = "$doc_id";
                        q0 = { coll: 'documents', fltr: { doc_id: re }, prj: prj };
                        break;
                    case "E":
                        prj.sug = "מסמך חיצוני";
                        prj.item_id = "$edoc_id";
                        q0 = { coll: 'ext_documents', fltr: { edoc_id: re }, prj: prj };
                        break;
                    case "P":
                        prj.sug = "דמות";
                        prj.item_id = "$prsn_id";
                        q0 = { coll: 'persons', fltr: { prsn_id: re }, prj: prj };
                        break;
                    case "L":
                        prj.sug = "מיקום";
                        prj.item_id = "$loc_id";
                        q0 = { coll: 'locations', fltr: { loc_id: re }, prj: prj };
                        break;
                }
                if (q0) {
                    proms.push(
                        new Promise((resolve, reject) => {    
                            MongoDB.getDB()
                            .collection(q0.coll)
                            .aggregate( [ { $match: q0.fltr }, { $project: q0.prj } ] )
                            .toArray(function(err1, items) {
                                err1 ? reject(err1) : resolve(items);
                            });
                        })
                    );    
                }
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
});

router.get('/by_word/:id/:limit/:word', function (req, resp) {
    console.log('by_word: exclude id:' + req.params.id + ' searh for "' + req.params.word +'"');

    const limit = req.params.limit<=500 ? parseInt(req.params.limit) : 5;
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