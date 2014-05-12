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
var cwd=process.cwd();




var sys=new Object;
sys.root=cwd;
var ex;
(function()                                 //initialize the environment of active pages.
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
    process.chdir(cwd);
    var folder=new String;
    console.log("\r\n~~~~~~~~~~~~~~~~~~~~~REQUEST~~~~~~~~~~~~~~~~~~~~~~");              //show request information on every requesting.
    console.log("request time: "+Date());
	console.log("connected from client: "+req.socket.remoteAddress+":"+req.socket.remotePort+"\r\nrequested file: "+req.url+"\r\nfrom: "+req.headers.host);
	console.log("request method: "+req.method);
	console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n");
	res.setHeader("Server","Malache HTTP server, made by malpower(malpower@ymail.com)");
	if (typeof(conf.domains[req.headers.host])!="undefined")                   //redirect into domain directories.
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
	if (req.url.substring(req.url.length-1,req.url.length)=="/")					//set default page for directories
	{
	    if (conf.domains[req.headers.host]!=undefined && typeof(conf.domains[req.headers.host].defaultPage)=="string")             //set default page of in this domain.
	    {
		    req.url+=conf.domains[req.headers.host].defaultPage;
		}
        else
        {
            req.url+=conf.defaultIndex;
        }		  
	}
	var uri=req.url.substring(0,req.url.indexOf("?"));
	if (uri=="")
	{
	    uri=req.url;
	}
	if (uri.substring(uri.lastIndexOf(".")+1)==conf.protect)                        //check if the request is for a active page.requesting protected file will be changed into active page.
	{
        res.setHeader("content-type","text/html");
        res.statusCode=404;
        res.end("<h1>Error 404<br />File not found!</h1><br /><span style='font-size: 11px'>Malache simple http server is made by malpower.</span>");
        return false;
	}
	if (ex.runService(req,res))                                //check and run if the requesting is for plugin.
	{
		return false;
	}
	if (Active(req,res,sys))                                   //check and run if the requesting is for active page.
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
    if (req.method=="POST")
    {
        res.statusCode=400;
        res.setHeader("content-type","text/html");
        res.end("<h1>400</h1><br /><br />wrong requesting method");
        req.socket.destroy();
        return false;
    }
    var realFilePath=req.url.substring(0,(req.url.lastIndexOf("?")>1?req.url.lastIndexOf("?"):req.url.length));
    fs.open(folder+realFilePath,"r",function(err,fd)                    //read file and response data.
    {
        if (err)                                //response 404 if the file is not existing.
        {
            res.setHeader("content-type","text/html");
            res.statusCode=404;
            res.end("<h1>Error 404<br />File not found!</h1><br /><span style='font-size: 11px'>Malache simple http server is made by malpower.</span>");
            return false;
        }
        var stat=fs.fstatSync(fd);                  //read details of requesting file.
        if (!stat.isFile())                         //response 403 if the requesting file is a folder.
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
        res.statusCode=200;                                         //response data normally.
        res.setHeader("cache-control","private");
        res.setHeader("last-modified",stat.mtime);
        var efn=req.url.substring(realFilePath.lastIndexOf(".")+1,realFilePath.length);
        res.setHeader("content-type","unknow/*");                   //set default content-type.
        res.setHeader("content-length",stat.size);
        for (var i=0;i<conf.contentTypes.length;i++)
        {
            if (conf.contentTypes[i].type==efn)
            {
                res.setHeader("content-type",conf.contentTypes[i].value);
                break;
            }
        }
        var rs=fs.createReadStream(folder+realFilePath);                 //read file.
        rs.on("data",function(data)
        {
            res.write(data);                                    //response data.
        });
        rs.on("end",function()                                  //finish responsing.
        {
            res.end();
            fs.close(fd);
            delete rs;
        });
        rs.on("error",function(e)                               //response 500 if get any error on reading file.
        {
            res.statusCode=500;
            res.end("500 ERROR");
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
    if (conf.bindingIp)
    {
	    server.listen(conf.port,conf.bindingIp);                      //restart listenning port.
    }
    else
    {
        server.listen(conf.port);
    }
    server.on("error",function(e)
    {
        console.log(e);
        console.log("Maybe you can change http port in conf.js.This error captured because that port "+conf.port+" is in use.");
        process.exit(1);
    });
}
catch(e)                                            //error on listenning.
{
	console.log(e);
	console.log("Maybe you can change http port in conf.js.This error captured because that port "+conf.port+" is in use.");
	process.exit(1);
}
var version="D201405121859s";
process.title="Malache HTTP Server["+version+"]";                    //set title text
console.log("============Malache Http Server by malpower==========");               //show malache informations.
console.log("Version: "+version);
console.log("HTTP server is now running on port: "+conf.port);
console.log("Default WEB base folder: "+conf.folder);
console.log("Domain list: ");
for (var x in conf.domains)                                                 //list domains which has set in conf.js
{
    console.log("           "+x+" : "+conf.domains[x].folder);
}
console.log("Address list: ");
for (var i=0;i<ips.length;i++)
{
	console.log("           "+ips[i]);
}
console.log("-----------------------------------------------------\r\n");

process.on("uncaughtException",function(e)                                                      //prevent exiting program.
{
    console.log("FINAL ERROR========MAIN");
    console.log(e.stack);
});


