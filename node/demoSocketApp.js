var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , qs = require('querystring');

var hostCount = 0;
app.listen(13334);

var conn = initializeMySql();
if(!conn)
	return;

clientSettingsMap = {};
socketMap = {};
clientList = {};

initializeMap();

createWatch();

setInterval(initializeBroadcast, 2000);

function assignMap(client)
{
	fs.readFile('client_'+client+'.txt', function(err, data) 
	{
		var obj = eval("(" + data + ')');
		clientSettingsMap[client] = obj;
		console.log("Object is " + JSON.stringify(obj["rates"]));
	});
}


function initializeMap()
{
	fs.readFile('clientList.txt', function(err, data) 
	{
		clientList = eval("(" + data + ')');
		console.log("ClientList:", JSON.stringify(clientList));
		for(var client in clientList)
		{
			console.log("Client:", client);
			assignMap(client);
		}
	});
}

function assignWatch(client)
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

function createWatch()
{
	fs.readFile('clientList.txt', function(err, data) 
	{
		var clientList = eval("(" + data + ')');
		console.log("ClientList:", JSON.stringify(clientList));
		for(var client in clientList)
		{
			assignWatch(client);
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
			//console.log("Hi");
			req.on('data', function (data) {
				body +=data;
			});
			req.on('end',function(){
			credJSON = eval("(" + body + ')');
			client_id = credJSON["user_id"];
			password = credJSON["password"];
			console.log("Save " + client_id + " " + password);
			callBack = function(res, status) {
				if(status)
				{
					console.log("Client_id is " + client_id);
					fs.writeFile("client_" + client_id + ".txt", body);
					res.writeHead(200);
					res.end("Saved");
				}
				else
				{
					res.writeHead(200);
					res.end("Session Expired or invalid user");
				}
			}
			checkUser(client_id, password, res, callBack);
			
			});

		}
		
	}
	if(url == "/getSettings")
	{
	    try{
		console.log("GetSettings");
		var body = '';
		req.on('data', function(data){
			body += data;
		});
		req.on('end', function(){
		credJSON = eval("(" + body + ')');
		//credJSON = JSON.parse(body);
		client_id = credJSON["user_id"];
		password = credJSON["password"];
		console.log("\nGetsettings" + client_id);
		//isValid = checkUser(client_id, password);
		console.log(clientSettingsMap["sanjay"]);
		console.log("\n" + clientSettingsMap["shiv"]);
		for(var client in clientSettingsMap)
		{
			console.log("list" + client);
		}

		data = clientSettingsMap[client_id];
		if(data){
		console.log(data);
		res.writeHead( 200, { "Content-Type": "text/plain" } );

		res.write(JSON.stringify(data));
		res.end();
		}
		else
		{
			res.end();
		}
		});
	    }catch(e)
    	    {
		console.log("Message " + e);
	    }
	}
	if(url == "/hostCount")
	{
		res.writeHead( 200, { "Content-Type": "text/plain" } );
		res.write("Currently connected Hosts are " + hostCount);
		res.end();
	}
	if(url == "/authenticateUser")
	{
		if(req.method == 'POST')
		{
			var body = '';
			req.on('data', function(data){
				body += data;
			});
			req.on('end', function(){
			credJSON = eval("(" + body + ')');
			user_id = credJSON["user_id"];
			password = credJSON["password"];
			//console.log("User id = " + user_id + " password " + password);
			isUser = verifyUser(user_id, password, res);
			//console.log("\nResult " + isUser);
			
			});
		}
	}
}

io.sockets.on('connection', function (socket) {
  hostCount = hostCount + 1;
  socket.on('disconnect', function () {
        hostCount--;
        
    });
  socket.on('user', function(data) {
	//console.log("Got user request");
	if(data)
	{
		if(!socketMap[data])
		{
			socketMap[data] = new Array();
		}
		socketMap[data].push(socket);
	}	
	
	
    });
});

function verifyUser(client_id, password, res)
{
	try{
		queryString = "select * from spot_users where user_id = '" + client_id + "' and password = '" + password + "'";
		var result = false;
		conn.query(queryString, function(err, rows)
		{
			if(rows.length > 0)
				result =  true;
			else
				result = false;
			res.writeHead( 200, { "Content-Type": "text/plain" } );
			res.write(result + " ");
			res.end();
       
		});
	}catch(e)
	{
		console.log("Message " + e);
		return false;
	}
}

function checkUser(client_id, password, res, callBack)
{
	try{
		queryString = "select * from spot_users where user_id = '" + client_id + "' and password = '" + password + "'";
		var result = false;
		conn.query(queryString, function(err, rows)
		{
			if(rows.length > 0)
				result =  true;
			else
				result = false;
			if(callBack)
				callBack(res, result);
			else
				return result;
       
		});
		return result;
	}catch(e)
	{
		console.log("Message " + e);
		return false;
	}
}




function getMcxRates(client_id)
{
	try{
		clientSettings = clientSettingsMap[client_id];
		//console.log(clientSettings);
		
		var gold_symbol = 'GOLD';
		if (clientSettings["gold_base"] == "gold_mini")
			gold_symbol = 'GOLDMINI'
		
		if (client_id == "koshda"){
			fireKoshdaQuery(gold_symbol, clientSettings);
		}
		else{
			var silver_symbol = 'SILVER';
			if (clientSettings["silver_base"] == "silver_mini")
				silver_symbol = 'SILVERMINI'
			fireQuery(silver_symbol, gold_symbol, client_id, clientSettings );
		}
	}
	catch (e){
		console.log("Error Msg: " + e.message);
		conn = initializeMySql();;
	}
}

function fireQuery(silver_symbol, gold_symbol, client_id, clientSettings)
{
	conn.query( "(select * from mcxrates where symbol like '"+ silver_symbol +"' order by id desc limit 1) union (select * from mcxrates where symbol like '"+ gold_symbol +"' order by id desc limit 1)", function(err, rows)
	 	{
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

			if (err != null){
				console.log("MYSQL Error: " + err);
				conn = initializeMySql();
			}
			if(rows)
			{
				finalOut["timestamp"] = rows[0]["time"];
				silver_ltp = rows[0]["ltp"];
				gold_ltp = rows[1]["ltp"];
				silverhigh = rows[0]["high"];
				silverlow = rows[0]["low"];
				goldhigh = rows[1]["high"];
				goldlow = rows[1]["low"];
				silverbid = rows[0]["bid"];
				silverask = rows[0]["ask"];
				goldbid = rows[1]["bid"];
				goldask = rows[1]["ask"];
				
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
					if (item.indexOf("silver") != -1)
					{
						rateObj[item]["high"] = silverhigh;
						rateObj[item]["low"] = silverlow;
						rateObj[item]["bid"] = silverbid;
						rateObj[item]["ask"] = silverask;
						
					}
					else
					{
						rateObj[item]["high"] = goldhigh;
						rateObj[item]["low"] = goldlow;
						rateObj[item]["bid"] = goldbid;
						rateObj[item]["ask"] = goldask;
					}
					
				}
			}

			//console.log("Final Output is " + JSON.stringify(finalOut));
			//console.log("SocketMap of " + client_id + " is " + socketMap[client_id]);
			if(!socketMap[client_id])
				return;
			for(i=0; i<socketMap[client_id].length; i++)
			{
				socket = socketMap[client_id][i];
				socket.emit('rate', finalOut);
			}
			
		});
}


