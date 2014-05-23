var http=require("http");
var conf=require("./conf");
var fs=require("fs");
var cid=0;
var server=http.createServer(function(req,res)
{
    var folder=new String;
    console.log("\r\n~~~~~~~~~~~~~~~~~~~~~REQUEST~~~~~~~~~~~~~~~~~~~~~~");              //show request information on every requesting.
    console.log("request time: "+Date());
    console.log("connected from client: "+req.socket.remoteAddress+":"+req.socket.remotePort+"\r\nrequested file: "+req.url+"\r\nfrom: "+req.headers.host);
    console.log("request method: "+req.method);
    console.log("solve: fileResponser("+cid+")");
    console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\r\n");
    res.setHeader("Server","Malache HTTP server, made by malpower(malpower@ymail.com)");
    res.setHeader("Thread",String(process.pid));
    res.setHeader("Connection","close");
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
    if (req.url.substring(req.url.length-1,req.url.length)=="/")                    //set default page for directories
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
    try
    {
        req.url=decodeURIComponent(req.url);
    }
    catch (e)
    {
        console.log("DECODE URI ERROR");
    }
    if (req.method=="POST" && req.headers["content-type"].indexOf("multipart/form-data")!=-1)
    {
        res.statusCode=400;
        res.setHeader("content-type","text/html");
        res.end("<h1>400</h1><br /><br />wrong requesting method");
        req.connection.destroy();
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
            req.connection.destroy();
            return false;
        }
        var stat=fs.fstatSync(fd);                  //read details of requesting file.
        if (!stat.isFile())                         //response 403 if the requesting file is a folder.
        {
            res.statusCode=403;
            res.end("<h1>Error 403</h1><br />folder cannot be listed.");
            req.connection.destroy();
            return false;
        }
        if (req.headers["if-modified-since"]==stat.mtime)               //about cache.
        {
            res.statusCode=304;
            res.setHeader("last-modified",stat.mtime);
            res.setHeader("cache-control","private");
            res.end();                                              //does not response data body, browser will read this file in it's cache.
            req.connection.destroy();
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
            req.connection.destroy();
            fs.close(fd);
            delete rs;
        });
        rs.on("error",function(e)                               //response 500 if get any error on reading file.
        {
            res.statusCode=500;
            res.end("500 ERROR");
            req.connection.destroy();
            fs.close(fd);
            console.log(e.message);
            delete rs;
        });
    });
});

process.on("message",function(msg)
{
    cid=msg.id;
    server.listen(msg.port,"127.0.0.1");
});


process.on("uncaughtException",function(e)                                                      //prevent exiting program.
{
    console.log("FINAL ERROR========MAIN");
    console.log(e.stack);
});


