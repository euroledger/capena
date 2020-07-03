const agent = require('./support/agent');
const { DemoAgent } = require('./support/agent');
const utils = require('./support/utils');
const colors = require("colors/safe");

const DEBUG = 'debug';
const ERROR = 'error';
const WARN = 'warn';
const INFO = 'info';
const TRACE = 'trace';

class AliceAgent extends DemoAgent {
    constructor(httpPort, adminPort, genesis, noAuto, timing) {
        let extraArgs = noAuto ? [] : [
            "--auto-accept-invites",
            "--auto-accept-requests",
            "--auto-store-credential",
        ];

        super("Alice Agent", httpPort, adminPort, null, extraArgs);
        this.httpPort = httpPort;
        this.adminPort = adminPort;
        this.genesisData = genesis;
        this.noAuto = noAuto;
        this.timing = timing;
        this.externalHost = process.env.DOCKERHOST;
        this.internalHost = process.env.DOCKERHOST;
        this.connectionReady = false;
        this.gotResponse = false;
        this.credState = {};
    }

    async operation() {
        await utils.until(_ => this.connectionReady === true);
    }

    async waitForResponse() {
        await utils.until(_ => this.gotResponse === true);
    }

    setConnectionReady(ready) {
        this.connectionReady = ready;
    }

    basicmessages(data) {
        utils.logInfo(data.content);
    }

    async handle_issue_credential(message, self) {
        const state = message.state;
        const credentialExchangeId = message.credential_exchange_id;
        const prevState = self.credState[credentialExchangeId];
        if (prevState === state) {
            return  // ignore
        }

        self.credState[credentialExchangeId] = state;

        utils.logInfo(`Credential: state = ${state}, credential_exchange_id = ${credentialExchangeId}`);

        if (state === "offer_received") {
            console.log("#15 After receiving credential offer, send credential request");
            await self.admin_POST(`/issue-credential/records/${credentialExchangeId}/send-request`);
        } else if (state === "credential_acked") {
            const credId = message.credential_id;
            utils.logInfo(`Stored credential ${credId} in wallet`);
            console.log(`#18.1 Stored credential ${credId} in wallet`);

            resp = await self.admin_GET(`/credential/${credId}`);

            utils.logTrace(" -----------> resp = " + resp);
            utils.logTrace(" -----------> message= " + message);

            console.log("Credential details: ", JSON.parse(resp));
            console.log("Credential reques metadata: ", message.credential_request_metadata);

            utils.logInfo("credential_id: " + message.credential_id);
            utils.logInfo("credential_definition_id: " + message.credential_definition_id);
            utils.logInfo("schema_id: " + message.schema_id);
        }
        self.input = true;
    }

    handle_connections(data, self) {
        const myid = self.connectionId;
        utils.logDebug("--------> data connection id = " + data.connection_id);
        utils.logDebug("--------> my connection id = " + myid);
        utils.logDebug("--------> state = " + data.state);
        if (data.connection_id === myid) {
            if (data.state === "active") {
                console.log("Connected!");
                self.setConnectionReady(true);
            }
        }
    }

    async handle_present_proof(message, self) {
        const state = message.state;
        const presentationExchangeId = message.presentation_exchange_id;
        const presentationRequest = message.presentation_request;

        utils.logDebug(`Presentation: state = ${state}, presentationExchangeId = ${presentationExchangeId}`);

        if (state === "request_received") {
            console.log("#24 Query for credentials in the wallet that satisfy the proof request");

            // include self - attested attributes(not included in credentials)
            let credentialsByReferent = {};
            let revealed = {};
            let self_attested = {};
            let predicates = {};

            // select credentials to provide for the proof
            const credentials = await self.admin_GET(`/present-proof/records/${presentationExchangeId}/credentials`);

            // TODO sort the credentials by ["cred_info"]["attrs"]["timestamp"]

            if (credentials) {
                for (let row of credentials) {
                    for (let referent of row.presentation_referents) {
                        credentialsByReferent[referent] = row;
                    }
                }
            }
            utils.logTrace("********** credentialsByReferent =" + credentialsByReferent);

            // for (let referent of presentationRequest.requested_attributes) {
            for (let referent of Object.keys(presentationRequest.requested_attributes)) {
                if (Object.keys(credentialsByReferent).includes(referent)) {
                    revealed[referent] = {
                        "cred_id": credentialsByReferent[referent]["cred_info"]["referent"],
                        "revealed": true
                    }
                } else {
                    self_attested[referent] = "my self-attested value";
                }
            }

            for (let referent of Object.keys(presentationRequest.requested_predicates)) {
                if (Object.keys(credentialsByReferent).includes(referent)) {
                    predicates[referent] = {
                        "cred_id": credentialsByReferent[referent]["cred_info"]["referent"],
                        "revealed": true
                    }
                }
            }

            console.log("#25 Generate the proof")
            let request = {
                "requested_predicates": predicates,
                "requested_attributes": revealed,
                "self_attested_attributes": self_attested,
            }
            console.log("#26 Send the proof to X")
            await self.admin_POST(
                `/present-proof/records/${presentationExchangeId}/send-presentation`,
                request,
            )
        }
    }

