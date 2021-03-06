var express = require('express');
var ObjectID = require('mongodb').ObjectID;
var Auth = require('../authUtils');
var MongoDB = require('../mongoUtils');
const { json } = require('body-parser');

const router = express.Router();

const searches = [
    { coll: 'documents', fields: [ 'title', 'text', 'keywords' ], prj: { sug: 'מסמך בר כוכבא', item_id: 1, name: 1, title: 1, keywords: 1 } },
    { coll: 'ext_documents', fields: [ 'title', 'text', 'keywords' ], prj: { sug: 'מסמך חיצוני', item_id: 1, name: 1, title: 1, keywords: 1 } },
    { coll: 'locations', fields: [ 'title', 'keywords' ], prj: { sug: 'מיקום', item_id: 1, name: 1, title: 1, keywords: 1, lat: 1, lng: 1 } },
    { coll: 'persons', fields: [ 'title', 'name', 'aliases', 'keywords'], prj: { sug: 'דמות', item_id: 1, name: 1, title: 1, keywords: 1 } }
];

const _regexBuilder = ((str, wholeWord, ignoreSquare) => {
    var expr = '';
    if (ignoreSquare) {
        for (var i=0; i<str.length; i++) {
            expr += ('' + str.charAt(i) + '[\\[\\]]?');
        }
    } else {
        expr += str;
    }
    expr += wholeWord ? '\\s' : '';
    return new RegExp(expr, 'im');
});

const _inTextRegExp = ((text) => {
    var fld = { $reduce : { input: '$aliases', initialValue: '$name', in: { $concat: ['$$value', {'$cond': [{'$eq': ['$$value', '']}, '', '|']}, '$$this' ] } } };
    return { $expr: { $regexMatch: { input: text, regex: { $concat: [ '\\s[ו|ב|מ|ל]*', fld, '[\,|\.|\-]*\\s' ] } } } };
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

const _by_word_options = (req) => {
    var opts = JSON.parse(req.params.json);
    var lim = req.params.limit;
    var id = req.params.id;

    return new Promise((resolve, reject) => {
        const limit = lim<=500 ? parseInt(lim) : 5;
    
        exclude_id = null;
        try {
            exclude_id = ObjectID(id);
        } catch {
            exclude_id = null;
        }
    
        var collOpts = JSON.parse(JSON.stringify(searches));
        var wholeWord = false;
        var ignoreSquare = false;
        var flds = [];
    
        if (opts.filterOptions && opts.filterOptions.length > 0) {
            // we have options... clear collOpts
            collOpts = [];
    
            // first pass: expression and fields
            opts.filterOptions.forEach(o => {
                switch (o) {
                    case 'wholeWord':
                        wholeWord = true;
                        break;
                    case 'ignoreSquare':
                        ignoreSquare = true;
                        break;
                    case 'useName':
                        flds.push('name');
                        break;
                    case 'useLabel':
                        flds.push('label');
                        break;
                    case 'useTitle':
                        flds.push('title');
                        break;
                    case 'useKeywords':
                        flds.push('keywords');
                        break;
                    case 'useAliases':
                        flds.push('aliases');
                        break;
                    case 'useText':
                        flds.push('text');
                        break;
                }
            });
        
            // second pass: collections
            opts.filterOptions.forEach(o => {
                switch (o) {
                    case 'useDocuments':
                        collOpts.push({ coll: 'documents', fields: flds, prj: { collection: 'documents', sug: 'מסמך בר כוכבא', item_id: 1, name: 1, title: 1, keywords: 1 } });
                        break;
                    case 'useExtDocuments':
                        collOpts.push({ coll: 'ext_documents', fields: flds, prj: { collection: 'ext_documents', sug: 'מסמך חיצוני', item_id: 1, name: 1, title: 1, keywords: 1 } });
                        break;
                    case 'useLocations':
                        collOpts.push({ coll: 'locations', fields: flds, prj: { collection: 'locations', sug: 'מיקום', item_id: 1, name: 1, title: 1, keywords: 1, lat: 1, lng: 1 } });
                        break;
                    case 'usePersons':
                        collOpts.push({ coll: 'persons', fields: flds, prj: { collection: 'persons', sug: 'דמות', item_id: 1, name: 1, title: 1, keywords: 1 } })
                        break;
                }
            });
        }
    
        const re = _regexBuilder(opts.query, wholeWord, ignoreSquare);
    
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject("cannot connet to DB");
    
            let proms = [];
            collOpts.forEach(s => {
                var q1 = _queryBuilder(exclude_id, s.fields, re);
                var match = Auth.getMatchExprByRole(req, q1);
                proms.push(
                    new Promise((resolve, reject) => {
                        MongoDB.getDB()
                        .collection(s.coll)
                        .aggregate( [ { $match: match }, { $project: s.prj } ] )
                        .limit(limit)
                        .toArray((err, data) => {
                            err ? reject(err) : resolve(data);
                        })
                    })
                );
            });
    
            let items = [];
            let item_ids = [];
            Promise.all(proms).then(values => {
                values.forEach(v => {
                    items.push(...v);
                    if (opts.extractRefs) {
                        item_ids.push(...v.map(({item_id}) => item_id));
                    }
                });

                if (opts.extractRefs)
                {
                    var q1 = { $or: [ { from: { $in: item_ids } }, { to: { $in: item_ids } } ] };
                    var match = Auth.getMatchExprByRole(req, q1);
                    var prj = { _id: 0, from: 1, to: 1, type: 1, description: 1, ref_id: 1, _valid: 1 };
                    MongoDB.getDB()
                    .collection('references')
                    .aggregate( [ { $match: match }, { $project: prj } ] )
                    .toArray((err, refs) => {
                        if (err) return resp.status(500).send("cannot query references");
                        if (!refs) return resp.status(500).send("failed querying references");
                
                        refs.forEach(ref => {
                            ref["collection"] = "references";
                            items.push(ref)
                        });
                        MongoDB.disconnectDB();
                        resolve(items);           
                    });
                } else {
                    MongoDB.disconnectDB();
                    resolve(items);    
                }
            });
        });    
    });
}

