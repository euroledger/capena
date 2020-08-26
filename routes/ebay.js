const eBayApi = require('@hendt/ebay-api');
const utils = require('../utils');
const cors = require('cors');

module.exports = (app) => {
    let ebayUserData = {};
    let feedbackObtained = false;

    console.log("EBAY_CLIENT_ID = ", process.env.EBAY_CLIENT_ID);
    console.log("EBAY_CLIENT_ID = ", process.env.EBAY_CLIENT_SECRET);

    const eBay = new eBayApi({
        appId: process.env.EBAY_CLIENT_ID,
        certId: process.env.EBAY_CLIENT_SECRET,
        sandbox: false,
        siteId: eBayApi.SiteId.EBAY_GB, // see https://developer.ebay.com/DevZone/merchandising/docs/Concepts/SiteIDToGlobalID.html

        // optinal parameters, should be omitted if not used
        devId: process.env.EBAY_DEV_ID, // required for traditional trading API
        ruName: process.env.EBAY_RUNAME // Required for authorization code grant
    });

    app.get('/auth/ebay', cors(), function (req, res) {

        console.log("Get URL for eBay sign-in");
        const authUrl = eBay.auth.oAuth2.generateAuthUrl();
        console.log(authUrl);

        // better to use res.redirect here but that causes a CORS error which 
        // has no obvious solution
        // so send the url back to the client and do the redirect there
        res.status(200).send(authUrl);
    });

    // this endpoint is a requirement of the eBAY API. Not sure what it is supposed to do
    app.get('/auth/privacy', cors(), function (req, res) {
        res.send("You are ok with us!"); // TODO privacy statement??
    });

    app.get('/auth/ebay/callback',
        async (req, res) => {
            // req.body.query contains the code to be used for API calls (user token)
            const code = req.query.code;
            try {
                // exchange code for access token
                const token = await eBay.auth.oAuth2.getToken(code);
                eBay.auth.oAuth2.setCredentials(token);

                const data = await eBay.trading.GetUser();
                console.log(data);

                feedbackObtained = true;
                ebayUserData = data.User;

                // res.status(200);
                res.redirect("http://localhost:3000/");
            } catch (error) {
                console.log(error);
                console.log(`Error to get Access token :${JSON.stringify(error)}`);
            }
        }
    );

    app.get('/api/ebay/feedback', cors(), async function (req, res) {
        console.log("Waiting for EBAY feedback...");
        await utils.until(_ => feedbackObtained === true);
        res.status(200).send(ebayUserData);
    });
    
};