var express = require('express');
var MongoDB = require('../mongoUtils');

var router = express.Router();

router.post('/:collection', async (req, resp, next) => {
    var collName = req.params.collection;
    var docs = req.body;
    var i = 0;

    while(i < docs.length) {
        var doc = docs[i];
        var newDoc = { 
            arch_id: doc,
            material: 'copper',
            text: '',
            label: doc,
            title: doc,
            date: '',
            authenticity: 0,
            images: [],
            keywords: []
        }
        await MongoDB.insert(collName, newDoc);

        i++;
    } 

    return resp.status(200).send('OK');
});

module.exports = router;