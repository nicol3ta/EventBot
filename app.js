var builder = require('botbuilder');
var restify = require('restify');
var assert = require('assert'); 


var authorization = 'https://secure.meetup.com/oauth2/authorize';
var accessTokens = 'https://secure.meetup.com/oauth2/access'; 


// OAuth2 variables for authenticating with the Meetup API

// URL for requesting authorisation
var redirectUri = 'https://secure.meetup.com/oauth2/authorize?client_id=ofgbuddccntus3nqm7mkrlrfi3&response_type=code&redirect_uri=';
//https://eventbot.azurewebsites.net/api/oauthcallback

// URL for requesting access token
var address = 'https://secure.meetup.com/oauth2/access';

var oauth_token;
var refresh_token;

// City where the user attends meetups
var city;


//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

 
  
// Create chat bot
// appId & appPassword settings are generally required and will be generated when registering your bot in the developer portal
// Retrieve appId & appPassword settings from environment variables. This sets up the bot to support storing these values in a config file when deployed to a hosting service like Microsoft Azure
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
// Handle Bot Framework messages
server.post('/api/messages', connector.listen());

// Serve a static web page

server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'

}));

// Create oauth callback endpoint
server.get("/api/oauthcallback", function (req, res, next) {  

code = req.query.code;
res.send(200, "You can now return to the Meetup Guru bot ;)" ); 


var client = restify.createStringClient({
    url : 'https://secure.meetup.com'
});

var body = {
    client_id: 'ofgbuddccntus3nqm7mkrlrfi3',
    client_secret: 'i9m1hgmfif5nhvtkr0vurkdaq3', 
    grant_type: 'authorization_code', 
    redirect_uri: 'http://localhost:3978/api/oauthcallback', 
    code: code
};

client.post('/oauth2/access', body, function(err, req, res, data) {

    if (err) {
        console.log('ERROR! :(');
        console.log(err);
    } else {
        console.log('YAY!');
        console.log(data);
        var result = JSON.parse(data);
        console.log(result.access_token);

        oauth_token = result.access_token;
    
    refresh_token = result.refresh_token;
    console.log("I set the token to: " + oauth_token);
    }



});

}); 


//=========================================================
// Bots Dialogs
//=========================================================

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Bot.
var model = 'https://api.projectoxford.ai/luis/v1/application?id=8b82365c-bc74-4574-aed1-2107cffa24cb&subscription-key=245e66e437d6484d9bb1a0c6f706fb89';

var recognizer = new builder.LuisRecognizer(model);
var intents = new builder.IntentDialog({ recognizers: [recognizer] });

// When the framework receives a message from the user it will be routed to this root ‘/’ dialog for processing
bot.dialog('/', intents);


// Install First Run middleware and dialog 
 bot.use(builder.Middleware.firstRun({ version: 1.0, dialogId: '*:/firstRun' })); 
 bot.dialog('/firstRun', [ 
     function (session) { 
         if (!session.userData.city) {
            builder.Prompts.text(session, "Hey there, in which city do you need informations about Meetups?" ); 
         }
         else{ 
             builder.Prompts.text(session, "Hey there!" ); 
            }
     }, 
     function (session, results) { 
         // We'll save the users name and send them an initial greeting. All  
         // future messages from the user will be routed to the root dialog. 
         session.userData.city = results.response; 
         city= session.userData.city;
         session.send("Nice, %s is a cool city ;)", session.userData.city); 
         if(!oauth_token){
            var clientAddress = JSON.stringify(session.message.address);  
            console.log(" " + clientAddress);
            session.endDialog("You can ask me anything regarding meetups. \n But first please sign in: %s"  + clientAddress +"  URI: " , redirectUri+""+clientAddress); 
         }
         else{
             session.endDialog("You can ask me anything regarding meetups."); 
         }
     }
 ]); 



// Add intent handlers
intents.matches('welcome', [
    function (session) { 
         if (!session.userData.city) {
            builder.Prompts.text(session, "Hey there, in which city do you need informations about Meetups?" ); 
         }
         else{ 
             builder.Prompts.text(session, "Hey there!" ); 
            }
     }, 
     function (session, results) { 
         // We'll save the users name and send them an initial greeting. All  
         // future messages from the user will be routed to the root dialog. 
         session.userData.city = results.response; 
         city= session.userData.city;
         session.send("Nice, %s is a cool city ;)", session.userData.city); 
         if(!oauth_token){
              var clientAddress = JSON.stringify(session.message.address); 
            session.endDialog("You can ask me anything regarding meetups. \n But first please sign in: %s"  + clientAddress +"  URI: " , redirectUri+""+clientAddress);  
         }
         else{
             session.endDialog("You can ask me anything regarding meetups."); 
         }
     }
]);


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

intents.matches('getLocation', [
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
            // Search date for this event 
            session.send("Searching for the location of the next " + results.response + " meetup");
            getMeetupLocation(results.response, function(d){ if(d.toString()) session.send(d.toString()); else session.send("I'm sorry, I could not find any event called " + results.response + ".")  });
                      
        } else {
            session.send("Ok");
        }
    }
]);

intents.onDefault(builder.DialogAction.send("I'm sorry I didn't understand. I can only look for meetup events."));




//Get the date of a meetup 
function getMeetupDate(name, callback){


var client = restify.createStringClient({
    url : 'https://api.meetup.com'
});

var d = "";

client.get('/2/open_events/?access_token='+oauth_token+'&sign=true&photo-host=public&country=de&category=34&text='+name+'&city='+city+'&page=20', function(err, req, res, obj) {
    assert.ifError(err);
    console.log("hmm");
    console.log("we got smth :" + obj);
    var events = JSON.parse(obj);
    
        for (i = 0; i < events.results.length; i++) {

        if(events.results[i].group.name.toLowerCase().includes(name.toLowerCase())) {
             d = new Date(events.results[i].time); // Set the date to the epoch             
         }
            
        }
        callback(d);
    
});


}

//get the location of a meetup 
function getMeetupLocation(name, callback){


var client = restify.createStringClient({
    url : 'https://api.meetup.com'
});

var l = "";

client.get('/2/open_events/?access_token='+oauth_token+'&sign=true&photo-host=public&country=de&category=34&text='+name+'&city='+city+'&page=20', function(err, req, res, obj) {
    assert.ifError(err);
    console.log("hmm");
    console.log("we got smth :" + obj);
    var events = JSON.parse(obj);
    
        for (i = 0; i < events.results.length; i++) {

        if(events.results[i].group.name.toLowerCase().includes(name.toLowerCase())) {
             l = events.results[i].venue.address_1; //location of the venue          
         }           
        }
        callback(l);
    
});

}
