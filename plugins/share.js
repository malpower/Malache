var fs=require("fs");
var conf=require("../conf");


function MyShare()
{
	function ServHandler(req,res)
	{
		fs.readdir(conf.folder,function(err,files)
		{
			if (err)
			{
				console.log("ERROR of MyShare!");
				res.end("ERROR 500");
				return false;
			}
			for (var i=0;i<files.length;i++)
			{
				res.write("<a href='/"+files[i]+"' target='_blank'>"+files[i]+"</a><br />");
			}
			res.end("<span styel='font-size: 11px;'>This plugin is powered by malpower</span>");
		});
	}
	Object.defineProperty(this,"servHandler",{configurable: false,
											  set: function(){},
											  get: function(){return ServHandler;}});
  	this.servName="malShare";
}




module.exports=new MyShare;