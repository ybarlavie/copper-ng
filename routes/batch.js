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
        .updateMany( { $and: [ {"text": /=/ }, { "arch_id" : null} ] }, [ { "$set": { arch_id: "$name" } } ] )
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

const _handleKeywords = ((rec, prop, keywords, kw) => {
    const years = ["לפני המלחמה","שנה א","שנה ב","שנה ג","שנה ד","שנה ה","שנה ו-יא"];
    if (rec[prop] == "1") {
        var y = prop[0];
        var n = prop[1];
        if (keywords.indexOf(kw) < 0) {
            // keyword required and does not exist in keywords array
            keywords.push(kw);
        }
        if (y == "y") {
            var p = years[n];
            if (keywords.indexOf(p) < 0) {
                keywords.push(p);
            }    
        }
    }
    return keywords;
});

router.get('/import/documents/:jsonName', async (req, resp) => {
    var jsonName = './documents/' + req.params.jsonName;
    var json = fs.readFileSync(jsonName);
    var excel = JSON.parse(json);
    var sheet = null;
    var inserted = 0;
    var updated = 0;

    for (sheetName in excel) {
        if (excel[sheetName].length > 0) {
            sheet = excel[sheetName];
            break;
        }
    }
    if (!sheet) return resp.status(500).send(`cannot find sheet in : ${jsonName}`);

    for (var i=0; i<sheet.length; i++) {
        var rec = sheet[i];

        rec.name = rec.name ? rec.name.trim() : '';
        rec.text = rec.text ? rec.text.trim() : '';
        if (rec.name == '' || rec.text == '')
            continue;

        console.log('processing ' + i + ' ' + rec.name);

        var bcDoc = await MongoDB.firstOrDefault('documents', {name:rec.name});
        if (bcDoc) {
            if (!bcDoc.keywords) {
                bcDoc["keywords"] = [];
            }
            var len = bcDoc.keywords.length;
            var keywords = bcDoc.keywords;

            keywords = _handleKeywords(rec, "before_war", keywords, "לפני המלחמה");
            keywords = _handleKeywords(rec, "tm_occ", keywords, "כיבוש הר הבית");
            keywords = _handleKeywords(rec, "y1_army", keywords, "ארגון הצבא");
            keywords = _handleKeywords(rec, "y1_buildings", keywords, "מבנים");
            keywords = _handleKeywords(rec, "y1_dibon", keywords, "קשר עם דיבון");
            keywords = _handleKeywords(rec, "y1_land", keywords, "אדמות");
            keywords = _handleKeywords(rec, "y1_graves", keywords, "קברים");
            keywords = _handleKeywords(rec, "y1_elazar", keywords, "בעיית אלעזר");
            keywords = _handleKeywords(rec, "y1_gov", keywords, "שלטון");
            keywords = _handleKeywords(rec, "y1_romans", keywords, "רומאים");
            keywords = _handleKeywords(rec, "y1_ark", keywords, "ארון הברית");

            keywords = _handleKeywords(rec, "y2_army", keywords, "ארגון הצבא");
            keywords = _handleKeywords(rec, "y2_dibon", keywords, "קשר עם דיבון");
            keywords = _handleKeywords(rec, "y2_buildings", keywords, "מבנים");
            keywords = _handleKeywords(rec, "y2_land", keywords, "אדמות");
            keywords = _handleKeywords(rec, "y2_ph1_romans", keywords, "שלב א מול רומאים");
            keywords = _handleKeywords(rec, "y2_herdis", keywords, "ירידה להרדיס");
            keywords = _handleKeywords(rec, "y2_graves", keywords, "קברים");
            keywords = _handleKeywords(rec, "y2_elazar", keywords, "בעיית אלעזר");
            keywords = _handleKeywords(rec, "y2_gov", keywords, "שלטון");
            keywords = _handleKeywords(rec, "y2_ark", keywords, "ארון הברית");

            keywords = _handleKeywords(rec, "y3_dibon", keywords, "קשר עם דיבון");
            keywords = _handleKeywords(rec, "y3_buildings", keywords, "מבנים");
            keywords = _handleKeywords(rec, "y3_land", keywords, "אדמות");
            keywords = _handleKeywords(rec, "y3_graves", keywords, "קברים");
            keywords = _handleKeywords(rec, "y3_gov", keywords, "שלטון");
            keywords = _handleKeywords(rec, "y3_elazar", keywords, "בעיית אלעזר");
            keywords = _handleKeywords(rec, "y3_ph2_romans", keywords, "שלב ב מול רומאים");
            keywords = _handleKeywords(rec, "y3_samcha_shimon", keywords, "סמחא ושמעון");
            keywords = _handleKeywords(rec, "y3_evac_dibon", keywords, "פינוי דיבון");
            keywords = _handleKeywords(rec, "y3_beitar", keywords, "ביתר");
            keywords = _handleKeywords(rec, "y3_ark", keywords, "ארון הברית");

            keywords = _handleKeywords(rec, "y4_dibon", keywords, "קשר עם דיבון");
            keywords = _handleKeywords(rec, "y4_buildings", keywords, "מבנים");
            keywords = _handleKeywords(rec, "y4_land", keywords, "אדמות");
            keywords = _handleKeywords(rec, "y4_graves", keywords, "קברים");
            keywords = _handleKeywords(rec, "y4_gen_war", keywords, "מלחמה כללית");
            keywords = _handleKeywords(rec, "y4_gov", keywords, "שלטון");
            keywords = _handleKeywords(rec, "y4_shimon_will", keywords, "צוואת שמעון");
            keywords = _handleKeywords(rec, "y4_samch_shimon", keywords, "סמחא ושמעון");
            keywords = _handleKeywords(rec, "y4_beitar_war", keywords, "מלחמה בביתר");
            keywords = _handleKeywords(rec, "y4_ark", keywords, "ארון הברית");

            keywords = _handleKeywords(rec, "y5_dibon", keywords, "קשר עם דיבון");
            keywords = _handleKeywords(rec, "y5_graves", keywords, "קברים");
            keywords = _handleKeywords(rec, "y5_land", keywords, "אדמות");
            keywords = _handleKeywords(rec, "y5_buildings", keywords, "מבנים");
            keywords = _handleKeywords(rec, "y5_ark", keywords, "ארון הברית");

            keywords = _handleKeywords(rec, "y6_graves", keywords, "קברים");
            keywords = _handleKeywords(rec, "y6_land", keywords, "אדמות");
            keywords = _handleKeywords(rec, "y6_burial", keywords, "קבורה");

            if (len != keywords.length) {
                bcDoc.keywords = keywords;
                await MongoDB.update('documents', bcDoc);
                updated++;    
            }
        }
        // if (!bcDoc) {
        //     newDoc = {
        //         name: rec.name,
        //         title: rec.name,
        //         label: rec.name,
        //         text: rec.text,
        //         source: 'imp. documents batch'
        //     };

        //     await MongoDB.insert('documents', newDoc);
        //     inserted++;
        // } else {
        //     if (bcDoc.text && bcDoc.text.trim() != "" && bcDoc.old_text != rec.text)
        //     {
        //         bcDoc.old_text = bcDoc.text;
        //     }
        //     bcDoc.text = rec.text
        //     await MongoDB.update('documents', bcDoc);
        //     updated++;
        // }
    }
    return resp.status(200).send('Inserted: ' + inserted + ' Updated: ' + updated);
});

