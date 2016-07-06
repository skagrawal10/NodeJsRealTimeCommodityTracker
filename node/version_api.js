var http = require('http'),
    fileSystem = require('fs'),
	url = require('url');
conn = initializeMySql();
    
http.createServer(function(request, response) {
    console.log("Request received");
	var url_parts = url.parse(request.url, true);
	console.log(url_parts.pathname);
	if(url_parts.pathname == "/easydeals/version")
		getLatestVersion(conn, response);
	if(url_parts.pathname == "/easydeals/config")
		getLatestConfigFile(conn, response);	
	
	else
	{
		var query = url_parts.query;
		version = query["version"];
		category = query["category"];
		conn = initializeMySql();
		filePath = getLatestFileLoc(version, category, conn, response);
	}

    

    //var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    //readStream.pipe(response);
})
.listen(13335);

function getLatestFileVersion(conn, response)
{
   var outputRows;	
	try{
		query = "(select version from version_info where category = 'config' limit 1)";
		
	   conn.query( query, function(err, rows)
	   {
		
		if(rows)
		{
			if(rows[0])
			{
				version = rows[0]["version"];
				response.writeHead( 200, { "Content-Type": "text/plain" } );
				response.write( JSON.stringify( version ) );
				response.end();
			}
		}
		 });
	}
	catch (e){
		throw e;
	}

}



function getLatestVersion(conn, response)
{
   var outputRows;	
	try{
		query = "(select version from version_info where category <> 'config' limit 1)";
		
	   conn.query( query, function(err, rows)
	   {
		
		if(rows)
		{
			if(rows[0])
			{
				version = rows[0]["version"];
				response.writeHead( 200, { "Content-Type": "text/plain" } );
				response.write( JSON.stringify( version ) );
				response.end();
			}
		}
		 });
	}
	catch (e){
		throw e;
	}

}

function getLatestFileLoc(version, category, conn, response)
{
   var outputRows;	
	try{
		query = "(select * from version_info where category <> 'config' order by id desc limit 1)";
		console.log(query);
		
	   conn.query( query, function(err, rows)
	   {
		if(rows)
		{
			if(rows[0])
			{
				latestVersion = rows[0]["version"];
				fileLoc = rows[0]["file_loc"];
				if(version == latestVersion)
				{
					response.setHeader("isUpdated", "1");
					response.writeHead(200);
					response.end();
				}
				else
				{
					var stat = fileSystem.statSync(fileLoc);
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

function getLatestConfigFile(conn, response)
{
   var outputRows;	
	try{
		query = "(select * from version_info where category = 'config' order by id desc limit 1)";
		
	   conn.query( query, function(err, rows)
	   {
		if(rows)
		{
			if(rows[0])
			{
				fileLoc = rows[0]["file_loc"];
//				console.log(latestVersion + " " + version + " " + fileLoc);
				var stat = fileSystem.statSync(fileLoc);
				response.setHeader("isUpdated", "0");
				response.writeHead(200, {
				'Content-disposition': 'attachment; filename=sk.ed',
				'Content-Type': 'application/x-msdownload',
				'Content-Length': stat.size
				});
				
				var readStream = fileSystem.createReadStream(fileLoc);
				
				// We replaced all the event handlers with a simple call to readStream.pipe()
				readStream.pipe(response);
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
	  database : 'easyBrok'
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
