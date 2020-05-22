const http = require('http');
const parser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { createTerminus } = require('@godaddy/terminus');
const express = require('express');
const ngrok = require('ngrok');
const cache = require('./model');
const utils = require('./utils');
const EbayAuthToken = require('ebay-oauth-nodejs-client');
const eBayApi = require('@hendt/ebay-api');

var fs = require('fs');
var https = require('https');
var proxy = require('express-http-proxy');

//fix ssl localhost
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";



require('dotenv').config();

const { AgencyServiceClient, Credentials } = require("@streetcred.id/service-clients");
console.log("ACCESSTOK = ", process.env.ACCESSTOK);
const client = new AgencyServiceClient(new Credentials(process.env.ACCESSTOK, process.env.SUBKEY));

var certOptions = {
    key: fs.readFileSync(path.resolve('./cert/server.key')),
    cert: fs.readFileSync(path.resolve('./cert/server.crt'))
}

var app = express();
app.use(cors());
app.use(parser.json());
app.use(express.static(path.join(__dirname, 'build')))


console.log("EBAY_CLIENT_ID = ", process.env.EBAY_CLIENT_ID);

// "clientId": "MikeRich-EuroLedg-PRD-f193ff38b-ecdaff89",
// "clientSecret": "PRD-193ff38bb57e-c123-43e7-ac39-b145",
// "devid": "5ac3b11b-0734-4a47-a382-726a92d7a7aa",
// "redirectUri": "Mike_Richardson-MikeRich-EuroLe-jkelbu",
// "baseUrl": "api.ebay.com"
let ebayAuthToken = new EbayAuthToken({
    filePath: './ebay-config-sample.json'
});


const eBay = new eBayApi({
    appId: 'MikeRich-EuroLedg-PRD-f193ff38b-ecdaff89',
    certId: 'PRD-193ff38bb57e-c123-43e7-ac39-b145',
    sandbox: false,
    siteId: eBayApi.SiteId.EBAY_GB, // see https://developer.ebay.com/DevZone/merchandising/docs/Concepts/SiteIDToGlobalID.html

    // optinal parameters, should be omitted if not used
    devId: '5ac3b11b-0734-4a47-a382-726a92d7a7aa', // required for traditional trading API
    ruName: 'Mike_Richardson-MikeRich-EuroLe-jkelbu' // Required for authorization code grant
    // authToken: '--  Auth\'n Auth for traditional API (used by trading) --', // can be set to use traditional API without code grant
});

// console.log("------------------- eBAY = ", eBay);


// const clientScope = 'https://api.ebay.com/oauth/api_scope';

// // Client Crendential Auth Flow
// ebayAuthToken.getApplicationToken('PRODUCTION', clientScope).then((data) => {
//     console.log(data);
// }).catch((error) => {
//     console.log(`Error to get Access token :${JSON.stringify(error)}`);
// });

const scopes = ['https://api.ebay.com/oauth/api_scope'];

app.get('/auth/ebay', function (req, res) {
    // const authUrl = await ebayAuthToken.generateUserAuthorizationUrl('PRODUCTION', scopes);

    const authUrl = eBay.auth.oAuth2.generateAuthUrl();
    console.log(authUrl);
    res.status(200).send(authUrl);y
});

app.get('/auth/privacy', cors(), function (req, res) {
    res.send("You are ok with us!");
});


app.get(
    '/auth/ebay/callback',
    async (req, res) => {
        // req.body.query contains the code to be used for API calls (user token)
        const code = req.query.code;
        console.log("got OAUTH user token: ", code);
        try {
            // res.status(200).send("got user token: ", req.body.query);
            // ebayAuthToken.exchangeCodeForAccessToken('PRODUCTION', req.query.code).then((data) => { // eslint-disable-line no-undef
            //     let tok = JSON.parse(data);
            //     console.log("got access token for user:", tok);


            //     }).then(data => {
            //         console.log(data.results)
            //     });
            // exchange code for access token
            const token = await eBay.auth.oAuth2.getToken(code);
            eBay.auth.oAuth2.setCredentials(token);
            console.log("access token: ", token);

            const data = await eBay.trading.GetUser();
    
            // console.log(user.User);
            console.log("User Name = ", data.User.UserID);
            console.log("Feedback Score = ", data.User.FeedbackScore);
            
            feedbackObtained = true;         
            userData = data.User;

            res.status(200);
        } catch (error) {
            console.log(error);
            console.log(`Error to get Access token :${JSON.stringify(error)}`);
        }

    }
);


