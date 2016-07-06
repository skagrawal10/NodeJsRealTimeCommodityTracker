http = require('http'),
fileSystem = require('fs'),
urlObj = require('url');
console.log(urlObj);


http.createServer(function (req, res) {
	console.log("Request received");
	var url = req.url;
	console.log(url);
	try{
	if(url == "/easysarrafa/register")
		authenticate(req, res);

	else 
	{
	var url_parts = urlObj.parse(req.url, true);
	console.log(url_parts);
	var query = url_parts.query;
	console.log("Query" + query);
	console.log("Version " + query["version"]);
	console.log("Name " + query["category"]);
	version = query["version"];
	category = query["category"];
	filePath = getLatestFileLoc(version, category, conn, res);

	}

	}
	catch (e){
		console.log("Error:"+ e.message);
//		conn = initializeMySql();
	}
	}).listen(13333, "10.192.185.101");
console.log('Server running/');

function authenticate(req, res)
{
	key = req.headers['key'];
	console.log("Received Key is " + key);
	var response ;
	if(key == "tmp-key-invero123")
		response = true;
	else
		response = false;
	console.log(response);
	res.writeHead( 200, { "Content-Type": "text/plain" } );
	res.write( JSON.stringify( response ) );
	res.end();
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


function getLatestFileLoc(version, category, conn, response)
{
   var outputRows;	
	try{
		query = "(select * from versionInfo where category = '" + category + "' order by id desc limit 1)";
		console.log(query);
		
	   conn.query( query, function(err, rows)
	   {
		if(rows)
		{
			if(rows[0])
			{
				console.log(JSON.stringify(rows));
				latestVersion = rows[0]["version"];
				fileLoc = rows[0]["fileLoc"];
				console.log(latestVersion + " " + version + " " + fileLoc);
				if(version == latestVersion)
				{
					response.setHeader("isUpdated", "1");
					response.writeHead(200);
					response.end();
				}
				else
				{
					var stat = fileSystem.statSync(fileLoc);
					console.log(stat.size);
					response.setHeader("isUpdated", "0");
					response.writeHead(200, {
					'Content-disposition': 'attachment; filename=sk.exe',
					'Content-Type': 'application/x-msdownload',
					'Content-Length': stat.size
					});
					
					var readStream = fileSystem.createReadStream(fileLoc);
					
					// We replaced all the event handlers with a simple call to readStream.pipe()
					readStream.pipe(response);
					
				}
					
			}
		}
	   });
	}
	catch (e){
		throw e;
	}

}


