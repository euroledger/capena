const agent = require('./support/agent');
const { DemoAgent } = require('./support/agent');
const utils = require('./support/utils');
// const colors = require("colors/safe");

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
    
    handle_connections(self, message) {
        if (message["connection_id"] === self.connection_id) {
            if(message["state"] ===  "active" || message["state"] === "response") {
                console.log("Connected!"); 
                self.setConnectionReady(true);    
            }
        }
    }
}

async function main(start_port, no_auto = false, show_timing = false) {
    console.log("Running the faber agent...");

    const genesis = await agent.default_genesis_txns();
    if (!genesis) {
        console.log("Error retrieving ledger genesis transactions")
        process.exit(1);
    }
    utils.logDebug(genesis);

    // utils.logTrace(genesis);

    // console.log("#7 Provision an agent and wallet, get back configuration details");

    // let alice = new AliceAgent(
    //     start_port,
    //     start_port + 1,
    //     genesis,
    //     no_auto,
    //     show_timing,
    // )
    // await alice.listen_webhooks(start_port + 2)

    // // console.time("Startup duration:");
    // var start = new Date();

    // await alice.start_process();
    // await alice.startupComplete();

    // console.log(colors.magenta("Admin url is at: " + alice.adminUrl));
    // console.log(colors.magenta("Endpoint url is at: " + alice.endpoint));


    // var end = (new Date() - start) / 1000;
    // // console.info('Execution time: %dms', end)

    // console.log(colors.magenta("Startup duration:" + end));

    // console.log("#9 Input faber invitation details");

    // await alice.input_invitation();

    // let choice;
    // while (true) {
    //     choice = await alice.prompt_loop();
    //     if (choice === '3') {
    //         // send a message to faber
    //         await alice.send_message();
    //     } else if (choice === '4') {
    //         // handle new invitation
    //         await alice.input_invitation();
    //     } else if (choice === 'X') {
    //         // terminate...
    //         break;
    //     } else {
    //         console.log("Invalid choice");
    //     }
    // }
    // try {
    //     await alice.terminate_process();
    //     utils.logInfo("Shutting down...");
    //     process.exit(0);
    // }
    // catch (error) {
    //     utils.logError("Error terminating agent:", error);
    // }
}
utils.setLogLevel(DEBUG);
main(8030);