if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const path  = require("path");
const ejsMate = require("ejs-mate");
const mongoose = require('mongoose');
const Journal =require("./models/journals");
const methodOverride = require('method-override')
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const authRoutes = require("./routes/auth-routes");
const CryptoJs = require("crypto-js");
const wrapAsync = require("./utils/wrapAsync")
// const cookieSession = require('cookie-session');
const Conversation = require("./models/message");

const bodyParser = require('body-parser');
const chatgpt = require('./chatgpt');



app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"));
// app.use(cookieSession({
//     maxAge: 24*60*60*1000,
//     keys:["sfgfgdfgsdgdsf"]
// }));
const key = process.env.ENC_DEC_KEY;

app.use(express.urlencoded({extended:true}));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,'public')));
app.use(methodOverride("_method"));
app.use(flash());
app.use(bodyParser.json());


const moment = require('moment');
const FormattedDate1 = moment().format('dddd, MMM D');
const port = 3000;
const dbUrl =process.env.ATLASDB_URL ;

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{
        secret: process.env.SECRET,
        touchAfter: 24*3600,
    }
});



const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
      expires: Date.now() + 7*24*60*60*1000,
      maxAge: 7*24*60*60*1000,
      httpOnly: true,
    },
  };
  
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error   = req.flash("error");
    res.locals.currUser = req.user;
    next();
  })


main().then(()=>{
    console.log("connected to DB");
})
.catch((err)=>{
    console.log(err);
});

async function main() {
  await mongoose.connect(dbUrl, {
  }); 
}


let isLoggedin = (req,res,next)=>{
    
    if(!req.isAuthenticated()){
        req.session.requiredUrl = req.originalUrl;
       return res.redirect("/auth/login");
      }
      next();
}



app.get("/home",isLoggedin,(req,res)=>{
    res.render("index/home.ejs",{FormattedDate1});
})

app.get("/",(req,res)=>{
    res.render("index.ejs");
})

app.get("/journal", wrapAsync(async (req, res) => {
    const user = res.locals.currUser.username;
    const conversation = await Conversation.findOne({ user });
    // console.log(conversation);

    if (!conversation) {
        return res.render("index/journal.ejs", { journals: [] });
    }

    const sessions = conversation.sessions.map(session => {
        return {
            date: moment(session.date).format('DD-MM-YYYY'),
            messages: session.messages,
        };
    });
    res.render("index/journal.ejs",{sessions} );
}));

app.get("/journal/new",isLoggedin,(req,res)=>{
    res.render("journals/newForm.ejs");
})

app.post("/journal/new",wrapAsync(async(req,res)=>{
    try{
        let{title,message} = req.body;
        const encryptedTitle = CryptoJs.AES.encrypt(title,key).toString();
        const encryptedMess = CryptoJs.AES.encrypt(message,key).toString();
        const newJournal = new Journal({title:encryptedTitle,message:encryptedMess});
    
        newJournal.owner = res.locals.currUser._id;
        console.log(newJournal);
        await newJournal.save();
        req.flash("success","Your journal entry has been added successfully!");
        res.redirect("/home"); 
    }catch(err){
        req.flash("error","Some error occured please try again later!");
        res.redirect("/home");
    }
     
}))

app.get("/myJournals",isLoggedin, wrapAsync(async (req,res)=>{
   
try {
    const id = res.locals.currUser._id;
    const allJournals = await Journal.find({ owner: id });

      // Decrypt titles and messages in allJournals
      const decryptedJournals = allJournals.map(journal => {
        const decryptedJournal = { ...journal };

        // Decrypt title
        const titleBytes = CryptoJs.AES.decrypt(journal.title, key);
        decryptedJournal.title = titleBytes.toString(CryptoJs.enc.Utf8);

        // Decrypt message
        const messageBytes = CryptoJs.AES.decrypt(journal.message, key);
        decryptedJournal.message = messageBytes.toString(CryptoJs.enc.Utf8);

        decryptedJournal._id = journal._id;

        return decryptedJournal;
    });

    console.log(decryptedJournals);
    res.render("journals/show.ejs", {decryptedJournals});

} catch (err) {
    console.log(err);
    res.redirect("/home");
}
}))