    setConnectionId(id) {
        this.connectionId = id;
    }

    async detect_connection() {
        await this.operation()
    }

    async input_invitation() {

        const readline = require('readline');

        const rli = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.gotResponse = false;
        const callback = async (answer) => {
            // Get user input from result object.
            var invitation = answer;

            // Display user input in console log.
            utils.logDebug("sending receive invitation to faber =", invitation);

            let resp = await this.admin_POST("/connections/receive-invitation", invitation);
            if (resp) {
                this.setConnectionId(resp.data.connection_id);
                console.log("Invitation response: ");
                console.log(resp.data);
            }
            this.gotResponse = true;
            rli.close();

        }
        rli.setPrompt(colors.green('Invite details: '));
        rli.prompt();
        rli.on('line', callback);

        await this.waitForResponse();
        await this.detect_connection();
    }

    async send_message() {

        var readline = require('readline');

        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.gotResponse = false;
        let callback = async (answer) => {

            // Get user input from result object.
            var message = answer;

            // Display user input in console log.
            utils.logDebug("sending message =", message);

            let resp = await this.admin_POST(`/connections/${this.connectionId}/send-message`, {
                "content": message
            });

            if (resp && resp.status != 200) {
                console.log("send message error: ", resp.status);
            }
            this.gotResponse = true;
            rl.close();
        }
        rl.setPrompt(colors.green('Enter Message: '));
        rl.prompt();
        rl.on('line', callback);
        await this.waitForResponse();
    }

    async prompt_loop() {
        this.input = false;
        let ret = false;
        var promptMessage = '[3/4/X]: \n';
        var options = ["Send Message", "Input New Invitation", "Exit"];
        for (var i = 0, l = options.length - 1; i < l; i++) {
            promptMessage += '\t (' + (i + 3) + ') ' + options[i] + "\n";
        }
        promptMessage += '\t (X) ' + options[options.length - 1] + "\n";

        var readline = require('readline');

        var rli = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        let choice;
        rli.question(promptMessage, (answer) => {
            this.input = true;

            if (answer.toUpperCase() === 'X') {
                ret = true;
            } else if (answer === '3' || answer === '4') {
                ret = true;
            }
            choice = answer.toUpperCase();
            
        });

        await utils.until(_ => this.input === true);
        rli.close();
        if (ret) {
            return choice;
        }

    }
}

async function main(start_port, no_auto = false, show_timing = false) {
    console.log("Running the alice agent...");

    const genesis = await agent.default_genesis_txns();
    if (!genesis) {
        console.log("Error retrieving ledger genesis transactions")
        process.exit(1);
    }

    utils.logTrace(genesis);

    console.log("#7 Provision an agent and wallet, get back configuration details");

    let alice = new AliceAgent(
        start_port,
        start_port + 1,
        genesis,
        no_auto,
        show_timing,
    )
    await alice.listen_webhooks(start_port + 2)

    // console.time("Startup duration:");
    var start = new Date();

    await alice.start_process();
    await alice.startupComplete();

    console.log(colors.magenta("Admin url is at: " + alice.adminUrl));
    console.log(colors.magenta("Endpoint url is at: " + alice.endpoint));


    var end = (new Date() - start) / 1000;
    // console.info('Execution time: %dms', end)

    console.log(colors.magenta("Startup duration:" + end));

    console.log("#9 Input faber invitation details");

    await alice.input_invitation();

    let choice;
    while (true) {
        choice = await alice.prompt_loop();
        if (choice === '3') {
            // send a message to faber
            await alice.send_message();
        } else if (choice === '4') {
            // handle new invitation
            await alice.input_invitation();
        } else if (choice === 'X') {
            // terminate...
            break;
        } else {
            console.log("Invalid choice");
        }
    }
    try {
        await alice.terminate_process();
        utils.logInfo("Shutting down...");
        process.exit(0);
    }
    catch (error) {
        utils.logError("Error terminating agent:", error);
    }
}
utils.setLogLevel(DEBUG);
main(8030);

