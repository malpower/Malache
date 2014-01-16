/*This simple http server is made by malpower
 * for testing web applications for mobile.
 * This porgram is based on Node.js which is
 * a platform from joyent, inc. It allows user
 * building backend service programs with JS.
 * Node.js uses Google V8 engine, it means that
 * it will be fast.
 * You can also share your files on http with
 * this simple http server.Conf.js is a configure
 * file for this simple server.Anthor named 
 * malpower who is web programmer in Chengdu.
 * Email: malpower@ymail.com
 */



var conf=require("./conf");
var cluster=require("cluster");
var http=require("http");
var fs=require("fs");
var os=require("os");
var Ex=require("./extends");
var Serv=require("./services");
var Active=require("./actives");
var util=require("util");
var cp=require("child_process");



process.title="Malache HTTP Server";					//set title name
var sys=new Object;
var ex;
    (function()
    {
    	for (var i=0;i<conf.activeModules.length;i++)
    	{
    		sys[conf.activeModules[i]]=require(conf.activeModules[i]);
    	}
    	sys.conf=conf;
    	ex=new Ex(sys);
    	Serv(ex);
    })();
var server=http.createServer(function(req,res)		//http requesting handler
{
    var folder=new String;
    console.log("\r\n~~~~~~~~~~~~~~~~~~~~~REQUEST~~~~~~~~~~~~~~~~~~~~~~");
    console.log("request time: "+Date());
	console.log("connected from client: "+req.socket.remoteAddress+":"+req.socket.remotePort+"\r\nrequested file: "+req.url+"\r\nfrom: "+req.headers.host);
	console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n");
	res.setHeader("Server","Malache HTTP server, made by malpower(malpower@ymail.com)");
	if (typeof(conf.domains[req.headers.host])!="undefined")
	{
	    folder=conf.domains[req.headers.host].folder;
	    if (folder==undefined)
	    {
	        folder=conf.folder;
	    }
	}
	else
	{
	    folder=conf.folder;
	}
	if (req.url.substring(req.url.length-1,req.url.length)=="/")					//set default page
	{
	    if (conf.domains[req.headers.host]!=undefined && typeof(conf.domains[req.headers.host].defaultPage)=="string")
	    {
		    req.url+=conf.domains[req.headers.host].defaultPage;
		}
        else
        {
            req.url+=conf.defaultIndex;
        }		  
	}
	if (req.url.substring(req.url.lastIndexOf(".")+1,req.url.length)==conf.protect)
	{
		req.url=req.url.substring(0,req.url.lastIndexOf("."))+"."+conf.activeType;
		console.log(req.url);
	}
	if (ex.runService(req,res))
	{
		return false;
	}
	if (Active(req,res,sys))
	{
		return false;
	}
	try
	{
	   req.url=decodeURIComponent(req.url);
    }
    catch (e)
    {
        console.log("DECODE URI ERROR");
    }
    fs.open(folder+req.url,"r",function(err,fd)                    //read file and response data.
    {
        if (err)
        {
            res.setHeader("content-type","text/html");
            res.statusCode=404;
            res.end("<h1>Error 404<br />File not found!</h1><br /><span style='font-size: 11px'>This simple http server is made by malpower.</span>");
            return false;
        }
        var stat=fs.fstatSync(fd);
        if (!stat.isFile())
        {
            res.statusCode=403;
            res.end("<h1>Error 403</h1><br />folder cannot be listed.");
            return false;
        }
        if (req.headers["if-modified-since"]==stat.mtime)               //about cache.
        {
            res.statusCode=304;
            res.setHeader("last-modified",stat.mtime);
            res.setHeader("cache-control","private");
            res.end();                                              //does not response data body, browser will read this file in it's cache.
            return;
        }
        res.statusCode=200;
        res.setHeader("cache-control","private");
        res.setHeader("last-modified",stat.mtime);
        var efn=req.url.substring(req.url.lastIndexOf(".")+1,req.url.length);
        for (var i=0;i<conf.contentTypes.length;i++)
        {
            if (conf.contentTypes[i].type==efn)
            {
                res.setHeader("content-type",conf.contentTypes[i].value);
                break;
            }
        }
        var rs=fs.createReadStream(folder+req.url);
        rs.on("data",function(data)
        {
            res.write(data);
        });
        rs.on("end",function()
        {
            res.end();
            fs.close(fd);
            delete rs;
        });
        rs.on("error",function(e)
        {
            res.end();
            fs.close(fd);
            console.log(e.message);
            delete rs;
        });
    });
});
var ips=new Array;						//an array for keeping local ip addresses.
(function()								//for getting local ip address.
{
	var ifaces=os.networkInterfaces();
	for (var x in ifaces)
	{
		for (var y in ifaces[x])
		{
			if (ifaces[x][y]["family"]=="IPv4")
			{
				if (ifaces[x][y]["address"]!="127.0.0.1")
				{
					ips.push(ifaces[x][y]["address"]);
				}
			}
		}
	}
})();
try
{
	server.listen(conf.port);
}
catch(e)
{
	console.log(e);
	console.log("Maybe you can change http port in conf.js.This error captured because that port "+conf.port+" is in use.");
	process.exit(1);
}
console.log("============Malache Http Server by malpower==========");
console.log("Version: D20131212062002s");
console.log("HTTP server is now running on port: "+conf.port);
console.log("Default WEB base folder: "+conf.folder);
console.log("Domain list: ");
for (var x in conf.domains)
{
    console.log("           "+x+" : "+conf.domains[x].folder);
}
console.log("Address list: ");
for (var i=0;i<ips.length;i++)
{
	console.log("              "+ips[i]);
}
console.log("-----------------------------------------------------");

process.on("uncaughtException",function(e)
{
    console.log("FINAL ERROR==================================");
    console.log(e.message);
});


