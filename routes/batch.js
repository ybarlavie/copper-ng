var express = require('express');
var MongoDB = require('../mongoUtils');

var router = express.Router();

router.get('/:collection', async (req, resp) => {
    var collName = req.params.collection;

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB
        .getDB()
        .collection(req.params.collection)
        .updateMany( {}, { $rename: { "loc_id" : "item_id" } } )
        .then(result => {
            return resp.status(200).send('OK');
        })
        .catch(err => {
            return resp.status(500).send(`Failed to update items: ${err}`);
        });
    });
});

module.exports = router;