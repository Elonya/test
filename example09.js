var http = require("http").createServer(handler); 
var io = require("socket.io").listen(http); 
var fs = require("fs"); 
var firmata = require("firmata");


var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    console.log("Activation of Pin 13");
    board.pinMode(13, board.MODES.OUTPUT); 
    console.log("Enabling Push Button on pin 2");
    board.pinMode(2, board.MODES.INPUT);
});

function handler(req, res) {
    fs.readFile(__dirname + "/example09.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    })
}



http.listen(8080); 


var sendValueViaSocket = function(){}; 


board.on("ready", function(){


io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, board OK");
    
    
clientIpAddress = socket.request.socket.remoteAddress;
    socket.emit("messageToClient", "socket.request.socket.remoteAddress: " + socket.request.socket.remoteAddress);
   
    var idx = clientIpAddress.lastIndexOf(':');
    var address4;
    if (~idx && ~clientIpAddress.indexOf('.')) address4 = clientIpAddress.slice(idx + 1);
    io.sockets.emit("messageToClient", "ipv4 address: " + socket.request.socket.remoteAddress);
    socket.emit("messageToClient", "socket.request.connection._peername.family: " + socket.request.connection._peername.family);
    socket.emit("messageToClient", "socket.request.connection._peername.port: " + socket.request.connection._peername.port);
    socket.emit("messageToClient", "socket.id: " + socket.id);
    
    sendValueViaSocket = function (value) {
        io.sockets.emit("messageToClient", value);
    }
    
}); 

var timeout = false;
var sensitivity = 50;
var last_sent = null;
var last_value = null;

board.digitalRead(2, function(value) { 
    if (timeout !== false) { 
	   clearTimeout(timeout); 
    }
    timeout = setTimeout(function() { 
        console.log("Timeout set to false");
        timeout = false;
        if (last_value != last_sent) { 
        	if (value == 0) {
                console.log("LED OFF");
                board.digitalWrite(13, board.LOW);
                console.log("value = 0, LED OFF");
            }
            else if (value == 1) {
                console.log("LED ON");
                board.digitalWrite(13, board.HIGH);
                console.log("value = 1, LED lit");
            }
            sendValueViaSocket("Value = " + value);
        }

        last_sent = last_value;
    }, 50); 
                
    last_value = value; 

}); 

}); 
