var fs=require("fs");
var conf=require("./conf");

var folder;


function MalResponse(socket)
{
    var status=404;
    var headers=new Object;
    var hSent=false;
    this.write=function(chunk)
    {
        if (!hSent)
        {
            for (var x in headers)
            {
                socket.write(x+": "+headers[x]+"\r\n");
            }
            socket.write("\r\n\r\n");
        }
        socket.write(chunk);
    }
    this.end=function()
    {
        process.send({msg: "resEnd",statusCode: status,header: headers});
    }
    this.setHeader=function(h,c)
    {
        headers[h]=c;
    }
    Object.defineProperty(this,"statusCode",{configurable: false,
                                             set: function(v){status=v;},
                                             get: function(){return status;}});
}




function ReadAndResponse(req,res)
{
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
}





process.on("message",function(m,s)
{
    if (m.msg=="request")
    {
        folder=m.folder;
        ReadAndResponse({url: m.url,headers: m.headers},new MalResponse(s));
    }
    if (m.msg=="finish")
    {
        process.exit(0);
    }
});
            