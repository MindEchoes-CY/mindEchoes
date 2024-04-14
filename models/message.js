const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new mongoose.Schema({
    user: String,
    sessions: [
        {
            sessionId: String,
            date:{
                type: Date,
                default:Date.now
            },
            messages: [
                {
                    sender: String,
                    content: String,
                    timestamp: { type: Date, default: Date.now }
                }
            ]
        }
    ]
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;