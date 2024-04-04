const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const journalSchema = new Schema({
    title:{
        type: String,
        required:true,
    },
    message:{
        type:String,
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
})

const Journal = mongoose.model("Journal",journalSchema);


module.exports = Journal;