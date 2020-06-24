const MongoDB = require('./mongoUtils');
const USERS_COLLECTION = "users";


const getUser = (email) => {
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject(err);

            MongoDB.getDB()
            .collection(USERS_COLLECTION)
            .find({email: email})
            .limit(1)
            .toArray(function(err, data) {
                if (err) {
                    reject(err);
                } else if (data.length <= 0) {
                    reject("User does not exist");
                } else {
                    resolve(data[0]);
                }
            });
        });
    });
}


const updateToken = (email, token) => {
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject(err);

            MongoDB.getDB()
            .collection(USERS_COLLECTION)
            .updateOne( 
                {email:email},
                [
                    { $set: { token: token } }
                ]
            )
            .then(result => {
                if (result.modifiedCount < 1) {
                    reject("cannot find user by email");
                } else {
                    tokensCache[token.access_token] = { email: email, expiry_date: token.expiry_date };
                    resolve(true);
                }
            }, reason => {
                reject(reason);
            });
        });
    });
}

module.exports = { getUser, updateToken }