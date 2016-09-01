var builder = require('botbuilder');
var restify = require('restify');
var _meetup = require('meetup-api')({ 
     key: '765a70243d32a7f6562451810203074' 
 }); 

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());




//=========================================================
// Bots Dialogs
//=========================================================

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our  Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=8b82365c-bc74-4574-aed1-2107cffa24cb&subscription-key=245e66e437d6484d9bb1a0c6f706fb89';

var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', intents);


// Install First Run middleware and dialog 
 bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '*:/firstRun' })); 
 bot.dialog('/firstRun', [ 
     function (session) { 
         builder.Prompts.text(session, "Hello... What's your name?"); 
     }, 
     function (session, results) { 
         // We'll save the users name and send them an initial greeting. All  
         // future messages from the user will be routed to the root dialog. 
         session.userData.name = results.response; 
         session.endDialog("Hi %s, you can ask ask me anything regarding meetups.", session.userData.name);  
     } 
 ]); 




// Add intent handlers
intents.matches('getDate', [
    function (session, args, next) {
        var eventName = builder.EntityRecognizer.findEntity(args.entities, 'EventName');
        if (!eventName) {
            builder.Prompts.text(session, "What's the meetup called?");
        } else {
            next({ response: eventName.entity });
        }
    },
    function (session, results) {
        if (results.response) {
            // search date for this event 
            session.send("Looking for the date of the next " + results.response + " meetup");
            getMeetupDate(results.response, function(d){ if(d.toString()) session.send(d.toString()); else session.send("I'm sorry, I could not find any event called " + results.response + ".")  });
                      
        } else {
            session.send("Ok");
        }
    }
]);

intents.matches('getLocation', builder.DialogAction.send('Searching for location'));
intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand. I can only look for meetup events."));



//get the date of a meetup 
function getMeetupDate(name, callback){

var meetupDate;

_meetup.getOpenEvents({
    'country' : 'de',
    'city': 'München',
    'text' : name,
    'category' : '34'
}, function(error, event) {
    if (error) {
        callback(d);
    } else {
        var d = "";
        for (i = 0; i < event.results.length; i++) {

        if(event.results[i].group.name.toLowerCase().includes(name.toLowerCase())) {
             d = new Date(event.results[i].time); // Set the date to the epoch             
         }
            
        }
        callback(d);

}
})

}