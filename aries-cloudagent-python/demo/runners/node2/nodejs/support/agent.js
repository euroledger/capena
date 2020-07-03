const axios = require('axios')
const express = require('express');

const path = require('path');
const utils = require('./utils');

const app = express();
app.use(express.json());

const sleep = require('sleep');

const DEFAULT_BIN_PATH = "./bin";
const DEFAULT_PYTHON_PATH = ".";
const DEFAULT_EXTERNAL_HOST = "localhost";
const GENESIS_URL="https://raw.githubusercontent.com/sovrin-foundation/sovrin/master/sovrin/pool_transactions_sandbox_genesis"

// AGENT_ENDPOINT = "https://e65d41f9499a.ngrok.io"
AGENT_ENDPOINT=process.env.AGENT_ENDPOINT;


class DemoAgent {

    constructor(label, httpPort, adminPort, external_host, extraArgs) {
        this.httpPort = httpPort;
        this.label = label;
        this.adminPort = adminPort;
        this.walletType = "indy";
        let randNum = Math.round(Math.random() * (1000000 - 100000) + 100000);
        this.walletName = this.label.toLowerCase().replace(" ", "") + randNum;
        this.walletKey = this.label + randNum;

        // assumes always docker for now
        const externalHost = external_host ? external_host : process.env.DOCKERHOST;
        const internalHost = process.env.DOCKERHOST;
        this.endpoint = `http://${externalHost}:${httpPort}`;
        this.extraArgs = extraArgs;
        this.adminUrl = `http://${internalHost}:${adminPort}`;
        this.proc = null;
        this.processDetected = false;

        console.log(">>>>>>>> AGENT_ENDPOINT = ", AGENT_ENDPOINT)
        if (AGENT_ENDPOINT) {
            this.endpoint = AGENT_ENDPOINT
        }
    }


    async listen_webhooks(webhookPort) {
        this.webhookPort = webhookPort;

        this.webhookUrl = `http://${this.externalHost}:${webhookPort}/webhooks`;
        utils.logDebug("webhook url = " + this.webhookUrl);

        // Initialize webhooks 
        app.post("*", (req, res) => {
            const handle_webhook = { handle_connections: this.handle_connections, handle_basicmessages: this.basicmessages, handle_issue_credential: this.handle_issue_credential, handle_present_proof: this.handle_present_proof };
            utils.logDebug(">>>>>>>>>>>> GOT A WEBHOOK URL = " + req.url);
            // console.log(req.body);
            res.sendStatus(200);

            let tok = req.url.split("/");
            tok = tok[tok.length - 2];
            let name = `handle_${tok}`;

            handle_webhook[name](req.body, this);
        })

        app.listen(webhookPort, () => {
            utils.logInfo("app listening on " + webhookPort);
        });
    }
    get_agent_args() {

        let result = [
            "--endpoint", this.endpoint,
            "--label", this.label,
            "--auto-ping-connection",
            "--auto-respond-messages",
            "--inbound-transport", "http", "0.0.0.0", this.httpPort.toString(),
            "--outbound-transport", "http",
            "--admin", "0.0.0.0", this.adminPort.toString(),
            "--admin-insecure-mode",
            "--wallet-type", this.walletType,
            "--wallet-name", this.walletName,
            "--wallet-key", this.walletKey,
        ]
        if (this.genesisData) {
            result.push("--genesis-transactions", this.genesisData);
        }

        // if this.seed:
        //     result.append(("--seed", this.seed))
        // if this.storage_type:
        //     result.append(("--storage-type", this.storage_type))
        // if this.timing:
        //     result.append("--timing")
        // if this.timing_log:
        //     result.append(("--timing-log", this.timing_log))
        // if this.postgres:
        //     result.extend(
        //         [
        //             ("--wallet-storage-type", "postgres_storage"),
        //             ("--wallet-storage-config", json.dumps(this.postgres_config)),
        //             ("--wallet-storage-creds", json.dumps(this.postgres_creds)),
        //         ]
        //     )
        if (this.webhookUrl) {
            result.push("--webhook-url", this.webhookUrl)
        }

        // if this.trace_enabled:
        //     result.extend(
        //         [
        //             ("--trace",),
        //             ("--trace-target", this.trace_target),
        //             ("--trace-tag", this.trace_tag),
        //             ("--trace-label", this.label+".trace"),
        //         ]
        //     )

        if (this.extraArgs) {
            result.push(...this.extraArgs);
        }


        return result;
    }
    get_process_args(bin_path) {
        let cmdPath = "aca-py";
        let binPath = bin_path ? bin_path : DEFAULT_BIN_PATH;

        if (binPath) {
            cmdPath = path.join(binPath, cmdPath)
        }

        return [cmdPath, "start"].concat(this.get_agent_args());
    }

    async detect_process() {
        console.log("calling detect_process...adminUrl = ", this.adminUrl);

        let attempts = 0;
        let statusUrl = this.adminUrl + "/status"
        while (attempts < 200) {
            utils.logDebug("ATTEMPT: " + attempts + " WAITING FOR " + statusUrl);
            try {
                resp = await axios.get(statusUrl);
                if (resp.status == 200) {
                    await resp.data;
                    break;
                } else {
                    utils.logError("resp.status = ", resp.status);
                }
            } catch (error) {
                // console.error(error);
            }
            await sleep.sleep(2);
            attempts++;
        }
        this.processDetected = true;
    }

    async startupComplete() {
        await utils.until(_ => this.processDetected === true);
    }

