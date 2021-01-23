var express = require('express');
const jwt = require("jsonwebtoken");
var ObjectID = require('mongodb').ObjectID;
var MongoDB = require('../mongoUtils');
var AuthUtils = require('../authUtils');
const { json } = require('body-parser');
const MAX_ANSWERS = 5;

const router = express.Router();

const _getItemById = (itemId) => {
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
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            MongoDB.getDB()
            .collection(coll)
            .find({ item_id: itemId })
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

// get a random reference that is:
//      a) not valid
//      b) has less than MAX_ANSWERS 
//      c) no answer belongs to email
const _getRefQuery = (email) => {
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject(err);
    
            var maxAns = "_answers." + MAX_ANSWERS;
            var emailRegEx = new RegExp(email, 'im');
            MongoDB.getDB().collection("references").aggregate( [
                { $match: { 
                    $and:[ 
                        { _valid: "no" }
                        ,{ maxAns: { $exists: false } }
                        , { "_answers._who": { $not: emailRegEx } }
                    ] }
                },
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

    var result = {};
    if (token) {
        var jwToken = jwt.verify(token, process.env.JWT_SECRET);
        AuthUtils.getUser(jwToken.email)
        .then(user => { 
            result['user'] = { name: user.name, alias: user.alias, email: user.email };

            _getRefQuery(jwToken.email)
            .then(randomRef => {
                result['ref'] = randomRef;
                var proms = [];
                proms.push(_getItemById(randomRef.from));
                proms.push(_getItemById(randomRef.to));

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

module.exports = router;