app.get("/myJournals/:id/edit",isLoggedin, wrapAsync(async(req,res)=>{
    try {
        let { id } = req.params;
        let journal = await Journal.findById(id);
    
        // Decrypt title
        const titleBytes = CryptoJs.AES.decrypt(journal.title, key);
        const decryptedTitle = titleBytes.toString(CryptoJs.enc.Utf8);
    
        // Decrypt message
        const messageBytes = CryptoJs.AES.decrypt(journal.message,key);
        const decryptedMessage = messageBytes.toString(CryptoJs.enc.Utf8);
    
        journal.title = decryptedTitle;
        journal.message = decryptedMessage;
        console.log(journal);
    
        res.render("journals/edit.ejs", { journal });
    } catch (err) {
        req.flash("error", "Get Logged In first");
        res.redirect("/home");
    }
   
}))

app.put("/myJournals/:id/update",wrapAsync( async(req,res)=>{
    let {id} = req.params;
    let{title,message} = req.body;
    const encryptedTitle = CryptoJs.AES.encrypt(title,key).toString();
     const encryptedMess = CryptoJs.AES.encrypt(message,key).toString();

    let updatedJournal = await Journal.findByIdAndUpdate(id,{title:encryptedTitle,message:encryptedMess});

    await updatedJournal.save();
    res.redirect("/myJournals");
}))

app.delete("/myJournals/:id", wrapAsync(async(req,res)=>{
    let {id} = req.params;
    let deletedJournal = await Journal.findByIdAndDelete(id);
    console.log(deletedJournal);
    res.redirect("/myJournals");
}))


// authentication routes

app.get("/signup",(req,res)=>{
    res.render("user/signup.ejs");
})

app.post("/signup",wrapAsync(async (req,res)=>{
    try{
        let{username,email,password} = req.body;
        const newUser = new User({email,username});
        const registeredUser = await User.register(newUser,password);
        console.log(registeredUser);
        req.login(registeredUser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","welcome to MindEchoes");
        res.redirect("/onBoarding");
       })
       
    } catch(e){
        req.flash("error",e.message);
        res.redirect("/signup");
    }
}))

app.use("/auth",authRoutes);

// chat routes

app.get("/onboarding",(req,res)=>{
    res.render("./AiChat/onBoarding");
})

app.post('/onBoarding', (req, res) => {
    const selectedChoices = req.body;
    console.log(selectedChoices);
    res.json({ message: 'Data received successfully' });
});


app.get("/aichat", async (req, res) => {
    let user = res.locals.currUser.username;

    // Generate the initial message for the new session
    const message = await chatgpt.generateResponse(`Say hi to ${user} and from now you should act as journalling assistant`);

    res.render("./AiChat/chat.ejs", { initialMessage: message });
});



app.post('/send-message', async (req, res) => {
    const userMessage = req.body.message;
    const user = res.locals.currUser.username;
    const sessionId = req.sessionID;

    // Find the conversation for the user
    let conversation = await Conversation.findOne({ user });

    // If no conversation exists, create a new one
    if (!conversation) {
        conversation = new Conversation({
            user,
            sessions: []
        });
    }

    // Find the session in the conversation
    let session = conversation.sessions.find(s => s.sessionId === sessionId);

    // If the session doesn't exist, create a new one
    if (!session) {
        session = {
            sessionId,
            messages: []
        };
        conversation.sessions.push(session);
    }

    // Add the user's message to the session
    session.messages.push({
        sender: user,
        content: userMessage
    });

    // Process the user message and generate a response
    const chatbotResponse = await chatgpt.generateResponse(userMessage);
    session.messages.push({
        sender: 'chatBot',
        content: chatbotResponse
    });

    // Save the conversation
    await conversation.save();

    res.json({ message: chatbotResponse });
});

// app.get('/send-message', async (req, res) => {
//   // Initial message from the bot
//   const message = await chatgpt.generateResponse('say hi to user and from now you are journaling ');
//   res.render({ message });
// });

// app.post('/send-message', async (req, res) => {
//   const userMessage = req.body.message;
//   // Save user message to MongoDB
// //   const chatMessage = new ChatMessage({ message: userMessage });
// //   await chatMessage.save();

//   // Get response from ChatGPT based on user message
//   const botResponse = await chatgpt.generateResponse(userMessage);
//   res.send({ message: botResponse });
// });


app.all("*",(req,res,next)=>{
    res.send("Page Not Found 404!");
})

app.listen(port,()=>{
    console.log(`Server is listening on port ${port}`);
})