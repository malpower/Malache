var rt=require("ok.js");

rt.print();

var id=Number(req.parameters["id"]);
if (id!=id)
{
    Rnt({__malS: {contentType: "text/plain", response: "404"}});
    return;
}
if (session.imgs[id])
{
    Rnt({__malS: {contentType: "image/*", blockData: true, buffer: session.imgs[id]}});
}