const _to_refs = (req, docId) => {
    var match = Auth.getMatchExprByRole(req, { to: docId });

    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject(err);
    
            MongoDB.getDB()
            .collection("references")
            .aggregate([ { $match: match } ])
            .toArray((err, items) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(items);
                }
            });
        });    
    });
}

router.get('/text/:docId', async (req, resp) => {
    const limit = 10;
    var text = '';
    var _id = '';
    var docId = req.params.docId;
    var srcDoc = null;
    var srcColl = null;
    var inserted = 0;

    if (req.params.docId.startsWith('D')) {
        srcDoc = await MongoDB.firstOrDefault('documents', {item_id:docId});
        if (!srcDoc) return resp.status(500).send("cannot find document");
        srcColl = "documents";
        text = srcDoc.text;
        _id = srcDoc._id;
    } else if (req.params.docId.startsWith('E')) {
        srcDoc = await MongoDB.firstOrDefault('ext_documents', {item_id:docId});
        if (!srcDoc) return resp.status(500).send("cannot find external document");
        srcColl = "ext_documents";
        text = srcDoc.text;
        _id = srcDoc._id;
    } else {
        return resp.status(500).send("bad doc id");
    }

    if (text && text.trim()) {
        text = ' ' + text.trim().replace(/[\[|\]|\(|\)]+/g,'') + ' ';
    }

    let proms = [];
    var collections = ['persons', 'locations'];
    ['persons', 'locations'].forEach(collName => {
        var prj = { sug: '', item_id: 1, name: 1, title: 1 };
        switch(collName) {
            case 'persons':
                prj.sug = 'דמות';
                break;
            case 'locations':
                prj.sug = 'מיקום';
                break;
        }
        var q1 = _inTextRegExp(text);
        var match = Auth.getMatchExprByRole(req, q1);
        proms.push(
            new Promise((resolve, reject) => {
                MongoDB.connectDB('copper-db', async (err) => {
                    if (err) reject(err);
        
                    MongoDB.getDB()
                    .collection(collName)
                    .aggregate( [ { $match: match }, { $project: prj } ] )
                    .limit(limit)
                    .toArray((err, data) => {
                        err ? reject(err) : resolve(data);
                    })
                })
            })
        );    
    });

    let candidates = [];
    await Promise.all(proms)
    .then(values => {
        values.forEach(v => {
            candidates.push(...v);
        });
    }, reason => {
        return resp.status(500).send(reason);
    });

    var existingRefs = await _to_refs(req, docId).catch(reason => {
        return resp.status(500).send(reject);
    });

    // now create new references
    for (var i=0; i<candidates.length; i++) {
        var can = candidates[i];
        var links = existingRefs.filter(ref => {
            return ref.from == can.item_id;
        });
        if (links.length <= 0) {
            // no matching link exists. we can add the new ref
            var newRef = {
                from: can.item_id,
                to: docId,
                type: 'referred at document',
                created_by: 'automatic',
                description: 'automatic',
                _who: 'automatic',
                _when: Date.now(),
                _valid: 'no'
            };

            await MongoDB.insert('references', newRef)
            .then(id => {
                existingRefs.push(newRef);
                inserted++;
            }, reason => {
                console.log('failed inserting ref: ' + JSON.stringify(reason));
            });
        }
    };

    if (inserted > 0) {
        srcDoc._researchText = "yes";
        await MongoDB.update(srcColl, srcDoc)
        .then(id => {}, reason => {
            console.log('failed updating _searchText on doc: ' + srcDoc.item_id + ' ' + JSON.stringify(reason));
        })
    }

    return resp.status(200).send(existingRefs);
});

