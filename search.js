var _meetup = require('meetup-api')({ 
     key: '765a70243d32a7f6562451810203074' 
 }); 


/*
var name = 'Creative Coding';
_meetup.getOpenEvents({
    'country' : 'de',
    'city': 'München',
    'text' : name,
    'category' : '34'
}, function(error, event) {
    if (error) {
        console.log(error);
    } else {
        for (i = 0; i < event.results.length; i++) {
 		if(name == event.results[i].group.name) {
             var d = new Date(event.results[i].time); // Set the date to the epoch
             console.log(d); 
         }
        }

}
})

*/

var name = 'Creative Coding';

function getMeetupDate(name, callback){


_meetup.getOpenEvents({
    'country' : 'de',
    'city': 'München',
    'text' : name,
    'category' : '34'
}, function(error, event) {
    if (error) {
        console.log("lol");
    } else {
        for (i = 0; i < event.results.length; i++) {
 		if(name == event.results[i].group.name) {
             var d = new Date(event.results[i].time); // Set the date to the epoch
             
             //console.log(meetupDate); 
         }
         else{
             d="";
             
         }
        
        }
         callback(d);

}
})

}

getMeetupDate(name, function(d){
  var resp = d.toString();
  if(resp == "") {
      console.log("Not found");
  }
  else{console.log("lol");}
   
  
});


/** 
_meetup.getOpenEvents({
    'country' : 'de',
    'city': 'München',
    'text' : 'creative',
    'category' : '34'
}).then(result => {
    var searchResult = JSON.parse(result.text);
    console.log(searchResult[0]);
})

*/

/**
_meetup.getEvent({
    'urlname': 'NodeJS-Argentina'
    ,'id': '79797122'
}, function(error, event) {
    if (error) {
        console.log(error);
    } else {
        console.log(event);
    }
});


*/
//_meetup.getCities({
//	lat: -34.603722,
//	lon: -58.381592,
//	country: 'AR'
//}, function (err, results) {
//    console.log(results);
//});