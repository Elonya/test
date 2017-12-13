var http = require("http").createServer(handler); 
var io = require("socket.io").listen(http); 
var fs = require("fs"); 
var firmata = require("firmata");


console.log("Starting the code");



var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    board.pinMode(2, board.MODES.OUTPUT); 
    board.pinMode(3, board.MODES.PWM); 
    board.pinMode(4, board.MODES.OUTPUT); 
    board.digitalWrite(2, 1); 
    board.digitalWrite(4, 0); 
});

function handler(req, res) {
    fs.readFile(__dirname + "/example12.html",
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
    
    socket.on("sendPWM", function(pwm){
       board.analogWrite(3, pwm);
       socket.emit("messageToClient", "PWM set to: " + pwm);
    });
    
    socket.on("left", function(value){
       board.digitalWrite(2, value.AIN1); 
       board.digitalWrite(4, value.AIN2); 
       socket.emit("messageToClient", "Direction; left");
    });
    
    socket.on("right", function(value){
       board.digitalWrite(2, value.AIN1); 
       board.digitalWrite(4, value.AIN2); 
       socket.emit("messageToClient", "Direction; right");
    });
    
    socket.on("stop", function(value){
        board.analogWrite(3, value);
       socket.emit("messageToClient", "STOP");
    });

}); 

}); 