app.get('/', function (req, res) {
    console.log("WOOO BACK TO THE START!")
    res.sendFile(path.join(__dirname, '/build/index.html'));
});

let credentialId;
let connectionId;
let connected = true;
let registered = false;
let credentialAccepted = false;
let verificationAccepted = false;
let feedbackObtained = false;
let userData = {};

// console.log("EBAY STRATEGY = ", eBayStrategy);


// EBAY AUTHENTICATION
// passport.use(new eBayStrategy({
//     clientID: process.env.EBAY_CLIENT_ID,
//     clientSecret: process.env.EBAY_CLIENT_SECRET,
//     ruName: 'Mike_Richardson-MikeRich-EuroLe-jkelbu'
// },
//     (accessToken) => {
//         console.log(accessToken);
//     }
//     //   function(accessToken, refreshToken, cb) {
//     //     // Do whatever you need with credentials. A request call to eBay api to fetch user perhaps?
//     //     cb();
//     //   }
// ));



// WEBHOOK ENDPOINT
app.post('/webhook', async function (req, res) {
    try {
        console.log("got webhook" + req + "   type: " + req.body.message_type);
        if (req.body.message_type === 'new_connection') {
            registered = true;
            connectionId = req.body.object_id;
            console.log("new connection notif, connectionId = ", connectionId);

            const attribs = cache.get(req.body.object_id);
            console.log("attribs from cache = ", attribs);
            var param_obj = JSON.parse(attribs);
            var params =
            {
                credentialOfferParameters: {
                    definitionId: process.env.CRED_DEF_ID_USER_DETAILS,
                    connectionId: req.body.object_id,
                    credentialValues: {
                        'First Name': param_obj["firstname"],
                        'Last Name': param_obj["lastname"],
                        'Email Address': param_obj["email"],
                        'Country': param_obj["country"]
                    }
                }
            }
            console.log(">>>>>>>>>>>>> Creating credential with params ", params);
            await client.createCredential(params);
            console.log("CREDENTIAL CREATED user details!");
        }
        else if (req.body.message_type === 'credential_request') {
            console.log("cred request notif");
            // if (connected) {
            credentialId = req.body.object_id;
            console.log("Issuing credential to ledger, id = ", credentialId);
            await client.issueCredential(credentialId);
            console.log("Credential Issue -> DONE");
            credentialAccepted = true;
            // }
        }
        else if (req.body.message_type === 'verification') {
            console.log("cred verificatation notif");
            verificationAccepted = true;
            console.log(req.body);
        } else {
            console.log("WEBHOOK message_type = ", req.body.message_type);
            console.log("body = ", req.body);
        }
    }
    catch (e) {
        console.log("/webhook error: ", e.message || e.toString());
    }
});

//FRONTEND ENDPOINTS

app.post('/api/issue', cors(), async function (req, res) {
    if (connectionId) {
        console.log("issue params = ", req.body);
        var params =
        {
            credentialOfferParameters: {
                definitionId: process.env.CRED_DEF_ID_LARGE_FEEDBACK,
                connectionId: connectionId,
                credentialValues: {
                    "User Name": req.body["name"],
                    "Feedback Score": req.body["feedbackscore"],
                    "Registration Date": req.body["registrationdate"],
                    "Negative Feedback Count": req.body["negfeedbackcount"],
                    "Positive Feedback Count": req.body["posfeedbackcount"],
                    "Positive Feedback Percent": req.body["posfeedbackpercent"],
                }
            }
        }
        await client.createCredential(params);
        console.log("----------------------> CREDENTIAL CREATED!");
        res.status(200).send();
    } else {
        res.status(500).send("Not connected");
    }
});

async function findClientConnection(connectionId) {
    return await client.getConnection(connectionId);
}

async function getConnectionWithTimeout(connectionId) {
    let timeoutId;

    const delay = new Promise(function (resolve, reject) {
        timeoutId = setTimeout(function () {
            reject(new Error('timeout'));
        }, 3000);
    });

    // overall timeout
    return Promise.race([delay, findClientConnection(connectionId)])
        .then((res) => {
            clearTimeout(timeoutId);
            return res;
        });
}


