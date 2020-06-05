const MongoClient = require('mongodb').MongoClient
const uri = "mongodb://root:" + encodeURIComponent('AYNIL#$%678liayn') + "@blcloud.ddns.net:27017";
let _client
let _db

const connectDB = async (database, callback) => {
    try {
        MongoClient.connect(uri, (err, client) => {
            _client = client
            _db = client.db(database);
            return callback(err)
        })
    } catch (e) {
        throw e
    }
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

const getClient = () => _client
const getDB = () => _db

const disconnectDB = () => _client.close()

module.exports = { connectDB, getClient, getDB, disconnectDB, getNextId, incrementNext }