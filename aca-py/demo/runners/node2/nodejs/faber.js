const agent = require('./support/agent');
const { DemoAgent } = require('./support/agent');
const utils = require('./support/utils');
const colors = require("colors/safe");
var QRCode = require('qrcode-terminal')


const DEBUG = 'debug';
const ERROR = 'error';
const WARN = 'warn';
const INFO = 'info';
const TRACE = 'trace';

class FaberAgent extends DemoAgent {
    constructor(httpPort, adminPort, genesis, noAuto, timing) {
        let extraArgs = noAuto ? [] : [
            "--auto-accept-invites",
            "--auto-accept-requests",
            "--auto-store-credential",
        ];

        super("Faber Agent", httpPort, adminPort, null, extraArgs);
        this.httpPort = httpPort;
        this.adminPort = adminPort;
        this.genesisData = genesis;
        this.noAuto = noAuto;
        this.timing = timing;
        this.externalHost = process.env.DOCKERHOST;
        this.internalHost = process.env.DOCKERHOST;
        this.connectionReady = false;
        this.gotResponse = false;
        this.connectionId = null;
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

    handle_connections(message, self) {
        console.log("--> In handle_connections, self.connection_id = ", self.connectionId, "message connection id = ", message["connection_id"])
        console.log("message = ", message)
        if (message["connection_id"] === self.connectionId) {
            if (message["state"] === "active" || message["state"] === "response") {
                console.log("Connected!");
                self.setConnectionReady(true);
            }
        }
    }

    async detect_connection() {
        await this.operation()
    }
}

async function main(start_port, no_auto = false, show_timing = false) {
    console.log("Running the faber agent...");

    const genesis = await agent.default_genesis_txns();
    if (!genesis) {
        console.log("Error retrieving ledger genesis transactions")
        process.exit(1);
    }
    // utils.logDebug(genesis);

    utils.logTrace(genesis);

    console.log("#1 Provision an agent and wallet, get back configuration details");

    let faber = new FaberAgent(
        start_port,
        start_port + 1,
        genesis,
        no_auto,
        show_timing,
    )
    await faber.listen_webhooks(start_port + 2)

    var start = new Date();

    await faber.start_process();
    await faber.startupComplete();

    console.log(colors.magenta("Admin url is at: " + faber.adminUrl));
    console.log(colors.magenta("Endpoint url is at: " + faber.endpoint));

    var end = (new Date() - start) / 1000;
    // console.info('Execution time: %dms', end)

    console.log(colors.magenta("Startup duration:" + end));

    // await faber.register_schema_and_creddef(
    //     "degree schema",
    //     "1.0.0",
    //     ["name", "date", "degree", "age", "timestamp"],
    //     true,
    // );


    console.log("#7 Create a connection to alice and print out the invite details");

    let connection = await faber.admin_POST("/connections/create-invitation", null);

    console.log(connection.data);

    faber.connectionId = connection.data["connection_id"]
    utils.logDebug("connection id = ", faber.connectionId)

    utils.logInfo("Use the following JSON to accept the invite from another demo agent.")
    utils.logInfo("Or use the QR code to connect from a mobile agent.")

    const text = connection.data["invitation_url"]

    console.log("invitation text = ", text)

    QRCode.generate(text, { small: true });

    utils.logInfo("Waiting for connection...")
    await faber.detect_connection()
}
utils.setLogLevel(DEBUG);
main(8020);