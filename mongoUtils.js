const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID
const uri = "mongodb://root:" + encodeURIComponent('AYNIL#$%678liayn') + "@blcloud.ddns.net:27017";
let _client
let _db

const connectDB = async (database, callback) => {
    try {
        var cli = new MongoClient(uri, { useUnifiedTopology: true } );
        cli.connect((err, client) => {
            _client = client
            _db = client.db(database);
            return callback(err)
        })
    } catch (e) {
        throw e
    }
}

const docExists = (collName, _id) => {
    return new Promise((resolve, reject) => {
        connectDB('copper-db', async (err) => {
            if (err) reject(err);

            getDB()
            .collection(collName)
            .find({_id: ObjectID(_id)})
            .limit(1)
            .toArray(function(err, data) {
                if (err) {
                    disconnectDB();
                    reject(err);
                } else {
                    disconnectDB();
                    resolve(data.length > 0);
                }
            });
        });
    });
}

const getNextId = (collName, newDoc) => {
    return new Promise((resolve, reject) => {
        connectDB('copper-db', async (err) => {
            if (err) reject(err);

            getDB()
            .collection('tables_admin')
            .find({table: collName})
            .limit(1)
            .toArray(function(err, data) {
                if (err) {
                    disconnectDB();
                    reject(err);
                } else {
                    disconnectDB();
                    var nextId = (collName === 'references') ? newDoc.from + '_' + newDoc.to + '_' : data[0].id_prefix;
                    nextId += data[0].id_next;
                    resolve([nextId, data[0].id_col]);
                }
            });
        });
    });
}

const incrementNext = (collName) => {
    return new Promise((resolve, reject) => {
        connectDB('copper-db', async (err) => {
            if (err) reject(err);

            getDB()
            .collection('tables_admin')
            .findOneAndUpdate(
                { table: collName },
                { $inc: { id_next: 1 } },
                { returnNewDocument: true }
            )
            .then(newTadmin => {
                disconnectDB();
                resolve(newTadmin);
            }, reason => {
                disconnectDB();
                reject(reason);
            });
        });
    });
}

const insert = (collName, newDoc) => {
    return new Promise((resolve, reject) => {
        getNextId(collName, newDoc)
        .then(([nextId, id_col]) => {
            connectDB('copper-db', async (err) => {
                if (err) reject("cannot connet to DB");
    
                if (newDoc.hasOwnProperty('_id')) delete newDoc['_id'];
                newDoc[id_col] = nextId;
    
                getDB()
                .collection(collName)
                .insertOne(newDoc, function(err1, res1) {
                    disconnectDB();
    
                    if (err1) reject("failed insert: " + JSON.stringify(newDoc));
    
                    incrementNext(collName)
                    .then(newTadmin => {
                        resolve(res1.insertedId);
                    }, reason => {
                        reject("failed increment for " + collName);
                    });
                })
            });
        }, reason => {
            reject("failed get nextId for " + collName);
        });    
    })
}

const update = (collName, doc) => {
    var _id = doc['_id'];
    delete doc['_id'];

    return new Promise((resolve, reject) => {
        connectDB('copper-db', async (err) => {
            if (err) reject("cannot connet to DB");

            getDB()
            .collection(collName)
            .replaceOne({"_id": ObjectID(_id)}, doc, function(err1, res1) {
                disconnectDB();

                if (err1)  {
                    reject("failed update: " + JSON.stringify(doc));
                } else {
                    resolve(doc._id);
                }
            })
        });
    })
}

const getClient = () => _client
const getDB = () => _db
const disconnectDB = () => _client.close()

module.exports = { connectDB, getClient, getDB, disconnectDB, docExists, getNextId, incrementNext, insert, update }