router.get('/import/ext-documents/:jsonName', async (req, resp) => {
    var jsonName = './documents/' + req.params.jsonName;
    var excel = JSON.parse(fs.readFileSync(jsonName));
    var sheet = null;
    var inserted = 0;
    var updated = 0;

    for (sheetName in excel) {
        if (excel[sheetName].length > 0) {
            sheet = excel[sheetName];
            break;
        }
    }
    if (!sheet) return resp.status(500).send(`cannot find sheet in : ${jsonName}`);

    for (var i=0; i<sheet.length; i++) {
        var rec = sheet[i];

        rec.name = rec.name ? rec.name.trim() : '';
        rec.text = rec.text ? rec.text.trim() : '';
        if (rec.name == '' || rec.text == '')
            continue;

        var extDoc = await MongoDB.firstOrDefault('ext_documents', {name:rec.name});
        if (!extDoc) {
            newDoc = {
                name: rec.name,
                title: rec.name,
                label: rec.name,
                text: rec.text,
                keywords: rec.keywords ? rec.keywords.split(',').map(item => item.trim()) : [],
                remarks: rec.remarks,
                source: 'ext_documents batch'
            };

            await MongoDB.insert('ext_documents', newDoc);
            inserted++;
        } else {
            extDoc.text = rec.text;
            extDoc.keywords = rec.keywords ? rec.keywords.split(',').map(item => item.trim()) : [];
            extDoc.remarks = rec.remarks;

            await MongoDB.update('ext_documents', extDoc);
            updated++;
        }
    }
    return resp.status(200).send('Inserted: ' + inserted + ' Updated: ' + updated);
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