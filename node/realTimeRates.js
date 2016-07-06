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
	}).listen(80, "10.192.185.101");
console.log('Server running at http://127.0.0.1:8124/');


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
