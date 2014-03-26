var x=new String;
var that=this;
var jj=new String;
session.imgs=new Array;
for (var i=0;i<req.files.length;i++)
{
    x+=req.files[i].filename+"<br />";
    this.fs.writeFileSync(this.path+"/xxbb/"+req.files[i].filename,req.files[i].chunk);
    session.imgs[i]=req.files[i].chunk;
    jj+="<img src='"+("/pic.ajs?id="+i)+"' /><br />";
}
for (var i in req.parameters)
{
    x+=i+":"+req.parameters[i]+"<br />";
}

var html=this.fs.readFileSync(this.path+"index.htm","utf-8");
SetCookie("WEOIRU","23948723948723948273");
SetCookie("malpower","cookietest");
var y=session.ok;
session.ok="MALPOWER";
Rnt({chunk: "<h1>"+x+"</h1>",abc: "sss",path: that.path,html: html,ck: y,imgs: jj});
