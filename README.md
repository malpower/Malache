Malache
=======

This is a web server based on nodeJS.
http://malache.malpower.net/




A sample site is already in the folder /sites now.
Fine, i'll write a readme after a while.


um......first, this is a HTTP server.
web developers can create it's own web site with this simple http server.


here are some site which is using malache:



http://malache.malpower.net/        (of course us)

http://www.malpower.net/            (of course me)

http://lu.malpower.net/             (a picture searching engine....um.....frontend is using malache)


http://www.yinchuang.cc/            (an enterprise homepage)




so, let me explain programming structure for malche.



first, you should config malache for your site.
ocnf.js is malache's configuration file. it is a json structure text file. im a lazy boy, i dont wanna explain each column of that file, but you can see the example to know how to edit this file.



and then, about the page programming.in static front page, you can use active tags only. you can code one or more active processer(s) to make the static page activity.
put the static page into folder /sites/ and put the active processers into /active/. don't forget the path of you configured in conf.js .




i will make a API doc after then to show you all the apis in malache.as for now, you can see the sample to konw it.
sample included all most apis of malache.



any emergency qeustion, you can mail me at: malpower@ymail.com or my tencent QQ at: 286689919.













