var net=require("net");
var conf=require("./conf");
var cp=require("child_process");
var path=require("path");
var os=require("os");

var sids=conf.sessionName;

var basePort=conf.clusterStartPort;


for (var i=0;i<conf.nclusters;i++)
{
    (function(i)
    {
        var kid=cp.fork("./fileResponser");
        kid.send({port: i+basePort,id: i});
    })(i);
}


var nport=0;
var mainProcesser=cp.fork("./mainProcesser",[basePort-1]);


function LinkTo(client,port,chunk)
{
    var sock=net.connect({host: "127.0.0.1",port: port},function()
    {
        sock.write(chunk);
        sock.pipe(client);
        client.pipe(sock);
    });
    sock.once("close",function()
    {
    }).once("err",function()
    {});
}
        


var server=net.createServer(function(socket)
{
    socket.once("data",function(chunk)
    {
        var buff=chunk.toString("utf8");
        console.log("DATA START");
        buff=buff.split("\r\n")[0];
        buff=buff.replace(/(GET|POST)\s/g,"");
        buff=buff.replace(/\sHTTP[^\r\n]*/g,"");
        var filename;
        if (buff.indexOf("?")!=-1)
        {
            filename=buff.split("?")[0];
        }
        else
        {
            filename=buff;
        }
        if (filename[filename.length-1]=="/" || path.extname(filename)=="."+conf.activeType || path.extname(filename)=="."+conf.protect)
        {
            LinkTo(socket,basePort-1,chunk);
        }
        else
        {
            for (var x in conf.domains)
            {
                if (conf.domains[x].template && path.extname(filename)=="."+conf.domains[x].template)
                {
                    LinkTo(socket,basePort-1,chunk);
                    return;
                }
            }
            LinkTo(socket,(nport++)%conf.nclusters+basePort,chunk);
        }
    });
});
server.listen(conf.port);



var ips=new Array;                      //an array for keeping local ip addresses.
(function()                             //for getting local ip address.
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