router.get('/refs/:fromId', function (req, resp) {
    console.log('refs of searh for "' + req.params.fromId +'"');

    const limit = 500;

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connet to DB");

        let proms = [];
        var q1 = { $or: [ { from: req.params.fromId }, { to: req.params.fromId } ] };
        var match = Auth.getMatchExprByRole(req, q1);

        MongoDB.getDB()
        .collection("references")
        .aggregate( [ { $match: match } ] )
        .limit(limit)
        .toArray((err, refs) => {
            if (err) return resp.status(500).send("cannot query references");
            if (!refs) return resp.status(500).send("failed querying references");
    
            refs.forEach(ref => {
                var q0 = null;
                var targetId = ref.from == req.params.fromId ? ref.to : ref.from;
                var re =  new RegExp("\\b" + targetId + "\\b", 'i' );
                var prj = { ref_id: ref.ref_id, _valid: ref._valid, type: ref.type, description: ref.description, start: ref.start, end: ref.end, from: ref.from, to: ref.to, name: 1 };
                switch (targetId.substring(0,1)) {
                    case "D":
                        prj.sug = "מסמך בר כוכבא";
                        prj.item_id = "$item_id";
                        prj.collection = "documents";
                        q0 = { coll: "documents", fltr: { item_id: re }, prj: prj };
                        break;
                    case "E":
                        prj.sug = "מסמך חיצוני";
                        prj.item_id = "$item_id";
                        prj.collection = "ext_documents";
                        q0 = { coll: "ext_documents", fltr: { item_id: re }, prj: prj };
                        break;
                    case "P":
                        prj.sug = "דמות";
                        prj.item_id = "$item_id";
                        prj.collection = "persons";
                        q0 = { coll: "persons", fltr: { item_id: re }, prj: prj };
                        break;
                    case "L":
                        prj.sug = "מיקום";
                        prj.item_id = "$item_id";
                        prj.collection = "locations";
                        q0 = { coll: "locations", fltr: { item_id: re }, prj: prj };
                        break;
                }
                if (q0) {
                    var match = Auth.getMatchExprByRole(req, q0.fltr);
                    proms.push(
                        new Promise((resolve, reject) => {    
                            MongoDB.getDB()
                            .collection(q0.coll)
                            .aggregate( [ { $match: match }, { $project: q0.prj } ] )
                            .limit(limit)
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
            var q1 = _queryBuilder(exclude_id, s.fields, re);
            var match = Auth.getMatchExprByRole(req, q1);
            proms.push(
                new Promise((resolve, reject) => {
                    MongoDB.getDB()
                    .collection(s.coll)
                    .aggregate( [ { $match: match }, { $project: s.prj } ] )
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

router.get('/by_word_options/:id/:limit/:json', function (req, resp) {
    console.log('by_word_options: exclude id:' + req.params.id + ' searh for "' + req.params.json +'"');

    _by_word_options(req)
    .then(result => {
        return resp.status(200).send(result);
    }, reason => {
        return resp.status(500).send(reason);
    });
});

module.exports = router;