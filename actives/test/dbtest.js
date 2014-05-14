var db=new DBC;
db.connect({host: "127.0.0.1",
			user: "mal_dba",
			password: "mal123456",
			port: 3309,
			database: "malacheTest"});


db.query("select * from user_info",function(err,list)
{
	if (err)
	{
		console.log(err);
		return ;
	}
	console.log(list);
	Rnt({__malS: {response: JSON.stringify(list),
				  contentType: "text/html;charset=utf-8"}});
});