var http = require("http").createServer(handler); 
var io = require("socket.io").listen(http); 
var fs = require("fs"); 
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    console.log("Activation of Pin 13");
    board.pinMode(13, board.MODES.OUTPUT);
    
   console.log("Activation of Pin 8");
    board.pinMode(8, board.MODES.OUTPUT);
    
    console.log("Activation of Pin 4");
    board.pinMode(4, board.MODES.OUTPUT);
    
   console.log("Activation of Pin 2");
    board.pinMode(2, board.MODES.OUTPUT);
});

function handler(req, res) {
    fs.readFile(__dirname + "/assignment04.html",
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

 io.sockets.on("connection", function(socket) {
    socket.on("commandToArduino", function(commandNo){

        if (commandNo == 0) {
            board.digitalWrite(13, board.LOW); 
        }
        if (commandNo == "1") {
            board.digitalWrite(13, board.HIGH); 
        }

        if (commandNo == "2") {
            board.digitalWrite(8, board.LOW); 
        }
        if (commandNo == "3") {
            board.digitalWrite(8, board.HIGH); 
        }
        if (commandNo == "4") {
            board.digitalWrite(4, board.LOW); 
        }
        if (commandNo == "5") {
            board.digitalWrite(4, board.HIGH); 
        }
 
        if (commandNo == "6") {
            board.digitalWrite(2, board.LOW); 
        }
        if (commandNo == "7") {
            board.digitalWrite(2, board.HIGH); 
        }
        if (commandNo == "8") {
            board.digitalWrite(2, board.LOW); 
            board.digitalWrite(4, board.LOW);
            board.digitalWrite(8, board.LOW); 
            board.digitalWrite(13, board.LOW); 
                  
        }

        if (commandNo == "9") {
            board.digitalWrite(2, board.HIGH); 
            board.digitalWrite(4, board.HIGH);      
            board.digitalWrite(8, board.HIGH); 
            board.digitalWrite(13, board.HIGH); 
                  
        }
     }); 
});