    async terminate_process() {
        this.proc.kill('SIGINT');
    }

    async start_process(python_path, bin_path) {

        // collect all the args for the agent process
        let myEnv = process.env;
        // console.log("myEnv =", myEnv)
        let pythonPath = python_path ? python_path : DEFAULT_PYTHON_PATH;

        if (pythonPath) {
            myEnv["PYTHONPATH"] = pythonPath;
        }

        let agentArgs = this.get_process_args(bin_path);

        utils.logTrace("------------------------------ > agentArgs = ", agentArgs);

        // spawn an aca-py python subprocess with the given args
        const { spawn } = require('child_process');

        this.proc = spawn('python3', agentArgs);

        this.proc.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        this.proc.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        this.proc.on('exit', function (code, signal) {
            console.log('child process exited with ' +
                `code ${code} and signal ${signal}`);
        });
        await this.detect_process();
    }

    async admin_POST(path, data) {
        const url = this.adminUrl + path;
        utils.logDebug(`Controller POST ${url} request to Agent with data ${data}`);
        try {
            if (data === null) {
                resp = await axios.post(url);
            } else {
                resp = await axios.post(url, data);
            }
           
            utils.logDebug(`Response from POST ${path} received; status = ${resp.status}`);
            return resp;
        } catch (error) {
            utils.logError(`Error during POST ${path}: ${error}`);
            return null;
        }
    }

    async admin_GET(path) {
        const url = this.adminUrl + path;
        utils.logDebug(`Controller GET ${url} request to Agent`);
        try {
            resp = await axios.get(url);
            if (resp.status == 200) {
                let text = await resp.data;
                return text;
            } else {
                utils.logError("resp.status = ", resp.status);
            }
        } catch (error) {
            utils.logError(`Error during GET ${path}: ${error}`);
            return null;
        }
    }
}
const register_schema_and_creddef = async (schema_name, version, schema_attrs, support_revocation) => {
    // Before we can create a schema, accept the TAA 

    let taa = await self.admin_GET("/ledger/taa")

    taa_text = taa["result"]["taa_record"]["text"]

    taa_response_body = {
            "version": "2.0",
            "mechanism": "on_file",
            "text": taa_text
    }
    taa_resp = await self.admin_POST("/ledger/taa/accept", taa_response_body)

    console.log("taa_resp = ", taa_resp)

}
// const register_schema_and_creddef(
//     self, schema_name, version, schema_attrs, support_revocation: bool = False
// ):
//     # Before we can create a schema, accept the TAA
//     taa = await self.admin_GET("/ledger/taa")

//     taa_text = taa["result"]["taa_record"]["text"]

//     taa_response_body = {
//             "version": "2.0",
//             "mechanism": "on_file",
//             "text": taa_text
//     }
//     taa_resp = await self.admin_POST("/ledger/taa/accept", taa_response_body)

//     # Create a schema
//     schema_body = {
//         "schema_name": schema_name,
//         "schema_version": version,
//         "attributes": schema_attrs,
//     }
//     schema_response = await self.admin_POST("/schemas", schema_body)
//     # log_json(json.dumps(schema_response), label="Schema:")
//     schema_id = schema_response["schema_id"]
//     log_msg("Schema ID:", schema_id)

//     # Create a cred def for the schema
//     credential_definition_body = {
//         "schema_id": schema_id,
//         "support_revocation": support_revocation,
//     }
//     credential_definition_response = await self.admin_POST(
//         "/credential-definitions", credential_definition_body
//     )
//     credential_definition_id = credential_definition_response[
//         "credential_definition_id"
//     ]
//     log_msg("Cred def ID:", credential_definition_id)
//     return schema_id, credential_definition_id


const default_genesis_txns = async () => {
    const RUN_MODE = process.env.RUNMODE;
    // const GENESIS_URL = process.env.GENESIS_URL;
    const LEDGER_URL = process.env.LEDGER_URL;
    const GENESIS_FILE = process.env.GENESIS_FILE;

    let genesis;

    try {
        if (GENESIS_URL) {
            console.log("GENESIS_URL = ", GENESIS_URL)
            // async with ClientSession() as session:
            //     async with session.get(GENESIS_URL) as resp:
            //         genesis = await resp.text()
            try {
                resp = await axios.get(GENESIS_URL);
                genesis = resp.data;
            } catch (error) {
                utils.logError(error)
            }
        }
        else if (RUN_MODE === "docker") {
            const DEFAULT_EXTERNAL_HOST = process.env.DOCKERHOST;
            utils.logDebug("run mode is DOCKER: DEFAULT_EXTERNAL_HOST=", DEFAULT_EXTERNAL_HOST);

            try {
                resp = await axios.get(`http://${DEFAULT_EXTERNAL_HOST}:9000/genesis`);
                genesis = resp.data;
                utils.logDebug(genesis);
            } catch (error) {
                utils.logError(error)
            }
        }
        else if (GENESIS_FILE) {
            console.log("we have a genesis file: ", GENESIS_FILE)
            // with open(GENESIS_FILE, "r") as genesis_file:
            //     genesis = genesis_file.reard()
        }
        else {
            console.log("we have a local genesis file")
            // with open("local-genesis.txt", "r") as genesis_file:
            //     genesis = genesis_file.read()
        }
    }
    catch (err) {
        utils.logError("Error loading genesis transactions:", err.message)
    }
    return genesis;
}
module.exports = {
    default_genesis_txns: default_genesis_txns,
    DemoAgent: DemoAgent
}

