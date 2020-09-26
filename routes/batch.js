const fs = require('fs');
var express = require('express');
var MongoDB = require('../mongoUtils');

var router = express.Router();

// bulk update name from label in entire collection
router.get('/bulk/:collection', async (req, resp) => {
    var collName = req.params.collection;

    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB
        .getDB()
        .collection(req.params.collection)
        .updateMany( {}, [ { "$set": { name: "$label" } } ] )
        .then(result => {
            return resp.status(200).send('OK');
        })
        .catch(err => {
            return resp.status(500).send(`Failed to update items: ${err}`);
        });
    });
});

router.get('/unbatch/locations', async (req, resp) => {
    MongoDB.connectDB('copper-db', async (err) => {
        if (err) return resp.status(500).send("cannot connect to DB");

        MongoDB
        .getDB()
        .collection('locations')
        .deleteMany( { $or : [ {source: 'batch'}, {source: 'buildings batch'} ] } )
        .then(result => {
            return resp.status(200).send('OK ' +  JSON.stringify(result));
        })
        .catch(err => {
            return resp.status(500).send(`Failed to update items: ${err}`);
        });
    });

});

router.get('/import/locations/:jsonName', async (req, resp) => {
    var jsonName = './documents/' + req.params.jsonName;
    var excel = JSON.parse(fs.readFileSync(jsonName));
    var sheet = null;
    var inserted = 0;

    for (sheetName in excel) {
        if (excel[sheetName].length > 0) {
            sheet = excel[sheetName];
            break;
        }
    }
    if (!sheet) return resp.status(500).send(`cannot find sheet in : ${jsonName}`);

    for (var i=0; i< sheet.length; i++) {
        var rec = sheet[i];
        var nameExists = await MongoDB.nameExists('locations', rec.name);

        if (!nameExists) {
            newDoc = {
                name: rec.name,
                title: rec.name,
                label: rec.name,
                source: 'batch',
                keywords: rec.keywords ? rec.keywords.split(',').map(item => item.trim()) : [],
                aliases: rec.aliases ? rec.aliases.split(',').map(item => item.trim()) : [],
                location: rec.location || '',
                remarks: rec.remarks || '',
            };

            await MongoDB.insert('locations', newDoc);
            inserted++;
        }
    }
    return resp.status(200).send('Inserted: ' + inserted);
});

router.get('/import/buildings/:jsonName', async (req, resp) => {
    var jsonName = './documents/' + req.params.jsonName;
    var excel = JSON.parse(fs.readFileSync(jsonName));
    var sheet = null;
    var inserted = 0;

    for (sheetName in excel) {
        if (excel[sheetName].length > 0) {
            sheet = excel[sheetName];
            break;
        }
    }
    if (!sheet) return resp.status(500).send(`cannot find sheet in : ${jsonName}`);

    for (var i=0; i< sheet.length; i++) {
        var rec = sheet[i];
        var nameExists = await MongoDB.nameExists('locations', rec.name);

        if (!nameExists) {
            var keywords = [];
            if (rec.kw1 && rec.kw1.trim()) keywords.push(rec.kw1.trim());
            if (rec.kw2 && rec.kw2.trim()) keywords.push(rec.kw2.trim());
            if (rec.kw3 && rec.kw3.trim()) keywords.push(rec.kw3.trim());
            if (rec.kw4 && rec.kw4.trim()) keywords.push(rec.kw4.trim());
            if (rec.kw5 && rec.kw5.trim()) keywords.push(rec.kw5.trim());
            if (rec.kw6 && rec.kw6.trim()) keywords.push(rec.kw6.trim());
            if (rec.kw7 && rec.kw7.trim()) keywords.push(rec.kw7.trim());
            if (rec.kw8 && rec.kw8.trim()) keywords.push(rec.kw8.trim());
            newDoc = {
                name: rec.name,
                title: rec.name,
                label: rec.name,
                source: 'buildings batch',
                keywords: keywords,
                aliases: [],
                location: rec.location || '',
                remarks: rec.remarks || '',
            };

            await MongoDB.insert('locations', newDoc);
            inserted++;
        }
    }
    return resp.status(200).send('Inserted: ' + inserted);
});
module.exports = router;