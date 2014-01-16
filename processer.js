var net=require("net");
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


var maxSent=false;

var server=http.createServer(function(req,res)      //http requesting handler
{
    if (server._connections>3)
    {
        if (!maxSent)
        {
            process.send({instruction: "max"});
            maxSent=true;
        }
    }
    var folder=new String;
    //console.log("\r\n~~~~~~~~~~~~~~~~~~~~~REQUEST~~~~~~~~~~~~~~~~~~~~~~");
    //console.log("request time: "+Date());
    console.log("process id:"+process.pid);
    //console.log("connected from client: "+req.socket.remoteAddress+":"+req.socket.remotePort+"\r\nrequested file: "+req.url+"\r\nfrom: "+req.headers.host);
    //console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n");
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
    if (req.url.substring(req.url.length-1,req.url.length)=="/")                    //set default page
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
    fs.open(folder+req.url,"r",function(err,fd)
    {
        if (err)
        {
            res.setHeader("content-type","text/html");
            res.statusCode=404;
            res.end("<h1>Error 404<br />File not found!</h1><br /><span style='font-size: 11px'>This simple http server is made by malpower.</span>");
            return false;
        }
        var stat=fs.fstatSync(fd);
        if (req.headers["if-modified-since"]==stat.mtime)
        {
            res.statusCode=304;
            res.setHeader("last-modified",stat.mtime);
            res.setHeader("cache-control","private");
            res.end();
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
}).on("close",function()
{
    console.log("CLOSED");
});

var tcpHandle;

process.on("message",function(m,h)
{
    h=new net.Socket({handle: h});
    server.emit("connection",h);
});


process.on("uncaughtException",function(e)
{
    console.log("FINAL ERROR==================================CHILD:"+process.pid);
    console.log(e.message);
}).on("exit",function()
{
    console.log("CHILD EXITING!");
});