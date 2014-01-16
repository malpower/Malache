
function Extends(sys)
{
	var servList=new Array;
	function RunService(req,res,share)
	{
		for (var i=0;i<servList.length;i++)
		{
			if (req.url.split("?")[0]=="/"+servList[i].servName)
			{
				setTimeout(function()
				{
					res.setHeader("content-type","text/html;charset=utf-8");
					servList[i].servHandler(req,res,share);
				},0);
				return true;
			}
		}
		return false;
	}
	function RegService(url,fn)
	{
		if (typeof(fn)=="function" && typeof(url)=="string")
		{
			servList.push({servName: url,servHandler: fn});
		}
	}
	Object.defineProperty(this,"regService",{configurable: false,
											 set: function(){console.log("ERROR: readonly action.");},
											 get: function(){return RegService;}});
	Object.defineProperty(this,"runService",{configurable: false,
											 set: function(){console.log("ERROR: readonly action.");},
											 get: function(){return RunService;}});
}



module.exports=Extends;