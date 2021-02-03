var express = require('express');
const jwt = require("jsonwebtoken");
var ObjectID = require('mongodb').ObjectID;
var MongoDB = require('../mongoUtils');
var Auth = require('../authUtils');
const { json } = require('body-parser');
const MAX_ANSWERS = 5;

const router = express.Router();

const _getMatchExpr = (req, filter) => {
    let role = Auth.getRole(req);
    var q0 = { _restricts: { $ne: role }};

    if (filter) {
        if (Array.isArray(filter)) {
            return { $and: [q0].concat(filter) };
        } else {
            return { $and: [q0, filter] };
        }
    } else {
        return q0;
    }
}

const _getItemById = (req, itemId) => {
    var coll = null;
    switch (itemId.substring(0,1)) {
        case "D":
            coll = "documents";
            break;
        case "E":
            coll = "ext_documents";
            break;
        case "P":
            coll = "persons";
            break;
        case "L":
            coll = "locations";
            break;
    }
    var q1 = { item_id: itemId };
    var match = _getMatchExpr(req, q1);
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            MongoDB.getDB()
            .collection(coll)
            .aggregate([ { $match: match } ])
            .limit(1)
            .toArray(function(err1, items) {
                if (err1)
                    reject(err1);
                else
                    resolve(items[0]);
            });
        });
    });
};

const _getStats = (req, email) => {
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) resolve(0);
    
            var restricts = _getMatchExpr(req, null);   // will return object and not array with $and
            var match = { $and: [
                restricts
                ,{ "_answers._who": email }
            ] };

            MongoDB.getDB()
            .collection("references")
            .aggregate( [
                { $match: match },
                { $count: "stats" } 
            ] )
            .toArray((err, items) => {
                if (err) {
                    resolve(0);
                } else {
                    if (items && Array.isArray(items) && items.length>0)
                        resolve(items[0].stats);
                    else
                        resolve(0);
                }
            });
        });    
    });
};

// get a random reference that is:
//      a) not valid
//      b) has less than MAX_ANSWERS 
//      c) no answer belongs to email
const _getRefQuery = (req, email) => {
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject(err);
    
            var maxAns = "_answers." + MAX_ANSWERS;
            var emailRegEx = new RegExp(email, 'im');
            var restricts = _getMatchExpr(req, null);   // will return object and not array with $and
            var match = { $and: [
                restricts
                ,{ _valid: "no" }
                ,{ maxAns: { $exists: false } }
                ,{ "_answers._who": { $not: emailRegEx } }
            ] };

            MongoDB.getDB()
            .collection("references")
            .aggregate( [
                { $match: match },
                { $sample: { size: 1 } } 
            ] )
            .toArray((err, items) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(items[0]);
                }
            });
        });    
    });
};

router.get('/getRandom', async (req, resp) => {
    let token = req.headers["x-access-token"];

    console.log("getRandom called with token " + token);

    var result = {};
    if (token) {
        var jwToken = Auth.verifyJWToken(token, false);

        result["stats"] = await _getStats(req, jwToken.email);

        Auth.getUser(jwToken.email)
        .then(user => { 
            result['user'] = { name: user.name, alias: user.alias, email: user.email };    

            _getRefQuery(req, jwToken.email)
            .then(randomRef => {
                result['ref'] = randomRef;
                var proms = [];
                proms.push(_getItemById(req, randomRef.from));
                proms.push(_getItemById(req, randomRef.to));

                Promise.all(proms).then(values => {
                    values.forEach(item => {
                        if (item && item.item_id == randomRef.from)
                            result['fromItem'] = item;
                        else
                            result['toItem'] = item;
                    });
                    if (result.fromItem && result.toItem)
                        return resp.status(200).send(result);
                    else
                        return resp.status(403).send(`<html><head /><body dir="rtl"><H1>תקלה בשליפת מסמכים קשורים</H1></body></html>`);        
                });    
            }, reason => {
                return resp.status(403).send(`<html><head /><body dir="rtl"><H1>אין עוד שאלות</H1></body></html>`);
            });
        }, reason => {
            return resp.status(403).send(`<html><head /><body dir="rtl"><H1>משתמש ${jwToken.email} לא מורשה</H1></body></html>`);
        });
    } else {
        return resp.status(403).send(`<html><head /><body dir="rtl"><H1>יש להזדהות למערכת</H1></body></html>`);
    }
});

router.get('/updateAnswer/:id/:answer', async (req, resp, next) => {
    var role = Auth.getRole(req);
    var who = Auth.getEmailByRequest(req);
    var id = req.params.id;
    var answer = req.params.answer === "yes" ? "yes" : "no";

    var origDoc = await MongoDB.firstOrDefault("references", { _id: ObjectID(id)} );
    if (origDoc) {
        if (origDoc._valid != "no" || (origDoc._restricts && origDoc._restricts.includes(role))) {
            return resp.status(403).send();
        }
        origDoc._answers = origDoc._answers || [];
        var idx = -1;
        for (var i=0; i<origDoc._answers.length; i++) {
            if (origDoc._answers[i]._who == who) {
                idx = i;
                origDoc._answers[i]._valid = answer;
                break;
            }
        }
        if (idx < 0) {
            if (origDoc._answers.length < MAX_ANSWERS) {
                origDoc._answers.push( {_who : who, _valid: answer} );
            } else {
                return resp.status(403).send();
            }
        }

        // ok, origDoc._answers is updated and ready to be persisted
        await MongoDB.update("references", origDoc)
        .then(id => {
            return resp.status(200).send(id);
        }, reason => {
            return resp.status(500).send(reason);
        });
    } else {
        return resp.status(403).send();
    }
});

module.exports = router;