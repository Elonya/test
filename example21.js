var http = require("http").createServer(handler);  
var io = require("socket.io").listen(http); 
var fs = require("fs");  
var firmata = require("firmata");

console.log("Starting the code");

var board = new firmata.Board("/dev/ttyACM0", function(){
    console.log("Connecting to Arduino");
    board.pinMode(0, board.MODES.ANALOG);  
    board.pinMode(1, board.MODES.ANALOG); 
    board.pinMode(9, board.MODES.OUTPUT);  
    board.pinMode(3, board.MODES.PWM);  
   
});

function handler(req, res) {
    fs.readFile(__dirname + "/example21.html",
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

var Kp = 0.55;  
var Ki = 0.008;  
var Kd = 0.15;  

var factor = 0.3; 
var pwm = 0;  
var pwmLimit = 254;  

var err = 0;  
var errSum = 0;  
var dErr = 0;  
var lastErr = 0; 
var KpE = 0; // multiplication of Kp x error
var KiIedt = 0; // multiplication of Ki x integ. of error
var KdDe_dt = 0; // multiplication of Kd x differential of err. 


var errSumAbs = 0; // sum of absolute errors as performance measure


var controlAlgorithmStartedFlag = 0;  
var intervalCtrl;  


var intervalPulseFunction; // for setTimeout / setInterval
var performanceMeasure = 0;


var readAnalogPin0Flag = 1; // flag for reading the pin if the pot is driver


http.listen(8080);  

var sendValueViaSocket = function(){};  
var sendStaticMsgViaSocket = function(){}; 

board.on("ready", function(){
    
board.analogRead(0, function(value){
   if (readAnalogPin0Flag == 1) desiredValue = value; // continuous read of analog pin 0
});

board.analogRead(1, function(value){
    actualValue = value;  
});

io.sockets.on("connection", function(socket) {
    socket.emit("messageToClient", "Srv connected, board OK");
    socket.emit("staticMsgToClient", "Srv connected, board OK");
    

    setInterval(sendValues, 40, socket);  
    
    socket.on("startControlAlgorithm", function(numberOfControlAlgorithm){
       startControlAlgorithm(numberOfControlAlgorithm); 
    });

socket.on("sendPosition", function(position) {
       readAnalogPin0Flag = 0; // we don't read from the analog pin anymore, value comes from GUI
       desiredValue = position; // GUI takes control
       socket.emit("messageToClient", "Position set to: " + position)
   });

    socket.on("stopControlAlgorithm", function(){
       stopControlAlgorithm(); 
    });
    
    sendValueViaSocket = function (value) {
        io.sockets.emit("messageToClient", value);
    };
    
    sendStaticMsgViaSocket = function(value) {
        io.sockets.emit("staticMsgToClient", value);  
    };
    
});  

});  

function controlAlgorithm (parameters) {
    if (parameters.ctrlAlgNo == 1) {
        pwm = parameters.pCoeff*(desiredValue-actualValue);
        err = desiredValue-actualValue;
        errSumAbs += Math.abs(err);
        if (pwm > pwmLimit) {pwm =  pwmLimit};  
        if (pwm < -pwmLimit) {pwm = -pwmLimit};  
        if (pwm > 0) {board.digitalWrite(9,1)};  
        if (pwm < 0) {board.digitalWrite(9,0)};  
        board.analogWrite(3, Math.abs(pwm));
    }
    if (parameters.ctrlAlgNo == 2) {
        err = desiredValue - actualValue;  
        errSum += err;  
        errSumAbs += Math.abs(err);
        dErr = err - lastErr; 
// we will put parts of expression for pwm to
// global workspace
        KpE = parameters.Kp1*err;
        KiIedt = parameters.Ki1*errSum;
        KdDe_dt = parameters.Kd1*dErr;
        pwm = KpE + KiIedt + KdDe_dt; // we use above parts 
          
        lastErr = err;   
        if (pwm > pwmLimit) {pwm =  pwmLimit};  
        if (pwm < -pwmLimit) {pwm = -pwmLimit};  
        if (pwm > 0) {board.digitalWrite(9,1)}; 
        if (pwm < 0) {board.digitalWrite(9,0)}; 
        board.analogWrite(3, Math.abs(pwm));        
     }
    if (parameters.ctrlAlgNo == 3) {
        err = desiredValue - actualValue; 
        errSum += err; 
        errSumAbs += Math.abs(err);
        dErr = err - lastErr; 
// we will put parts of expression for pwm to
// global workspace
        KpE = parameters.Kp2*err;
        KiIedt = parameters.Ki2*errSum;
        KdDe_dt = parameters.Kd2*dErr;
        pwm = KpE + KiIedt + KdDe_dt; // we use above parts
        
        console.log(parameters.Kp2 + "|" + parameters.Ki2 + "|" + parameters.Kd2);
        lastErr = err; 
        if (pwm > pwmLimit) {pwm =  pwmLimit}; 
        if (pwm < -pwmLimit) {pwm = -pwmLimit}; 
        if (pwm > 0) {board.digitalWrite(9,1)};
        if (pwm < 0) {board.digitalWrite(9,0)};
        board.analogWrite(3, Math.abs(pwm));        
    }
    

};

function startControlAlgorithm (parameters) {
    if (controlAlgorithmStartedFlag == 0) {
        controlAlgorithmStartedFlag = 1;
        intervalCtrl = setInterval(function(){controlAlgorithm(parameters);}, 30); 
        console.log("Control algorithm has been started.");
        sendStaticMsgViaSocket("Control alg " + parameters.ctrlAlgNo + " started | " + json2txt(parameters));
    }

};

function stopControlAlgorithm () {
    clearInterval(intervalCtrl); 
    board.analogWrite(3, 0);
    err = 0; // error as difference between desired and actual val.
    errSum = 0; // sum of errors | like integral
    dErr = 0;
    lastErr = 0; // difference
    pwm = 0;
    errSumAbs = 0;





    controlAlgorithmStartedFlag = 0;
    console.log("Control algorithm has been stopped.");
    sendStaticMsgViaSocket("Stopped.")
};

function sendValues (socket) {
    socket.emit("clientReadValues",
    {
    "desiredValue": desiredValue,
    "actualValue": actualValue,
    "pwm": pwm,
    "err": err,
    "errSum": errSum,
    "dErr": dErr,
    "KpE": KpE,
    "KiIedt": KiIedt,
    "KdDe_dt": KdDe_dt,
    "errSumAbs": errSumAbs
    });
};

function json2txt(obj) 
{
  var txt = '';
  var recurse = function(_obj) {
    if ('object' != typeof(_obj)) {
      txt += ' = ' + _obj + '\n';
    }
    else {
      for (var key in _obj) {
        if (_obj.hasOwnProperty(key)) {
          txt += '.' + key;
          recurse(_obj[key]);
        } 
      }
    }
  };
  recurse(obj);
  return txt;
}
