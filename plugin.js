var fs=require("fs");


(function()
{
	var args=process.argv;
	if (args.length<3)
	{
		console.log("not enough arguments to run this tool.");
		process.exit(0);
	}
	
	var commandList=[{arg: "list",fn: List},
					 {arg: "install",fn: Install},
					 {arg: "remove",fn: Remove}];
	for (var i=0;i<commandList.length;i++)
	{
		if (args[2]==commandList[i].arg)
		{
			setTimeout(commandList[i].fn,0,args);
			return true;
		}
	}
	console.log("Bad command.\r\nPlease use list, install and remove only.");
	return false;
})();


function List(args)
{
	fs.readFile("./plugins/config/list.conf",function(err,buf)
	{
		if (err)
		{
			console.log("list.conf has lost, please check it if it exists.");
			process.exit(0);
		}
		var plugins=String(buf).split("|");
		for (var i=0;i<plugins.length;i++)
		{
			console.log(i+"-->"+plugins[i]);
		}
	});
}

function Install(args)
{
	fs.readFile("./plugins/config/list.conf",function(err,buf)
	{
		if (err)
		{
			console.log("list.conf has lost, please check it if it exists.");
			process.exit(0);
		}
		var plugins=String(buf).split("|");
		fs.readFile("./plugins/"+args[3]+".js",function(err,buf)
		{
			if (err)
			{
				console.log("Cannot find "+args[3]+".js in plugin folder.");
				process.exit(0);
			}
			plugins.push(args[3]);
			fs.writeFile("./plugins/config/list.conf",plugins.join("|"),function(err)
			{
				if (err)
				{
					console.log("Writing conf file failed!");
					process.exit(0);
				}
				console.log("Plugin installed.\r\nPlease restart server.");
			});
		});
	});
}

function Remove(args)
{
	fs.readFile("./plugins/config/list.conf",function(err,buf)
	{
		if (err)
		{
			console.log("list.conf has lost, please check it if it exists.");
			process.exit(0);
		}
		var plugins=String(buf).split("|");
		function Delete(i)
		{
			plugins.splice(i,1);
			fs.writeFile("./plugins/config/list.conf",plugins.join("|"),function(err)
			{
				if (err)
				{
					console.log("Writing conf file failed.");
					process.exit(0);
				}
				console.log("Plugin "+args[3]+" has been removed.");
			});
		}
		for (var i=0;i<plugins.length;i++)
		{
			if (plugins[i]==args[3])
			{
				Delete(i);
				return true;
			}
		}
		console.log("Cannot find "+args[3]+" module.");
	});
}