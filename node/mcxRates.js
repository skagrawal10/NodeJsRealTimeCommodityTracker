http = require('http');
conn = initializeMySql();
if(!conn)
	return;
http.createServer(function (req, res) {
	console.log("Request received");
	var url = req.url;
	try{
		if(url == "/getCommCode")
			getCommCode(res, conn);
		if(url == "/getRates")
		{  
			getMcxRates(res, conn);
		}
	}
	catch (e){
		console.log("Error:"+ e.message);
		conn = initializeMySql();
	}
	}).listen(13330, "10.192.185.101");
console.log('Server running at http://127.0.0.1:13330/');


function getCommCode(res, conn)
{
	try{
	//conn.query("SELECT distinct symbol from mcxrates where symbol like 'SILVER' or symbol like 'GOLD' or symbol like 'SILVERMINI' or symbol like 'GOLDMINI'", function(err, rows) 
	//{
	//	console.log(rows.length);
	//	if(rows)
	//	{
			res.writeHead( 200, { "Content-Type": "text/plain" } );
			//resObj = {delayTimer : 10, symbols : rows };
			//res.write( JSON.stringify( resObj ) );
			res.write(JSON.stringify({"delayTimer":10, "symbols": [{"symbol":"SILVER"}, {"symbol":"SILVERMINI"}, {"symbol":"GOLD"}, {"symbol":"GOLDMINI"}]}));
			res.end();
	//	}
	// });
	}
	catch (e){
		throw e;
	}
}


function getMcxRates(res, conn)
{
   var outputRows;	
	try{
	   conn.query( "(select * from mcxrates where symbol like 'SILVER' order by id desc limit 1) union (select * from mcxrates where symbol like 'GOLD' order by id desc limit 1) union (select * from mcxrates where symbol like 'SILVERMINI' order by id desc limit 1) union (select * from mcxrates where symbol like 'GOLDMINI' order by id desc limit 1)", function(err, rows)
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
	connection.on("error", function (err){ console.log("MYSQL Error - " + err.code); conn = initializeMySql(); });
	return connection;
	}catch(e)
	{
		console.log("Error in db starting");
	}
	return null;
}
