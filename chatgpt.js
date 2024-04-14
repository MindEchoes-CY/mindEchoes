const express = require("express")  
const OpenAI = require("openai")
const app = express();
app.use(express.json()) 

const openai = new OpenAI({
  // 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
    apiKey:"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"
})




async function generateResponse(message) {
    const response = await openai.chat.completions.create({
                model:'gpt-3.5-turbo',
                messages:[{"role":"user","content":message}],
                max_tokens:100
            });
   
  
    if (!response.choices || response.choices.length === 0) {
      return 'Sorry, I could not generate a response.';
    }
  
    return response.choices[0].message.content; // Assuming the response is a string
  }
  
  module.exports = { generateResponse };
  
  


