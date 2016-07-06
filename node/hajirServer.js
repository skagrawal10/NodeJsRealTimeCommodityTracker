var io = require('socket.io');
http = require('http');
conn = initializeMySql();
var countConn = 0;
if(!conn)
	return;
http = http.createServer(function (req, res) {
	console.log("Request received");
	var url = req.url;
	try{
		if(url == "/getCommCode")
		{
		responseHtml = '<html><head></head><body><script type="text/javascript" src = "socket.io/socket.io.js"></script><script type = "text/javascript">var socket = new io.Socket("54.235.27.146", (port : 80));socket.connect();socket.on("connect", function(data) {alert("client is connected"););socket.on("message", function(data) {alert(data);});</script></body></html>'
		res.writeHead( 200, { "Content-Type": "text/plain" } );
		res.write(responseHtml);
		res.end();
		}
		if(url == "/getRates")
		{  
			getMcxRates(res, conn);
		}
	}
	catch (e){
		console.log("Error:"+ e.message);
		conn = initializeMySql();
	}
	});
http.listen(80, "10.192.185.101");
var socket = io.listen(http);
console.log('Server running at http://127.0.0.1:8124/');


initializeBroadCast(socket);

io.sockets.on('connection', function(client) {
	console.log('client is connected');
	countConn = countConn + 1;	
});

socket.on('disconnect', function(client) {
	console.log('client is disconnected');
	countConn = countConn - 1;
});

function initializeBroadCast(socket)
{
	while(true)
	{
		if(countConn != 0)
		{
			socket.broadcast("Hi This is broadcasting");
		}
	}
}


function getCommCode(res, conn)
{
	try{
	conn.query('SELECT distinct symbol from mcxrates', function(err, rows) 
	{
		console.log(rows.length);
		if(rows)
		{
			res.writeHead( 200, { "Content-Type": "text/plain" } );
			resObj = {delayTimer : 10, symbols : rows };
			res.write( JSON.stringify( resObj ) );
			res.end();
		}
	 });
	}
	catch (e){
		throw e;
	}
}


function getMcxRates(res, conn)
{
   var outputRows;	
	try{
	   conn.query( "(select * from mcxrates where symbol like '%SILVER%' order by id desc limit 1) union (select * from mcxrates where symbol like '%GOLD%' order by id desc limit 1) union (select * from mcxrates where symbol like '%COPPER%' order by id desc limit 1)", function(err, rows)
	   {
		if(rows)
		{
			res.writeHead( 200, { "Content-Type": "text/plain" } );
			res.write( JSON.stringify( rows ) );
			res.end();
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
	return connection;
	}catch(e)
	{
		console.log("Error in db starting");
	}
	return null;
}
