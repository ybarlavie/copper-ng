const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const MongoDB = require("./mongoUtils");
const NodeMailer = require('nodemailer');
const crypto = require('crypto');
const base32 = require('hi-base32');
const totp = require('./totp');

const USERS_COLLECTION = "users";


const tokenValidMiddleware = (req, res, next) => {
    console.log('path=' + req.path);

    let token = req.headers["x-access-token"];
    var decoded = null;

    try {
        if (token) {
            //decoded = jwt.verify(token, process.env.JWT_SECRET);
            decoded = verifyJWToken(token, false);
            if (decoded) {
                return next();
            } else {
                console.log("jwt verification failed: " + token);
            }
        }    
    } catch (err) {
        console.log("jwt verification failed: " + JSON.stringify(err));
    }

    if (req.path.startsWith('/api/')) {
        if (req.path.startsWith('/api/auth/')) {
            return next();
        } else if (req.path.startsWith('/api/db/store_data')) {
            return next()
        }
        
        // invalid token for api call. block!
        console.log("blocking " + req.path + " due to authorization...")
        return res.status(401).send({ message: "api Unauthorized!" });
    } else {
        return next();
    }
}

const verifyTOTP = (email, token) => {
    return new Promise ((resolve, reject) => {
        getUser(email)
        .then(result => {
            if (!result.secret) {
                reject("user has no secret");
            }
            if (totp.verifyTOTP(token, result.secret)) {
                console.log('token ' + token + ' is valid');

                var expiryTime = Math.floor(Date.now() / 1000) + parseInt(process.env.MAX_JWT_SECONDS);
                var payload = { exp: expiryTime, type: "JWT", email: email, role: result.role };
                var jwToken = jwt.sign(payload, process.env.JWT_SECRET);
                var client_jwt = { token: jwToken, expires: expiryTime, role: result.role };

                var removes = [];
                for (var k in loggedInTokens) {
                    if (loggedInTokens[k] == email) {
                        removes.push(k);
                    }
                }
                removes.forEach(k => {
                    delete loggedInTokens[k];
                });

                loggedInTokens[jwToken] = email;

                console.log("client_jwt: " + JSON.stringify(client_jwt));
                resolve(client_jwt);
            } else {
                reject("token invalid");
            }
        }, reason => {
            reject(reason);
        });
    });
}

const _GC_ToeknsCache = () => {
    var now = Math.floor(Date.now() / 1000);

    var removes = [];
    for (var k in tokensCache) {
        if (tokensCache[k].exp < now) {
            console.log(`will remove expired jwt ${k}`);
            removes.push(k);
        }
    }

    removes.forEach(k => {
        delete tokensCache[k];
    });
}

const verifyJWToken = (jwToken, removeAfterVerification=false) => {
    _GC_ToeknsCache();

    var decoded = jwt.verify(jwToken, process.env.JWT_SECRET);
    if (decoded) {
        if (tokensCache.hasOwnProperty(jwToken)) {
            if (removeAfterVerification) {
                delete tokensCache[jwToken];
            }
        } else if (!removeAfterVerification) {
            console.log("updated token cache for " + jwToken + " as " + JSON.stringify(decoded));
            tokensCache[jwToken] = decoded;
        }
        return decoded;
    } else {
        if (tokensCache.hasOwnProperty(jwToken)) {
            delete tokensCache[jwToken];
        }
    }
    
    return false;
}

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

const getQRImage = async (email, secret) => {
    var qrCodeUrl = `otpauth://totp/Copper-NG:${email}?secret=${secret}&issuer=Copper-NG`;
    return QRCode.toDataURL(qrCodeUrl);
}

