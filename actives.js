var conf=require("./conf");
var fs=require("fs");
var mysql=require("mysql");


var srs=new String;
for (var i=0;i<12;i++)
{
    srs+=String(parseInt(Math.random()*Math.random()*17*13*11*23*27)).substring(0,1);
}

var application=new Object;
function SessionPool()
{
    var pool=new Object;
    function Create(v)
    {
        if (v!=null)
        {
            pool[v]={value: {}};
            pool[v].timer=setTimeout(function()
            {
                delete pool[x];
            },conf.sessionTimeout);
            return;
        }
        var x=new String;
        for (var i=0;i<12;i++)
        {
            x+=String(parseInt(Math.random()*Math.random()*17*13*11*23*27)).substring(0,1);
        }
        while (pool[x]!=undefined)
        {
            for (var i=0;i<12;i++)
            {
                x+=String(parseInt(Math.random()*Math.random()*17*13*11*23*27)).substring(0,1);
            }
        }
        pool[x]={value: {}};
        pool[x].timer=setTimeout(function()
        {
            delete pool[x];
        },conf.sessionTimeout);
        return x;
    }
    function GetSession(sid)
    {
        if (pool[sid]==undefined || pool[sid]==null)
        {
            return false;
        }
        clearTimeout(pool[sid].timer);
        pool[sid].timer=setTimeout(function()
        {
            delete pool[sid];
        },conf.sessionTimeout);
        return pool[sid].value;
    }
    this.get=GetSession;
    this.create=Create;
}
var sessionPool=new SessionPool;


function OrganizationFile(req,fn)
{
    var ns=new Date;
    function Org(buffs,ns,fn)
    {
        function PRO(blk)
        {
            var ns=new Date;
            var ick=blk;
            var blk_b=blk.toString("binary");
            var blk_u=blk.toString(conf.cutType);                           //this statement occupied much time when conf.cutType equals "utf-8"
            var header=blk_u.substring(0,blk_u.indexOf("\r\n\r\n"));
            var sp=blk_b.indexOf("\r\n\r\n")+4;
            var chunk=ick.slice(sp,ick.length);
            var filename,name;
            if (header.indexOf("filename")!=-1)
            {
                filename=header.split("filename=\"")[1].split("\"")[0];
                name=header.split("name=\"")[1].split("\"")[0];
                req.files.push({filename: filename,
                                name: name,
                                chunk: chunk});
                return true;
            }
            name=header.split("name=\"")[1].split("\"")[0];
            req.parameters[name]=chunk;
            return false;
        }
        for (var i=0;i<buffs.length;i++)
        {
            PRO(buffs[i]);
        }
        var tf=new Array;
        for (var i=0;i<req.files.length;i++)
        {
            if (req.files[i].filename!="")
            {
                console.log(".");
                tf.push(req.files[i]);
            }
        }
        req.files=tf;
        fn();
    }
    try
    {
        req.chunk=req.data;
        var boundary=req.headers["content-type"].split("boundary=")[1];
        req.chunk=req.chunk.slice(0,req.chunk.length-4);
        req.chunk=req.chunk.slice(boundary.length+4,req.chunk.length);
        var tmp=req.chunk.toString("binary");
        var pos=new Array;
        var xpos=0;
        var tmpReg=new RegExp("--"+boundary,"g");
        while (tmpReg.exec(tmp)!=null)
        {
            pos.push(tmpReg.lastIndex-boundary.length-2);
        }                              
        var cp=0;
        var buff=new Array;
        for (var i=0;i<pos.length;i++)
        {
            buff.push(req.chunk.slice(cp,pos[i]-2));
            cp=pos[i]+boundary.length+4;
        }   
        Org(buff,ns,fn);
    }
    catch (e)
    {
        console.log("ORG FILE: "+e.message);
    }
}

var workPath;

function Addon(tag)
{
    tag.include=function(file)
    {
        if (file.search(/\.\./g)!=-1)
        {
            return "文件名错误，访问越权!";
        }
        try
        {
            var buf=fs.readFileSync(workPath+file,"utf-8");
        }
        catch (e)
        {
            return "读取文件出错: "+e.message;
        }
        return buf;
    };
}


