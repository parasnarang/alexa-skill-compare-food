'use strict';
let http = require('http');


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
    const cardTitle = 'Welcome to Compare Food';
    const cardOutput = 'Please tell me which foods do you want to compare.';
    const speechOutput = 'Welcome to Compare Food. ' +
        'Please tell me which foods you want to compare.';

		// If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Which food do you want to compare? Say like tomato and potato';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, cardOutput, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Bye!';
    const speechOutput = 'Thank you for trying Compare Food. Have a nice day!';

    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, speechOutput, null, shouldEndSession));
}

/**
 * Compare two food items based on nutrition
 */
function compareFoods(intent, session, callback) {
    let food1 = intent.slots.foodone.value;
    let food2 = intent.slots.foodtwo.value;
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let cardOutput = '';
    let speechOutput = '';

    console.log(`FOOD 1: ${food1}`);
    console.log(`FOOD 2: ${food2}`);
    if (food1 && food2) {
        const url1 = 'http://indianfoodfacts-api.herokuapp.com/api/food/' + food1;
        console.log(`URL: ${url1}`);

        const url2 = 'http://indianfoodfacts-api.herokuapp.com/api/food/' + food2;
        console.log(`URL: ${url2}`);

        http.get(url1, function(res) {
            res.on('data', function (body1) {
                body1 = JSON.parse(body1);
                console.log('BODY 1: ' + body1);

                http.get(url2, function(res) {
                    res.on('data', function (body2) {
                        body2 = JSON.parse(body2);
                        console.log('BODY 2: ' + body2);
    
                        if(body1.name && body2.name) {
                            console.log('Response from CompareFood 1: ' + body1.carbInGm);
                            console.log('Response from CompareFood 2: ' + body2.carbInGm);
                            
                            let body1MoreProtein = Number(body1.proteinInGm) > Number(body2.proteinInGm);
                            let body1MoreFat = Number(body1.fatInGm) > Number(body2.fatInGm);
                            let body1MoreCarb = Number(body1.carbInGm) > Number(body2.carbInGm);
                            console.log('P: ', body1MoreProtein)
                            console.log('F: ', body1MoreFat)
                            console.log('C: ', body1MoreCarb)
                            
                            let proteinMsg = '';
                            if(body1MoreProtein || body1MoreFat || body1MoreCarb) {
                                if(body1MoreProtein && body1MoreFat && body1MoreCarb) {
                                    proteinMsg = `${food1} is better than ${food2} in all respect`;
                                } else if(body1MoreProtein && body1MoreFat) {
                                    proteinMsg = `${food1} has more protein and fat than ${food2}`;
                                } else if(body1MoreProtein && body1MoreCarb) {
                                    proteinMsg = `${food1} has more protein and carbs than ${food2}`;
                                } else if(body1MoreCarb && body1MoreFat) {
                                    proteinMsg = `${food1} has more carbs and fat than ${food2}`;
                                } else if(body1MoreProtein) {
                                    proteinMsg = `${food1} has more protein than ${food2}`;
                                } else if(body1MoreFat) {
                                    proteinMsg = `${food1} has more fat than ${food2}`;
                                } else if(body1MoreCarb) {
                                    proteinMsg = `${food1} has more carbs than ${food2}`;
                                }
                            } else {
                                proteinMsg = `${food2} is better than ${food1} in all respect`
                            }

                            cardOutput = proteinMsg;
                            speechOutput = proteinMsg;
                        } else {
                            console.log('Response from CompareFood: Food details not found');
                            speechOutput = `Nutrition facts of "${food1}" and "${food2}" are not found. Please try some other food.`;
                            cardOutput = speechOutput;
                        }
                        shouldEndSession = true;
        
                        callback(sessionAttributes,
                            buildSpeechletResponse(`${food1} vs ${food2}`, cardOutput, speechOutput, repromptText, shouldEndSession));
                    });
        
                }).on('error', function(e) {
                    speechOutput = `We could not connect to the remote server to get data about "${food2}". Sorry!`;
                    cardOutput = speechOutput;
                    console.log("Got error: " + e.message);
        
                    callback(sessionAttributes,
                        buildSpeechletResponse("Error connecting to Indian Food server", cardOutput, speechOutput, repromptText, shouldEndSession));
                });
    
            });

        }).on('error', function(e) {
            speechOutput = `We could not connect to the remote server to get data about "${food1}". Sorry!`;
            cardOutput = speechOutput;
            console.log("Got error: " + e.message);

            callback(sessionAttributes,
                buildSpeechletResponse("Error connecting to Indian Food server", cardOutput, speechOutput, repromptText, shouldEndSession));
        });


    } else {
        speechOutput = "I'm not sure which food items you want to compare";
        cardOutput = speechOutput;

        callback(sessionAttributes,
            buildSpeechletResponse('Food name not recognised', cardOutput, speechOutput, repromptText, shouldEndSession));    }
}


