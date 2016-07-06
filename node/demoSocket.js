var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , qs = require('querystring');

var hostCount = 0;
app.listen(13310);

var conn = initializeMySql();
if(!conn)
	return;

clientSettingsMap = {};

initializeMap();

createWatch();

setInterval(initializeBroadcast, 2000);

function initializeMap()
{
	fs.readFile('clientList.txt', function(err, data) 
	{
		var clientList = eval("(" + data + ')');
		console.log("ClientList:", JSON.stringify(clientList));
		for(var client in clientList)
		{
			console.log("Client:", client);
			fs.readFile('client_'+client+'.txt', function(err, data) 
			{
				var obj = eval("(" + data + ')');
				clientSettingsMap[client] = obj;
				console.log("Object is " + JSON.stringify(obj["rates"]));
			});
		}
	});
}

function createWatch()
{
	fs.readFile('clientList.txt', function(err, data) 
	{
		var clientList = eval("(" + data + ')');
		console.log("ClientList:", JSON.stringify(clientList));
		for(var client in clientList)
		{
		
			fs.watch("client_" + client + ".txt", function(curr, prev)
			{
				fs.readFile("client_" + client + ".txt", function(err, data) 
				{
					var obj = eval("(" + data + ')');
					clientSettingsMap[client] = obj;
				});
				
				
			});
		}
	});
}


function handler (req, res) {
    console.log("Request received" + req.method);

	url = req.url;
	console.log(url);
	if(url == "/saveSettings")
	{
		if(req.method=='POST') 
		{
			var body='';
			req.on('data', function (data) {
				body +=data;
			});
			req.on('end',function(){
			var POST =  qs.parse(body);
			client_id = "sanjay";
			fs.writeFile("client_" + client_id + ".txt", body);
			});

		}
		res.writeHead(200);
		res.end("Saved");
	}
	if(url == "/getSettings")
	{
		data = clientSettingsMap["sanjay"];
		console.log(data);
		res.writeHead( 200, { "Content-Type": "text/plain" } );
		res.write(JSON.stringify(data));
		res.end();
	}
}

io.sockets.on('connection', function (socket) {
  hostCount = hostCount + 1;
  socket.on('disconnect', function () {
        hostCount--;
        
    });
});


function getMcxRates(clientSettings)
{
	try{
		var silver_symbol = 'SILVER';
		if (clientSettings["silver_base"] == "silver_mini")
			silver_symbol = 'SILVERMINI'

		var gold_symbol = 'GOLD';
		if (clientSettings["gold_base"] == "gold_mini")
			silver_symbol = 'GOLDMINI'

		var finalOut;
		finalOut = {};
		finalOut["rates"] = {};
		finalOut["market"] = clientSettings["market"];
		rateObj = finalOut["rates"];		
		rates = clientSettings["rates"];
		for(var key in rates)
		{
			rateObj[key] = {};
		}

		conn.query( "(select * from mcxrates where symbol like '"+ silver_symbol +"' order by id desc limit 1) union (select * from mcxrates where symbol like '"+ gold_symbol +"' order by id desc limit 1)", function(err, rows)
	 	{
			if (err != null){
				console.log("MYSQL Error: " + err);
				conn = initializeMySql();
			}
			if(rows)
			{
				finalOut["timestamp"] = rows[0]["time"];
				silver_ltp = rows[0]["ltp"];
				gold_ltp = rows[1]["ltp"];
				for(var item in rates)
				{
					itemInfo = rates[item];
					saleOn = itemInfo["saleOn"];
					purOn = itemInfo["purOn"];
					purDiff = itemInfo["purDiff"];
					saleDiff = itemInfo["saleDiff"];
					//console.log(saleOn + " " +  purOn + " " + purDiff + " " + saleDiff + " " + "ltp is" + silver_ltp + " Item " + item); 
					if(saleOn == true){
						if (item.indexOf("silver") != -1)
							rateObj[item]["sale"] = parseInt(silver_ltp) + parseInt(saleDiff);
						else
							rateObj[item]["sale"] = parseInt(gold_ltp) + parseInt(saleDiff);
					}
					if(purOn == true){
						if (item.indexOf("silver") != -1)
							rateObj[item]["pur"] = parseInt(silver_ltp) + parseInt(purDiff);
						else
							rateObj[item]["pur"] = parseInt(gold_ltp) + parseInt(purDiff);
					}
				}
			}

			console.log("Final Output is " + JSON.stringify(finalOut));
			io.sockets.emit('rate', finalOut);
		});
	}
	catch (e){
		console.log("Error Msg: " + e.message);
		conn = initializeMySql();;
	}
}

function initializeBroadcast()
{
	if(hostCount != 0)
	{
		try{
			getMcxRates(clientSettingsMap["sanjay"]);
		}
		catch(e){
			console.log("Error Msg:" + e.message);
			conn = initializeMySql();
		}
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



