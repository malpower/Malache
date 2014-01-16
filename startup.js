var cp=require("child_process");
var conf=require("./conf");
switch (conf.runType)
{
    case "mp":
        cp.fork("./malache_dual");
        break;
    case "sp":
        cp.fork("./malache_single");
        break;
    case "mc":
        cp.fork("./malache_cluster");
        break;
    default:
        console.log("please set \"runType\" in conf.js!!");
}