/**
 * Compare any two food items
 */
function compareAnyTwoFoods(intent, session, callback) {
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let cardOutput = '';
    let speechOutput = '';

        const url1 = 'http://indianfoodfacts-api.herokuapp.com/api/anyfood';
        console.log(`URL: ${url1}`);

        const url2 = 'http://indianfoodfacts-api.herokuapp.com/api/anyfood';
        console.log(`URL: ${url2}`);

        http.get(url1, function(res) {
            res.on('data', function (body1) {
                body1 = JSON.parse(body1);
                console.log('BODY 1: ' + body1);

                http.get(url2, function(res) {
                    res.on('data', function (body2) {
                        body2 = JSON.parse(body2);
                        console.log('BODY 2: ' + body2);
    
                        let food1 = body1.name;
                        let food2 = body2.name;
                        if(body1.name && body2.name) {
                            console.log('Response from CompareFood 1: ' + body1.carbInGm);
                            console.log('Response from CompareFood 2: ' + body2.carbInGm);
                            
                            let body1MoreProtein = Number(body1.proteinInGm) > Number(body2.proteinInGm);
                            let body1MoreFat = Number(body1.fatInGm) > Number(body2.fatInGm);
                            let body1MoreCarb = Number(body1.carbInGm) > Number(body2.carbInGm);
                            console.log('P: ', body1MoreProtein)
                            console.log('F: ', body1MoreFat)
                            console.log('C: ', body1MoreCarb)
                            
                            let proteinMsg = '';
                            if(body1MoreProtein || body1MoreFat || body1MoreCarb) {
                                if(body1MoreProtein && body1MoreFat && body1MoreCarb) {
                                    proteinMsg = `${food1} is better than ${food2} in all respect`;
                                } else if(body1MoreProtein && body1MoreFat) {
                                    proteinMsg = `${food1} has more protein and fat than ${food2}`;
                                } else if(body1MoreProtein && body1MoreCarb) {
                                    proteinMsg = `${food1} has more protein and carbs than ${food2}`;
                                } else if(body1MoreCarb && body1MoreFat) {
                                    proteinMsg = `${food1} has more carbs and fat than ${food2}`;
                                } else if(body1MoreProtein) {
                                    proteinMsg = `${food1} has more protein than ${food2}`;
                                } else if(body1MoreFat) {
                                    proteinMsg = `${food1} has more fat than ${food2}`;
                                } else if(body1MoreCarb) {
                                    proteinMsg = `${food1} has more carbs than ${food2}`;
                                }
                            } else {
                                proteinMsg = `${food2} is better than ${food1} in all respect`
                            }

                            cardOutput = proteinMsg;
                            speechOutput = proteinMsg;
                        } else {
                            console.log('Response from CompareFood: Food details not found');
                            speechOutput = `Nutrition facts of "${food1}" and "${food2}" are not found. Please try some other food.`;
                            cardOutput = speechOutput;
                        }
                        shouldEndSession = true;
        
                        callback(sessionAttributes,
                            buildSpeechletResponse(`${food1} vs ${food2}`, cardOutput, speechOutput, repromptText, shouldEndSession));
                    });
        
                }).on('error', function(e) {
                    speechOutput = `We could not connect to the remote server to get data. Sorry!`;
                    cardOutput = speechOutput;
                    console.log("Got error: " + e.message);
        
                    callback(sessionAttributes,
                        buildSpeechletResponse("Error connecting to Indian Food server", cardOutput, speechOutput, repromptText, shouldEndSession));
                });
    
            });

        }).on('error', function(e) {
            speechOutput = `We could not connect to the remote server to get data. Sorry!`;
            cardOutput = speechOutput;
            console.log("Got error: " + e.message);

            callback(sessionAttributes,
                buildSpeechletResponse("Error connecting to Indian Food server", cardOutput, speechOutput, repromptText, shouldEndSession));
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
    if (intentName === 'CompareFood') {
        compareFoods(intent, session, callback);
    } else if (intentName === 'CompareAnyFood') {
        compareAnyTwoFoods(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
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
