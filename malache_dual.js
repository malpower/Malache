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
var TCP=process.binding("tcp_wrap").TCP;

var p=new Array;
for (var i=0;i<conf.clusterLength;i++)
{
    p[i]=cp.fork("./processer.js");
}
var pt=0;
var s=new TCP;
s.bind("0.0.0.0",conf.port);
s.onconnection=function(h)
{
    p[(pt++)%p.length].send({},h);
};

try
{
    s.listen(128);
}
catch(e)
{
    console.log(e);
    console.log("Maybe you can change http port in conf.js.This error captured because that port "+conf.port+" is in use.");
    process.exit(1);
}
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
process.title="Malache HTTP Server";                    //set title name
console.log("============Malache Http Server by malpower==========");
console.log("Version: D201311261355d");
console.log("HTTP server is now running on port: "+conf.port);
console.log("Default WEB base folder: "+conf.folder);
console.log("Process number: "+conf.clusterLength);
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
    console.log("FINAL ERROR==================================MASTER");
    console.log(e.message);
});


