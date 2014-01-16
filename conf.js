module.exports={runType: "sp",          //sp for single process, mc for multi clusters, mp for multiporcess
                folder: "sites/test/xxbb/",          //default root folder of this server
                domains: {"127.0.0.1:81": {folder: "sites/test/",active: "test"}},     //domain settings, domain, root folder, active folder
				port: 81,           //server running port
				postSize: 1024*1024*300,            //max file uploading size
				defaultIndex: "index.ajs",          //default index file 
				activeType: "ajs",                      //active file type, protected file will be converted into this
				cutType: "utf-8",                       //binary is fast, but does not support chinese file name, utf-8 is slow but support chinese filename when uploading files.
				protect: "htm",                         //protected file, visitors will not see the really source code of this type of files.
				sessionTimeout: 1000*60*5,              //session time out 
				clusterLength: 5,                       //cluster numbers, also, you can set as "auto", server will detect the machine's cpu cores.
				singleMaxConnection: 5,                 //a useless option for multi process running.
				activeModules: ["fs","net","os"],       //set which node module can be used in actives
				contentTypes: [{type: "htm",value: "text/html;charset=utf-8"},
							   {type: "html",value: "text/html;charset=utf-8"},
							   {type: "php",value: "text/html;charset=utf-8"},
							   {type: "jpg",value: "image/jpg"},
							   {type: "png",value: "image/png"},
							   {type: "txt",value: "text/text"},
							   {type: "js",value: "text/javascript"},
							   {type: "css",value: "text/css"}]};