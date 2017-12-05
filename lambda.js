'use strict';
let http = require('https');


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, cardOutput, speechOutput, repromptText, shouldEndSession) {
    let response = {
        outputSpeech: {
            type: 'PlainText',
            text: speechOutput,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${cardOutput}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
    console.log('Final response : ', response);
    return response;
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome!';
    const cardOutput = 'Welcome to Cryptocurrency To Rupees. You can ask me for the latest price of Ethereum in Indian Rupees.';
    const speechOutput = 'Welcome to Cryptocurrency To Rupees. You can ask me for the latest price of Ethereum in Indian Rupees.';

        // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Ask me for the latest price of Ethereum.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, cardOutput, speechOutput, repromptText, shouldEndSession));
}

function getHelpResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome!';
    const cardOutput = 'Ask me for the latest price of Ethereum in Indian Rupees.';
    const speechOutput = 'Ask me for the latest price of Ethereum in Indian Rupees.';

        // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Ask me for the latest price of Ethereum.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, cardOutput, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Bye!';
    const speechOutput = 'Thank you for trying Cryptocurrency To Rupees. Have a nice day!';

    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, speechOutput, null, shouldEndSession));
}


/**
 * Get cryptocurrency price
 */
function getPrice(intent, session, callback) {
    const repromptText = 'Would you like to check the price again ?';
    const sessionAttributes = {};
    let shouldEndSession = false;
    let cardOutput = '';
    let speechOutput = '';

        const url1 = 'https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=INR';
        console.log(`URL: ${url1}`);

        http.get(url1, function(res) {
            res.on('data', function (body1) {
                let response = '';
                let askPrice = '';
                console.log(`Raw BODY: ${body1}`);
                body1 = JSON.parse(body1);
                console.log('BODY 1: ' + body1);
                askPrice = body1[0].price_inr;
                console.log('BODY 1 ask: ' + askPrice);
                response = `Current price for Ethereum in INR is Rupees ${askPrice}`;
                cardOutput = response;
                speechOutput = response;
                // this.emit(':tellWithCard', speechOutput, "Cryptocurrency Rupee", cardOutput);
                shouldEndSession = true;
                callback(sessionAttributes,
                            buildSpeechletResponse(`Cryptocurrency to Rupees`, cardOutput, speechOutput, repromptText, shouldEndSession));
            });
        
        }).on('error', function(e) {
                speechOutput = `We could not connect to the remote server to get data. Sorry!`;
                cardOutput = speechOutput;
                console.log("Got error: " + e.message);
    
                // this.emit(':tellWithCard', speechOutput, this.t('SKILL_NAME'), cardOutput);
                // this.emit(':tell', speechOutput);
                callback(sessionAttributes,
                buildSpeechletResponse("Error connecting to server", cardOutput, speechOutput, repromptText, shouldEndSession));
        });
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    console.log(`Intent name: ${intentName}`);
    // Dispatch to your skill's intent handlers
    if (intentName === 'GetPrice') {
        getPrice(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getHelpResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
