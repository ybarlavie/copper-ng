var express = require('express');
var authUtils = require('../authUtils');

var router = express.Router();

router.get('/verifyTOTP/:email', function (req, resp) {
    var email = req.params.email;
    var totpCode = req.query.t;

    authUtils.verifyTOTP(email, totpCode)
    .then(result => {
        return resp.status(200).send(result);
    }, reason =>{
        return resp.status(403).send(`<html><head /><body dir="rtl"><H1>משתמש ${email} לא מורשה</H1></body></html>`);
    });
});

router.get('/reqQR/:email', function (req, resp) {
    var email = req.params.email;
    
    authUtils.sendQRCodeToUser(email)
    .then(result => {
        return resp.status(200).send(`<html><head /><body dir="rtl"><H1>הבקשה נקלטה, הודעה נשלחה לדואל ${email}</H1></body></html>`);
    }, reason =>{
        return resp.status(403).send(`<html><head /><body dir="rtl"><H1>משתמש ${email} לא מורשה</H1></body></html>`);
    });
});

router.get('/getQR', async function (req, resp) {
    var jwToken = req.query.t;

    var decoded = authUtils.verifyJWToken(jwToken, true);
    if (decoded) {
        var result = await authUtils.getQRImage(decoded.email, decoded.secret)
        .catch(reason => {
            return resp.status(403).send('<html><head /><body dir="rtl"><H1>QRCode לא מורשה</H1></body></html>');
        });
        return resp.status(200).send(`<html><head /><body dir="rtl"><H1>יש לסרוק באמצעות Google Authenticator</H1><br /><img src="${result}" alt="qrcode" title="qrcode" style="display:block" width="300" height="300"></body></html>`);
    } else {
        return resp.status(403).send('<html><head /><body dir="rtl"><H1>טוקן לא תקין או ישן מדי</H1></body></html>');
    }
});

module.exports = router;