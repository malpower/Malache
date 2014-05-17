var net=require("net");
var conf=require("./conf");
var cp=require("child_process");
var path=require("path");

var sids=conf.sessionName;

var basePort=conf.clusterStartPort;


for (var i=0;i<5;i++)
{
    (function(i)
    {
        var kid=cp.fork("./fileResponser");
        kid.send({port: i+basePort});
    })(i);
}


var nport=0;
var mainProcesser=cp.fork("./mainProcesser",[basePort-1]);


function LinkTo(client,port,chunk)
{
    var sock=net.connect({host: "127.0.0.1",port: port},function()
    {
        sock.write(chunk);
        client.pipe(sock);
        sock.pipe(client);
    });
    sock.on("close",function()
    {
    }).on("err",function()
    {});
}
        


var server=net.createServer(function(socket)
{
    socket.once("data",function(chunk)
    {
        var buff=chunk.toString("utf8");
        buff=buff.split("\r\n")[0];
        buff=buff.substring(4);
        buff=buff.substring(0,buff.indexOf(" "));
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
            LinkTo(socket,(nport++)%5+basePort,chunk);
        }
    });
});
server.listen(conf.port);