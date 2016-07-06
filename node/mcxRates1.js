net = require('net')
var conn = initializeMySql();
if(!conn)
	return;
var hostCount = 0;
var sockets = [];
setInterval(initializeBroadcast, 2000);


var s = net.Server(function (socket) {
   	sockets.push(socket);
	console.log("Got request");
	socket.on('end', function () {
        var i = sockets.indexOf(socket);
	 console.log("Socket ended");	
        sockets.splice(i, 1);
       	hostCount--;
    	});
	socket.on('error', function() {console.log("error");
	var i = sockets.indexOf(socket);
	 console.log("Socket ended");	
        sockets.splice(i, 1);
       	hostCount--;

	});
        hostCount++;     
        });
    
s.listen(8080,  "10.192.185.101");
console.log("Socket is listening");

function initializeBroadcast()
{
	if(hostCount != 0)
	{
		try{
			getMcxRates();
			console.log("HostCount : " + hostCount);
		}
		catch(e){
			console.log("Error Msg:" + e.message);
			conn = initializeMySql();
		}
	}
}

function getMcxRates()
{
   var outputRows;	
	try{
	   conn.query( "(select * from mcxrates where symbol like 'SILVER' order by id desc limit 1) union (select * from mcxrates where symbol like 'GOLD' order by id desc limit 1) union (select * from mcxrates where symbol like 'SILVERMINI' order by id desc limit 1) union (select * from mcxrates where symbol like 'GOLDMINI' order by id desc limit 1)", function(err, rows)
	   {
		if(rows)
		{
			for (var i = 0; i < sockets.length; i++) {
            		   sockets[i].write(JSON.stringify(rows));
			console.log(JSON.stringify(rows));
        }
		}
	   });
	}
	catch (e){
		throw e;
	}
}

function initializeMySql()
{
	var mysql      = require('mysql');
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : 'mathura',
	  database : 'easysarrafa_server'
	});
	try{
	connection.connect();
	console.log("Connection established");
	connection.on("error", function (err){ console.log("MYSQL Error - " + err.code); conn = initializeMySql(); });
	return connection;
	}catch(e)
	{
		console.log("Error in db starting");
	}
	return null;
}





