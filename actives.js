var conf=require("./conf");
var fs=require("fs");
var mysql=require("mysql");
var dir=require("path");




function ReturnError500(e,res)
{
    res.setHeader("contentType","text/html;charset=utf-8");
    res.statusCode=500;
    res.write("ERROR 500<br />server internal error<br /><br />");
    if (conf.debugMode==true)
    {
        console.log(e.stack);
        var stack=e.stack.replace(/\n/g,"<br />");
        res.write(stack);
    }
    res.end();
}
        
        


var srs=new String;
for (var i=0;i<12;i++)
{
    srs+=String(parseInt(Math.random()*Math.random()*17*13*11*23*27)).substring(0,1);
}
var sessionName=conf.sessionName || "malacheSESSION"+srs;
console.log("SESSIONID NAME:"+sessionName);

var application=new Object;
function SessionPool()
{
    var pool=new Object;
    function Create(v)
    {
        if (!!v && typeof(v)!="string")
        {
            return false;
        }
        var x=new String;
        if (typeof(v)=="string" && (pool[v]==undefined || pool[v]==null))
        {
            pool[v]={value: {}};
            pool[v].timer=setTimeout(function()
            {
                delete pool[v];
            },conf.sessionTimeout);
            return;
        }
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
            delete pool[x].value;
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
            delete pool[sid].value;
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
            var blk_u=blk.toString(conf.cutType);                           //this statement occupies much time when conf.cutType equals "utf8"
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
            if (req.parameters[name]!=undefined)
            {
                req.parameters[name]=new Array(req.parameters[name]);
            }
            if (req.parameters[name] instanceof Array)
            {
                req.parameters[name].push(chunk);
                return false;
            }
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
            return "invalid filename";
        }
        try
        {
            var buf=fs.readFileSync(workPath+file,"utf-8");
        }
        catch (e)
        {
            return "error on reading file."+e.message;
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




//first, i'm so sorry for this pyramid of doom, please don't kill me!
function Active(req,res,sys)            
{
    req.formType=false;
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
    var root=sys.root;
    delete sys.root;
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
                        ReturnError500(e,res);
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
    var uri=req.url.substring(0,req.url.indexOf("?"));
    if (uri==""){uri=req.url;}
	if (uri.lastIndexOf(".")==-1 || uri.substring(uri.lastIndexOf(".")+1,uri.length)!=conf.activeType)
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
        if (GetCookie()(sessionName)==undefined)
        {
            x=sessionPool.create();
            SetCookie(sessionName,x);
        }
        else
        {
            x=GetCookie()(sessionName);
        }
        if (sessionPool.get(x)==false)
        {
            sessionPool.create(x);
        }
        var _Require=function(path)
        {
            var filename=dir.basename(path);
            if (typeof(filename)!="string")
            {
                return null;
            }
            try
            {
                var ap=require("./requires/"+conf.domains[req.headers.host].active+"/"+filename);
            }
            catch (e)
            {
                if (conf.debugMode)
                {
                    console.log(e.message);
                }
                return null;
            }    
            return ap;
        };
        Page.call(globalEnv,req,Returner,ErrorBlock,DB,GetCookie(),SetCookie,sessionPool.get(x),application,_Require,res);
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
				res.statusCode=404;
				res.end("<h1>Error 404<br />File not found!</h1><br /><span style='font-size: 11px'>Malache simple http server is made by malpower.</span>");
				return false;
			}
			res.setHeader("content-type","text/html;charset=utf-8");
			try
			{
				fs.readFile(siteFolder+active+"."+conf.protect,function(err,html)
				{
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
    						        if (ps[i]=="")
    						        {
    						            continue;
    						        }
    						        if (req.parameters[ps[i].split("=")[0]]!=undefined)
    						        {
    						            req.parameters[ps[i].split("=")[0]]=new Array(req.parameters[ps[i].split("=")[0]]);
    						        }
    						        if (req.parameters[ps[i].split("=")[0]] instanceof Array)
    						        {
    						            req.parameters[ps[i].split("=")[0]].push(ps[i].split("=")[1]);
    						            req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]=req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1].replace(/\+/g," ");
                                        req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]=decodeURIComponent(req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]);
                                        continue;
                                    }
    						        req.parameters[ps[i].split("=")[0]]=ps[i].split("=")[1];
    						        req.parameters[ps[i].split("=")[0]]=req.parameters[ps[i].split("=")[0]].replace(/\+/g," ");
    						        req.parameters[ps[i].split("=")[0]]=decodeURIComponent(req.parameters[ps[i].split("=")[0]]);
    						    }
    						}
						    function Returner(obj)
						    {
                                if (obj.__malS)
                                {
                                    if (typeof(obj.__malS.contentType)=="string")
                                    {
                                        res.setHeader("content-type",obj.__malS.contentType);
                                    }
                                    if (obj.__malS.blockData==true)
                                    {
                                        res.end(obj.__malS.buffer || "");
                                        for (var i=0;i<dbconnections.length;i++)
                                        {
                                            dbconnections[i].end();
                                        }
                                        return;
                                    }
                                    if (typeof(obj.__malS.response)=="string")
                                    {
                                        
                                        res.end(obj.__malS.response);
                                        for (var i=0;i<dbconnections.length;i++)
                                        {
                                            dbconnections[i].end();
                                        }
                                        return;
                                        return false;
                                    }
                                    
                                }
                                if (err)
                                {
                                    res.setHeader("content-type","text/html;charset=utf-8");
                                    res.statusCode=500;
                                    res.end("ERROR 500<br />Cannot open bound html page.");
                                    return false;
                                }
						        res.setHeader("set-cookie",tmpHeaderCookies);
						        res.end(Render(String(html),obj));
						        for (var i=0;i<dbconnections.length;i++)
						        {
						            dbconnections[i].end();
						        }
						    }
							function ErrorBlock(e)
							{
                                ReturnError500(e,res);
                            }
                            var Page=(new Function("function Page(req,Rnt,_Err,DBC,GetCookie,SetCookie,session,application,require,res){try{"+String(buf)+"\r\n}catch(e){_Err(e);}}return Page;"))();
							try
							{
							   DoProcess(Page,req,Returner,ErrorBlock);
						    }
						    catch (e)
						    {
						        ReturnError500(e,res);
						        return false;
						    }
							
						}
						catch (e)
						{
							ReturnError500(e,res);
							return false;
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
					        res.statusCode=500;
					        res.end(":(<br />FLIE SIZE OUT OF LIMIT.");
                            return false;
                        }
					    if (req.headers["content-type"] && req.headers["content-type"].indexOf("multipart/form-data")!=-1)
					    {
					        formType="formdata";
					        req.formType=true;
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
					            console.log("WARNING(ATTACKING): FILE SIZE OUT LIMIT.");
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
						        res.statusCode=500;
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
    						    },0);
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
                                            if (ps[i]=="")
                                            {
                                                continue;
                                            }
                                            if (req.parameters[ps[i].split("=")[0]]!=undefined)
                                            {
                                                req.parameters[ps[i].split("=")[0]]=new Array(req.parameters[ps[i].split("=")[0]]);
                                            }
                                            if (req.parameters[ps[i].split("=")[0]] instanceof Array)
                                            {
                                                req.parameters[ps[i].split("=")[0]].push(ps[i].split("=")[1]);
                                                req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]=req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1].replace(/\+/g," ");
                                                req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]=decodeURIComponent(req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]);
                                                continue;
                                            }
                                            req.parameters[ps[i].split("=")[0]]=ps[i].split("=")[1];
                                            req.parameters[ps[i].split("=")[0]]=req.parameters[ps[i].split("=")[0]].replace(/\+/g," ");
                                            req.parameters[ps[i].split("=")[0]]=decodeURIComponent(req.parameters[ps[i].split("=")[0]]);
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
        							        if (req.parameters[req.data[i].split("=")[0]]!=undefined)
        							        {
        							            req.parameters[req.data[i].split("=")[0]]=new Array(req.parameters[req.data[i].split("=")[0]]);
        							        }
        							        if (req.parameters[req.data[i].split("=")[0]] instanceof Array)
        							        {
        							            req.parameters[req.data[i].split("=")[0]].push(req.data[i].split("=")[1]);
        							            req.parameters[req.data[i].split("=")[0]][req.parameters[req.data[i].split("=")[0]].length-1]=req.parameters[req.data[i].split("=")[0]][req.parameters[req.data[i].split("=")[0]].length-1].replace(/\+/g," ");
        							            req.parameters[req.data[i].split("=")[0]][req.parameters[req.data[i].split("=")[0]].length-1]=decodeURIComponent(req.parameters[req.data[i].split("=")[0]][req.parameters[req.data[i].split("=")[0]]]);
        							            continue;
        							        }
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
                                            if (ps[i]=="")
                                            {
                                                continue;
                                            }
                                            if (req.parameters[ps[i].split("=")[0]]!=undefined)
                                            {
                                                req.parameters[ps[i].split("=")[0]]=new Array(req.parameters[ps[i].split("=")[0]]);
                                            }
                                            if (req.parameters[ps[i].split("=")[0]] instanceof Array)
                                            {
                                                req.parameters[ps[i].split("=")[0]].push(ps[i].split("=")[1]);
                                                req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]=req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1].replace(/\+/g," ");
                                                req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]=decodeURIComponent(req.parameters[ps[i].split("=")[0]][req.parameters[ps[i].split("=")[0]].length-1]);
                                                continue;
                                            }
                                            req.parameters[ps[i].split("=")[0]]=ps[i].split("=")[1];
                                            req.parameters[ps[i].split("=")[0]]=req.parameters[ps[i].split("=")[0]].replace(/\+/g," ");
                                            req.parameters[ps[i].split("=")[0]]=decodeURIComponent(req.parameters[ps[i].split("=")[0]]);
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
                                            if (obj.__malS)
                                            {
                                                if (typeof(obj.__malS.contentType)=="string")
                                                {
                                                    res.setHeader("content-type",obj.__malS.contentType);
                                                }
                                                if (obj.__malS.blockData==true)
                                                {
                                                    res.end(obj.__malS.buffer || "");
                                                    for (var i=0;i<dbconnections.length;i++)
                                                    {
                                                        dbconnections[i].end();
                                                    }
                                                    return;
                                                }
                                                if (typeof(obj.__malS.response)=="string")
                                                {
                                                    res.end(obj.__malS.response);
                                                    for (var i=0;i<dbconnections.length;i++)
                                                    {
                                                        dbconnections[i].end();
                                                    }
                                                    return false;
                                                }
                                                
                                            }
                                            if (err)
                                            {
                                                res.setHeader("content-type","text/html;charset=utf-8");
                                                res.statusCode=500;
                                                res.end("ERROR 500<br />Cannot open bound html page.");
                                                return false;
                                            }
                                            res.setHeader("set-cookie",tmpHeaderCookies);
                                            res.end(Render(String(html),obj));
                                            for (var i=0;i<dbconnections.length;i++)
                                            {
                                                dbconnections[i].end();
                                            }
                                        }
                                        function ErrorBlock(e)
                                        {
                                            ReturnError500(e,res);
                                            return false;
                                        }
                                        var Page=(new Function("function Page(req,Rnt,_Err,DBC,GetCookie,SetCookie,session,application,require,res){try{"+String(buf)+"\r\n}catch(e){_Err(e);}}return Page;"))();
                                        try
                                        {
                                           DoProcess(Page,req,Returner,ErrorBlock);
                                        }
                                        catch (e)
                                        {
                                            ReturnError500(e,res);
                                            return false;
                                        }							    
        							}
        							catch (e)
        							{
        								ReturnError500(e,res);
        								return false;
        							}
        			             }     
		                     }       
						});
					}
				});
			}
			catch (e)
			{
			    ReturnError500(e,res);
				return false;
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