function Render(html,values)
{
	try
	{
	    Addon(values);
		var rlt=new String;
		var tags=html.match(/\<js:[^\r\n(%\>)]*%\>/g);
		if (tags==null)
		{
			tags=new Array;
		}
		for (var i=0;i<tags.length;i++)
		{
			console.log(tags[i]);
			tags[i]=tags[i].substring(4,tags[i].length);
			tags[i]=tags[i].substring(0,tags[i].length-2);
		}
		for (var i=0;i<tags.length;i++)
		{
			var exp=new RegExp("\<js:"+tags[i]+"%\>");
			html=html.replace(exp,values[tags[i]]);
		}
		tags=html.match(/\<js@[^%\>]*%\>/g);
		if (tags==null)
		{
			return html;
		}
		for (var i=0;i<tags.length;i++)
		{
			tags[i]=tags[i].substring(4,tags[i].length);
			tags[i]=tags[i].substring(0,tags[i].length-2);
		}
		for (var i=0;i<tags.length;i++)
		{
			var exp=new RegExp("\<js@"+tags[i]+"%\>");
			try
			{
				eval("rlt=values."+tags[i]+";");
			}
			catch (e)
			{
				rlt=e.message;
			}
			html=html.replace("\<js@"+tags[i]+"%\>",rlt);
		}
	}
	catch (e)
	{
		return "ERROR 500<br />active running error<br />"+e.message;
	}
	
	return html;
}

