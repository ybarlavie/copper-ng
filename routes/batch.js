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

router.get('/import/refs/:jsonName', async (req, resp) => {
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
        var refs = rec.references ? rec.references.split(',').map(item => item.trim()) : [];
        if (refs.length > 0) {
            var locDoc = await MongoDB.firstOrDefault('locations', {name:rec.name});
            if (locDoc) {
                for (var j=0; j<refs.length; j++) {
                    var ref = refs[j];
                    var bcDoc = await MongoDB.firstOrDefault('documents', {name:ref});
                    if (!bcDoc) {
                        // add a new doc
                        newDoc = {
                            arch_id: ref,
                            material: '',
                            text: '',
                            label: ref,
                            title: ref,
                            date: '',
                            authenticity: 0,
                            images: [],
                            keywords: [],
                            name: ref
                        }
                        await MongoDB.insert('documents', newDoc);
                        bcDoc = await MongoDB.firstOrDefault('documents', {name:ref});
                    }

                    var refDoc = await MongoDB.firstOrDefault('references', { from: locDoc.item_id, to: bcDoc.item_id, type: 'referred at document'});
                    if (!refDoc) {
                        var newRef = {
                            from: locDoc.item_id,
                            to: bcDoc.item_id,
                            type: 'referred at document',
                            created_by: 'yonib',
                            description: '',
                            source: 'batch buildings refs'
                        }
                        await MongoDB.insert('references', newRef);
                        inserted++;
                    }
                }
            }    
        }
    }
    return resp.status(200).send('Inserted: ' + inserted);
});
module.exports = router;