var os=require("os");
var fs=require("fs");

function Services(ex)
{
	fs.readFile("plugins/config/list.conf",function(err,data)
	{
		if (err)
		{
			console.log("list.conf has lost, please check it if it exists.");
			process.exit(1);
		}
		var plugins=String(data).split("|");
		for (var i=0;i<plugins.length;i++)
		{
			if (plugins[i]=="")
			{
				continue;
			}
			var p=require("./plugins/"+plugins[i]);
			ex.regService(p.servName,p.servHandler);
		}
	});
}

module.exports=Services;