app.post('/api/login', cors(), async function (req, res) {
    console.log("Retrieving connection record for id ", req.body);
    connectionId = req.body.email;

    // verify that the connection record exists for this id
    let connectionContract;
    try {
        connectionContract = await getConnectionWithTimeout(connectionId);
    } catch (e) {
        console.log(e.message || e.toString());
        res.status(500).send("connection record not found for id " + connectionId);
    }

    if (connectionContract) {
        console.log("connectionContract = ", connectionContract);
        res.status(200).send("OK!");
    } else {
        console.log("connection record not found for id ", connectionId);
        res.status(500);
    }
});


app.post('/api/register', cors(), async function (req, res) {
    console.log("Getting invite...")
    const invite = await getInvite(req.body.email);
    const attribs = JSON.stringify(req.body);
    console.log("invite= ", invite);
    cache.add(invite.connectionId, attribs);
    res.status(200).send({ invite_url: invite.invitation });
});

app.post('/api/revoke', cors(), async function (req, res) {
    console.log("revoking credential, id = ", credentialId);
    await client.revokeCredential(credentialId);
    console.log("Credential revoked!");
    res.status(200).send();
});

app.post('/api/connected', cors(), async function (req, res) {
    console.log("Waiting for connection...");
    await utils.until(_ => registered === true);
    res.status(200).send();
});

app.post('/api/feedback', cors(), async function (req, res) {
    console.log("Waiting for ebay feedback...");
    await utils.until(_ => feedbackObtained === true);
    res.status(200).send(userData);
});


app.post('/api/credential_accepted', cors(), async function (req, res) {
    console.log("Waiting for credential to be accepted...");
    await utils.until(_ => credentialAccepted === true);
    credentialAccepted = false;
    res.status(200).send();
});

app.post('/api/verification_accepted', cors(), async function (req, res) {
    console.log("Waiting for proof request (verification) to be accepted...");
    await utils.until(_ => verificationAccepted === true);
    verificationAccepted = false;
    res.status(200).send();
});



app.post('/api/sendkeyverification', cors(), async function (req, res) {

    // need to call client.sendVerificationFromParameters
    // use VerificationPolicyParameters for params

    const params =
    {
        verificationPolicyParameters: {
            "name": "ebay2",
            "version": "1.0",
            "attributes": [
                {
                    "policyName": "ebay May 20 (2)",
                    "attributeNames": [
                        "User Name",
                        "Feedback Score"
                    ],
                    "restrictions": null
                }
            ],
            "predicates": [],
            "revocationRequirement": null
        }
    }
    console.log("send verification request, connectionId = ", connectionId, "; params = ", params);
    const resp = await client.sendVerificationFromParameters(connectionId, params);
    res.status(200).send();
});

const getInvite = async (id) => {
    try {
        var result = await client.createConnection({
            connectionInvitationParameters: {
                connectionId: id,
                multiParty: false
            }
        });
        return result;
    } catch (e) {
        console.log(e.message || e.toString());
    }
}

// for graceful closing
// var server = https.createServer(certOptions, app);
var server = https.createServer(certOptions, app);
async function onSignal() {
    var webhookId = cache.get("webhookId");
    const p1 = await client.removeWebhook(webhookId);
    return Promise.all([p1]);
}
createTerminus(server, {
    signals: ['SIGINT', 'SIGTERM'],
    healthChecks: {},
    onSignal
});

const PORT = process.env.PORT || 3002;
var server = server.listen(PORT, async function () {
    // const url_val = await ngrok.connect(PORT);
    // console.log("============= \n\n" + url_val + "\n\n =========");

    var response = await client.createWebhook({
        webhookParameters: {
            url: "https://327f8f6f.ngrok.io/webhook",  // process.env.NGROK_URL
            type: "Notification"
        }
    });

    cache.add("webhookId", response.id);
    console.log('Listening on port %d', server.address().port);
});


// app.listen(3000, async () => {
//     const url_val = await ngrok.connect(3002);
//     console.log("============= \n\n" + url_val + "\n\n =========");
//     var response = await client.createWebhook({
//         webhookParameters: {
//             url: url_val + "/webhook",  // process.env.NGROK_URL
//             type: "Notification"
//         }
//     });

//     //     cache.add("webhookId", response.id);
//     console.log(`Server `run`ning on port 3000 ...`);
// });

// "proxy": "http://localhost:3002"