const _sendQRCode = (email, secret) => {
    return new Promise((resolve, reject) => {
        var qrCodeUrl = `otpauth://totp/Copper-NG:${email}?secret=${secret}&issuer=Copper-NG`;
    
        QRCode.toDataURL(qrCodeUrl, function (err, url) {
            if (err) reject(err);

            var expiryTime = Math.floor(Date.now() / 1000) + 1800; // now + 1800 secs = now + 10 mins
            var payload = { exp: expiryTime, type: "QRCode", email: email, secret: secret };
            var jwToken = jwt.sign(payload, process.env.JWT_SECRET);
            var validateUrl1 = `${process.env.PROD_ADDR}/api/auth/getQR?t=${jwToken}`;
            var validateUrl2 = `${process.env.DEBUG_ADDR}/api/auth/getQR?t=${jwToken}`;
            var jwtUrl = `<a href="${validateUrl1}">אם לא ניתן לראות את קוד הסריקה - יש ללחוץ על הקישור הזה</a><br /><a href="${validateUrl2}">או כאן לבדיקות</a>`;
            jwtUrl += `<br /><p>או, לחלופין, ליצור חשבון בשם <span style="font-size:24px; color: green;">Copper-NG(${email})</span> ולהזין את הקוד הבא בשדה המפתח שלך:<br /><br />הקוד: <span style="font-family: 'Courier New', monospace; font-size: 24px; color: red;">RERN3YGO7VDA6TFD2YENY2SAWAVFC7GG</span>`;
            jwtUrl += `<br /><br /><span style="font-size:24px; color: red;">חשוב מאוד להשמיד מייל זה ולמחוק אותו מהאשפה לאחר יצירת החשבון !</span>`;
            var html = `<html><head /><body dir="rtl"><img src="${url}" alt="qrcode" title="qrcode" style="display:block" width="300" height="300">${jwtUrl}</body></html>`;

            // save it tokensCache
            tokensCache[jwToken] = payload;

            console.log(process.env.GMAIL_USER + " :: " + process.env.GMAIL_PASS);

            var message = {
                from: process.env.GMAIL_USER,
                to: email,
                subject: 'new google authentication code',
                html: html
            };
            
            var transporter = NodeMailer.createTransport({
                service: 'gmail',
                auth: {
                  user: process.env.GMAIL_USER,
                  pass: process.env.GMAIL_PASS
                }
            });

            transporter.sendMail(message, (err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        });
    });
}

const sendQRCodeToUser = (email) => {
    return new Promise ((resolve, reject) => {
        getUser(email)
        .then(result => {
            if (!result.secret || result.secret === '') {
                regenerateSecret(email)
                .then(result => {
                    console.log("regenerate secret OK: " + JSON.stringify(result));
                    resolve(result);
                }, reason => {
                    console.log("failed regenerate secret: " + JSON.stringify(reason));
                    reject(reason);
                });
            }
            _sendQRCode(email, result.secret)
            .then(result => {
                console.log("_sendQRCode OK: " + JSON.stringify(result));
                resolve(result);
            }, reason => {
                console.log("_sendQRCode failed: " + JSON.stringify(reason));
                reject(reason);
            });
        }, reason => {
            console.log("sendQRCodeToUser failed, cannot get user: " + JSON.stringify(reason));
            reject(reason);
        });
    });
}

const regenerateSecret = (email) => {
    return new Promise((resolve, reject) => {
        MongoDB.connectDB('copper-db', async (err) => {
            if (err) reject(err);

            const randomBuffer = crypto.randomBytes(20);
            var newSecret = base32.encode(randomBuffer).replace(/=/g, '');

            MongoDB.getDB()
            .collection(USERS_COLLECTION)
            .updateOne( 
                {email:email},
                [
                    { $set: { secret: newSecret } }
                ]
            )
            .then(result => {
                if (result.modifiedCount < 1) {
                    reject("cannot find user by email");
                } else {
                    _sendQRCode(email, newSecret)
                    .then(result => {
                        resolve(true);
                    }, reason => {
                        reject(reason);
                    });        
                }
            }, reason => {
                reject(reason);
            });
        });
    });
}

const getRole = (req) => {
    let token = req.headers["x-access-token"];
    if (tokensCache.hasOwnProperty(token) && tokensCache[token].role) {
        return tokensCache[token].role;
    } else {
        var u = verifyJWToken(token, false);
        if (u) {
            return u.role;
        }
    }

    return null;
}

const getEmailByRequest = (req) => {
    let token = req.headers["x-access-token"];
    if (tokensCache.hasOwnProperty(token) && tokensCache[token].email) {
        return tokensCache[token].email;
    } else {
        var u = verifyJWToken(token, false);
        if (u) {
            return u.email;
        }
    }

    return 'n/a';
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

const getMatchExprByRole = (req, filter) => {
    let role = getRole(req);
    var q0 = { _exclude: { $ne: role } };
    var q1 = { $or: [
        { _include: { $exists: false } },
        { _include: role }
    ]}; 

    if (filter) {
        if (Array.isArray(filter)) {
            return { $and: [q0, q1].concat(filter) };
        } else {
            return { $and: [q0, q1, filter] };
        }
    } else {
        return { $and: [q0, q1] };
    }
}

module.exports = { getMatchExprByRole, verifyTOTP, getQRImage, verifyJWToken, sendQRCodeToUser, tokenValidMiddleware, getEmailByRequest, getUser, updateToken, getRole }