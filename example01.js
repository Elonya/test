var http = require("http");
var firmata = require("firmata");

var board = new firmata.Board("/dev/ttyACM0", function(){// ACM (Abstract Control Model) for serial communication with Arduino (could be USB)
    board.pinMode(13, board.MODES.OUTPUT); // Configures the specified pin to behave either as an input or an output.
});

http.createServer(function(req, res){ // http.createServer([requestListener]) | The requestListener is a function which is automatically added to the 'request' event.
    var parts = req.url.split("/"), // split request url on "/" character
    operator = parseInt(parts[1],10); // 10 is radix - decimal notation; the base in mathematical numeral systems (from 2 to 36)
        
    if (operator == 0) {
        board.digitalWrite(13, board.LOW);
    }
    else if (operator == 1) {
        board.digitalWrite(13, board.HIGH);
    }
        
    res.writeHead(200, {"Content-Type": "text/plain"});
    res.end("The value of operator: " + operator);
}).listen(8080, "192.168.1.102");
