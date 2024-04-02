const express = require("express");
const app = express();
const path  = require("path");
const ejsMate = require("ejs-mate");



app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,'public')));
const moment = require('moment');
const FormattedDate1 = moment().format('dddd, MMM D');
const port = 3000;
app.get("/home",(req,res)=>{
    res.render("index/home.ejs",{FormattedDate1});
})

app.get("/",(req,res)=>{
    res.send("Page Coming Soon!");
})

app.get("/journal",(req,res)=>{
    res.render("index/journal.ejs");
})

app.get("/new",(req,res)=>{
    res.render("journals/addnew.ejs");
})

app.listen(port,()=>{
    console.log(`Server is listening on port ${port}`);
})