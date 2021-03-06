var http = require("http").createServer(handler); 
var io = require("socket.io").listen(http); 
var fs = require("fs"); 
var firmata = require("firmata");


console.log("Starting the code");



var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    console.log("Connecting to Arduino");
    board.pinMode(0, board.MODES.ANALOG); 
    board.pinMode(1, board.MODES.ANALOG); 
    board.pinMode(9, board.MODES.OUTPUT); 
    board.pinMode(3, board.MODES.PWM); 
    
    
});


function handler(req, res) {
    fs.readFile(__dirname + "/example15.html",
    function (err, data) {
        if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            return res.end("Error loading html page.");
        }
    res.writeHead(200);
    res.end(data);
    })
}

var desiredValue = 0;
var actualValue = 0; 

var Kp = 0.55; // proportional factor
var Ki = 0.008; // integral factor
var Kd = 0.15; // differential factor

var factor = 0.1;
var pwm = 0;
var pwmLimit = 254;

var err = 0; // variable for second pid implementation
var errSum = 0; // sum of errors
var dErr = 0; // difference of error
var lastErr = 0; // to keep the value of previous error


var controlAlgorithmStartedFlag = 0; // variable for indicating weather the Alg has benn sta.
var intervalCtrl; // var for setInterval in global scope 

http.listen(8080); 

var sendValueViaSocket = function(){}; 

board.on("ready", function(){
    
board.analogRead(0, function(value){
    desiredValue = value; 
});

board.analogRead(1, function(value){
    actualValue = value; 
});

io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, board OK");

    setInterval(sendValues, 40, socket); 
    
    socket.on("startControlAlgorithm", function(){
       startControlAlgorithm(); 
    });
    
    socket.on("stopControlAlgorithm", function(){
       stopControlAlgorithm(); 
    });
    
}); 

}); 

function controlAlgorithm () {
    err = desiredValue - actualValue; // error as difference between desired and actual val.
    errSum += err; // sum of errors | like integral
    dErr = err - lastErr; // difference of error
    pwm = Kp*err+Ki*errSum+Kd*dErr; // PID expression
    lastErr = err; // save the value of error for next cycle to estimate the derivative
    if (pwm > pwmLimit) {pwm =  pwmLimit}; // to limit pwm values
    if (pwm < -pwmLimit) {pwm = -pwmLimit}; // to limit pwm values
    if (pwm > 0) {board.digitalWrite(9,1)}; 
    if (pwm < 0) {board.digitalWrite(9,0)}; 
    board.analogWrite(3, Math.abs(pwm));
};

function startControlAlgorithm () {
    if (controlAlgorithmStartedFlag == 0) {
        controlAlgorithmStartedFlag = 1;
        intervalCtrl = setInterval(function(){controlAlgorithm();}, 30); 
        console.log("Control algorithm has been started.");        
    }

};

function stopControlAlgorithm () {
    clearInterval(intervalCtrl); 
    board.analogWrite(3, 0);
    controlAlgorithmStartedFlag = 0;
    console.log("Control algorithm has been stopped.");
};

function sendValues (socket) {
    socket.emit("clientReadValues",
    {
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm": pwm
    });
};