function fireKoshdaQuery(gold_symbol, clientSettings)
{
		conn.query( "select * from mcxrates where symbol like '"+ gold_symbol +"' order by id desc limit 1", function(err, rows)
	 	{
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
			rateObj["gold_std"] = {};
			rateObj["gold_22k"] = {};
			rateObj["gold_coin"] = {};
			
			if (err != null){
				console.log("MYSQL Error: " + err);
				conn = initializeMySql();
			}
			if(rows)
			{
				finalOut["timestamp"] = rows[0]["time"];
				gold_ltp = rows[0]["ltp"];
				var salex = 0, purx = 0;
				for(var item in rates)
				{
					itemInfo = rates[item];
					saleOn = itemInfo["saleOn"];
					purOn = itemInfo["purOn"];
					purDiff = itemInfo["purDiff"];
					saleDiff = itemInfo["saleDiff"];
					//console.log(saleOn + " " +  purOn + " " + purDiff + " " + saleDiff + " " + "ltp is" + silver_ltp + " Item " + item); 
					if(saleOn == true){
							rateObj[item]["sale"] = parseInt(gold_ltp) + parseInt(saleDiff);
					}
					if(purOn == true){
							rateObj[item]["pur"] = parseInt(gold_ltp) + parseInt(purDiff);
					}
					salex = parseInt(gold_ltp) + parseInt(saleDiff);
					purx = parseInt(gold_ltp) + parseInt(purDiff);
				}
				rateObj["gold_std"]["sale"] = parseInt(salex * 100 / 99.5);
				rateObj["gold_std"]["pur"] = parseInt(purx * 100 / 99.5);
				rateObj["gold_22k"]["sale"] = parseInt(salex * parseFloat(clientSettings["gold_22k_perc"]) / 99.5) ;
				rateObj["gold_coin"]["sale"] = parseInt(.8 * salex * 92.6 / 99.5) + parseInt(clientSettings["gold_coin_labour"]);
			}

			//console.log("Final Output is " + JSON.stringify(finalOut));
			//console.log("SocketMap of " + client_id + " is " + socketMap[client_id]);
			client_id = "koshda"; 
			if(!socketMap[client_id])
				return;
			for(i=0; i<socketMap[client_id].length; i++)
			{
				socket = socketMap[client_id][i];
				socket.emit('rate', finalOut);
			}
		});
}

function initializeBroadcast()
{
	if(hostCount != 0)
	{
		try{
			for(var client in clientList)
			{
				console.log("Client:", client);
				getMcxRates(client);
			}

			
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



