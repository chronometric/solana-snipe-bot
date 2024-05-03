const fs = require("fs");
require('dotenv').config()
const fetch = require('node-fetch');
const JSONdb = require('simple-json-db'); 
var myObject = []
const key = process.env.NFTPORT_API_KEY;
const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: process.env.NFTPORT_API_KEY
    }
};

// Checking if arguments are passed
if (process.argv.length < 3) {
    console.log("Usage: node get_snapshot.js <project_name>");
    process.exit(1);
}
// If using peach, change the page number to a bigger number

// collection slug
let project = "";
switch (process.argv[2]) {
    case "project_name":
        project = process.env.NFTPORT_COLLECTION_SLUG
        break;
// add more cases if you need to track several projects
}

// check existing file  
const filename = `json/snapshot_${process.argv[2]}.json`
const filename2 = `csv/snapshot_${process.argv[2]}.csv`
//create new file if not exist
if (!fs.existsSync(filename)) {
    fs.closeSync(fs.openSync(filename, 'w'));
}
const file = fs.readFileSync(filename)
if (file.length > 0) {
    console.log("file exists, append data")
    var jsn = JSON.parse(file.toString())
    jsn = [...jsn, ...myObject];
    myObject = jsn;
}

else {
    console.log("Create file: ", filename)
}



let i = 1;
