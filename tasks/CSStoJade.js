var fs = require('fs');
fs.writeFile("./build/views/style.jade", "Hey there!", function (err) {
    if (err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
});