// Include prompt module.
var prompt = require('prompt');
var colors = require("colors/safe");

// const SimpleNodeLogger = require('simple-node-logger');

const opts = {
    timestampFormat: 'YYYY-MM-DD HH:mm:ss'
}

// const log = SimpleNodeLogger.createSimpleLogger(opts);

const log = require('simple-node-logger').createSimpleLogger(opts);

const setLogLevel = (level) => {
    log.setLevel(level);
}

const logError = (msg) => {
    log.error(colors.red(msg));
}

const logWarn = (msg) => {
    log.warn(colors.blue(msg));
}

const logInfo = (msg) => {
    log.info(colors.green(msg));
}

const logDebug = (msg) => {
    log.debug(msg);
}

const logTrace = (msg) => {
    log.trace(msg);
}

// Start the prompt to read user input.
prompt.start();

// Prompt and get user input
const user_prompt = (callback, prompt_attributes) => {
    prompt.message = "";
    prompt_attributes[0].description = colors.green(prompt_attributes[0].description);

    prompt.get(prompt_attributes, callback);
}

const user_prompt2 = (callback, prompt_attributes) => {
    prompt.message = "WANKING";
    console.log("prompt attributes = ", prompt_attributes);
    prompt_attributes[0].description = colors.blue(prompt_attributes[0].description);

    prompt.get(prompt_attributes, callback);
}

// resolve and return a promise once the condition evaluates to true
const until = (conditionFunction) => {
    const poll = resolve => {
        if (conditionFunction()) {
            resolve();
        }
        else {
            setTimeout(_ => poll(resolve), 1000);
        }
    }
    return new Promise(poll);
}

module.exports = {
    user_prompt: user_prompt,
    user_prompt2: user_prompt2,
    until: until,
    setLogLevel: setLogLevel,
    logError: logError,
    logWarn: logWarn,
    logInfo: logInfo,
    logDebug: logDebug,
    logTrace: logTrace,
}


