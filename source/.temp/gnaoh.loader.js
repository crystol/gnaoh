!function(a,b){"use strict";var c="/library/js";a.require.config({baseUrl:"js/",paths:{lib:c,jQuery:["//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min",c+"/jQuery"],analytics:[("https:"===b.location.protocol?"https://ssl":"http://www")+".google-analytics.com/ga"]}}),a.require(["gnaoh"]),a.onload=function(){for(var c,d=b.cookie.split(";").sort();d.length;)if(c=d.pop(),/^Remote/.test(c)){c=c.split("=")[1];break}var e=a._gaq||[];e.push(["_setAccount","UA-38948913-1"],["_setDomainName","none"],["_trackPageview"],["_setCustomVar",1,"Remote",c,1]),a._gaq=e,a.require(["analytics"])}}(window,document);