function Active(req,res,sys)
{
    var tmpHeaderCookies=new Array;
    res.setHeader("cache-control","private");
    res.setHeader("connection","keep-alive");
    if (typeof(conf.domains[req.headers.host])!="undefined")
    {
        sys.path=conf.domains[req.headers.host].folder;
    }
    else
    {
        sys.path=conf.folder;
    }
    workPath=sys.path;
    var dbconnections=new Array;
    function DB()
    {
        var conn=false;
        function Query(sql,fn)
        {
            if (typeof(fn)!="function")
            {
                fn=function(){};
            }
            if (conn==false)
            {
                fn({message: "conn is not initialized!"});
                return false;
            }
            try
            {
                conn.query(sql,function(err,rlt,fld)
                {
                    try
                    {
                        fn(err,rlt,fld);
                    }
                    catch (e)
                    {
                        console.log(e);
                        res.status=500;
                        res.end("!ERROR 500<br />"+e.message);
                    }
                });
            }
            catch (e)
            {
                console.log(e.message);
                return false;
            }
        }
        function Conn(o)
        {
            try
            {
                conn=mysql.createConnection(o);
                dbconnections.push(conn);
            }
            catch (e)
            {
                console.log(e.message);
                return false;
            }
        }
        Object.defineProperty(this,"connect",{confiurable: "false",
                                              get: function(){return Conn;},
                                              set: function(){}});
        Object.defineProperty(this,"query",{confiurable: "false",
                                            get: function(){return Query;},
                                            set: function(){}});
    }
	if (req.url.lastIndexOf(".")==-1 || req.url.substring(req.url.lastIndexOf(".")+1,req.url.length).split("?")[0]!=conf.activeType)
	{
		return false;
	}
	var globalEnv=sys;
	function GetCookie()
	{
	    var cks=""+req.headers.cookie;
	    var cookies=cks.split("; ");
	    var table=new Object;
	    for (var i=0;i<cookies.length;i++)
	    {
	        table[cookies[i].split("=")[0]]=cookies[i].split("=")[1];
	    }
	    delete cookies;
	    return function(key)
	    {
	        return table[key];
	    }
	}
	function SetCookie(key,val)
	{
	    tmpHeaderCookies.push(key+"="+val);
	}
    function DoProcess(Page,req,Returner,ErrorBlock)
    {
        var x;
        if (GetCookie()("malacheSESSION"+srs)==undefined)
        {
            x=sessionPool.create();
            SetCookie("malacheSESSION"+srs,x);
        }
        else
        {
            x=GetCookie()("malacheSESSION"+srs);
        }
        if (sessionPool.get(x)==false)
        {
            sessionPool.create(x);
        }
        Page.call(globalEnv,req,Returner,ErrorBlock,DB,GetCookie(),SetCookie,sessionPool.get(x),application);
    }
	var activeFolder;
	var siteFolder;
	var active=req.url.substring(0,req.url.indexOf("."));
	try
	{
	    var af=new String;
	    if (typeof(conf.domains[req.headers.host])!="undefined")
	    {
	        af="/"+conf.domains[req.headers.host].active;
	        activeFolder="./actives/"+af;
	        siteFolder=conf.domains[req.headers.host].folder;
	    }
	    else
	    {
	        af="";
	        activeFolder="./actives";
	        siteFolder=conf.folder;
	    }
		fs.readFile("./actives"+af+active+".js",function(err,buf)
		{
			if (err)
			{
				res.setHeader("content-type","text/html;charset=utf-8");
				res.status=500;
				res.end("500 ERROR<br />Cannot find this active in active folder.");
				return false;
			}
			res.setHeader("content-type","text/html;charset=utf-8");
			try
			{
				fs.readFile(siteFolder+active+"."+conf.protect,function(err,html)
				{
					if (err)
					{
						res.setHeader("content-type","text/html;charset=utf-8");
						res.status=500;
						res.end("ERROR 500<br />Cannot open bound html page.");
						return false;
					}
					try
					{
					   req.url=decodeURIComponent(req.url);
				    }
				    catch (e)
				    {
				        console.log(e.message);
				    }
					if (req.method=="GET")
					{
					    req.files=new Array;
						req.parameters=new Object;
						try
						{
						    if (req.url.indexOf("?")!=-1)
						    {
    						    var ps=req.url.substring(req.url.indexOf("?")+1,req.url.length);
    						    ps=ps.split("&");
    						    for (var i=0;i<ps.length;i++)
    						    {
    						        req.parameters[ps[i].split("=")[0]]=ps[i].split("=")[1];
    						        req.parameters[ps[i].split("=")[0]]=req.parameters[ps[i].split("=")[0]].replace(/\+/g," ");
    						        req.parameters[ps[i].split("=")[0]]=decodeURIComponent(req.parameters[ps[i].split("=")[0]]);
    						    }
    						}
						    function Returner(obj)
						    {
						        res.setHeader("set-cookie",tmpHeaderCookies);
						        res.end(Render(String(html),obj));
						        for (var i=0;i<dbconnections.length;i++)
						        {
						            dbconnections[i].end();
						        }
						    }
							function ErrorBlock(e)
							{
                                res.status=500;
                                res.end("!ERROR 500<br />"+e.message);
                            }
                            var Page=(new Function("function Page(req,Rnt,_Err,DBC,GetCookie,SetCookie,session,application){try{"+String(buf)+"\r\n}catch(e){_Err(e);}}return Page;"))();
							try
							{
							   DoProcess(Page,req,Returner,ErrorBlock);
						    }
						    catch (e)
						    {
						        res.status=500;
						        res.end("!ERROR 500<br />"+e.message);
						    }
							
						}
						catch (e)
						{
							res.status=500;
							res.end("!ERROR 500<br />"+e.message);
						}
					}
					else
					{
					    var formType="normal";
					    var chunks=0;
					    req.data=new Buffer(0);
					    if (Number(req.headers["content-length"])!=Number(req.headers["content-length"]) || Number(req.headers["content-length"])>conf.postSize)
					    {
					        console.log("FILE SIZE OUT OF LIMIT.");
					        res.end(":(<br />FLIE SIZE OUT OF LIMIT.");
                            return false;
                        }
					    if (req.headers["content-type"] && req.headers["content-type"].indexOf("multipart/form-data")!=-1)
					    {
					        formType="formdata";
					    }
					    var vailable=true;
					    var _ns=new Date;
					    var tSize=0;
					    var buffBlock=new Array;
						req.on("data",function(data)
						{
						    tSize+=data.length;
						    if (!vailable)
						    {
						        return false;
						    }
					        if (tSize.length>conf.postSize)
					        {
					            console.log("FILE SIZE OUT LIMIT.");
					            vailable=false;
					            res.end(":(<br />FLIE SIZE OUT OF LIMIT.");
					            req.socket.destroy();
                                return false;
					        }
							buffBlock.push(data);
						});
						req.on("end",function()
						{
						    if (!vailable)
						    {
						        res.end(":(<br />FLIE SIZE OUT OF LIMIT.");
						        return false;
						    }
						    var pt=0;
						    var endTimer;
						    if (buffBlock.length>0)
						    {
    						    endTimer=setInterval(function()
    						    {
    						        req.data=Buffer.concat([req.data,buffBlock[pt++]]);
    						        if (pt>=buffBlock.length)
    						        {
    						            clearInterval(endTimer);
    						            _END();
    						        }
    						    },1);
						    }
						    else
						    {
						        _END();
						    }
						    function _END()
						    {
    						    req.files=new Array;
    						    var ps;
    						    if (formType=="formdata")
    						    {
    						        req.parameters=new Object;
    						        req.chunk=req.data;
                                    if (req.url.indexOf("?")!=-1)
                                    {
                                        ps=req.url.substring(req.url.indexOf("?")+1,req.url.length);
                                        ps=ps.split("&");
                                        for (var i=0;i<ps.length;i++)
                                        {
                                            req.parameters[ps[i].split("=")[0]]=ps[i].split("=")[1];
                                        }
                                    }
    						        OrganizationFile(req,DoPOST);
    						    }
    						    else
    						    {
    						        req.data=req.data.toString("utf-8");
        						    req.chunk=req.data;
        							req.original=req.data;
        							req.data=req.data.split("&");
        							req.parameters=new Object;
        							for (var i=0;i<req.data.length;i++)
        							{
        							    try
        							    {
            								req.parameters[req.data[i].split("=")[0]]=req.data[i].split("=")[1];
            								req.parameters[req.data[i].split("=")[0]]=req.parameters[req.data[i].split("=")[0]].replace(/\+/g," ");
                                            req.parameters[req.data[i].split("=")[0]]=decodeURIComponent(req.parameters[req.data[i].split("=")[0]]);
                                        }
                                        catch (e)
                                        {
                                            console.log(e.message);
                                        }
        							}
                                    if (req.url.indexOf("?")!=-1)
                                    {
                                        ps=req.url.substring(req.url.indexOf("?")+1,req.url.length);
                                        ps=ps.split("&");
                                        for (var i=0;i<ps.length;i++)
                                        {
                                            try
                                            {
                                                req.parameters[ps[i].split("=")[0]]=ps[i].split("=")[1];
                                                req.parameters[ps[i].split("=")[0]]=req.parameters[ps[i].split("=")[0]].replace(/\+/g," ");
                                                req.parameters[ps[i].split("=")[0]]=decodeURIComponent(req.parameters[ps[i].split("=")[0]]);
                                            }
                                            catch (e)
                                            {
                                                console.log(e.message);
                                            }
                                        }
                                    }
                                    DoPOST();
    							}
    							function DoPOST()
    							{
        							try
        							{
                                        function Returner(obj)
                                        {
                                            res.setHeader("set-cookie",tmpHeaderCookies);
                                            res.end(Render(String(html),obj));
                                            for (var i=0;i<dbconnections.length;i++)
                                            {
                                                dbconnections[i].end();
                                            }
                                        }
                                        function ErrorBlock(e)
                                        {
                                            res.status=500;
                                            res.end("!ERROR 500<br />"+e.message);
                                        }
                                        var Page=(new Function("function Page(req,Rnt,_Err,DBC,GetCookie,SetCookie,session,application){try{"+String(buf)+"\r\n}catch(e){_Err(e);}}return Page;"))();
                                        try
                                        {
                                           DoProcess(Page,req,Returner,ErrorBlock);
                                        }
                                        catch (e)
                                        {
                                            res.status=500;
                                            res.end("!ERROR 500<br />"+e.message);
                                        }							    
        							}
        							catch (e)
        							{
        								res.status=500;
        								res.end("ERROR 500<br />"+e.message);
        							}
        			             }     
		                     }       
						});
					}
				});
			}
			catch (e)
			{
				res.status=500;
				res.end("ERROR 500<br />"+String(e.message));
			}
		});
	}
	catch (e)
	{
	    console.log(e);
		return false;
	}
	return true;
}

module.exports=Active;