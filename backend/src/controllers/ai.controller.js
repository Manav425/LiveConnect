import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getAIResponse(req, res) {
  try {
    const { message, targetUserId } = req.body;
    const currentUser = req.user;

    const targetUser = await User.findById(targetUserId);

    const systemPrompt = `You are Lingua, a friendly AI language assistant inside a language exchange chat app.
The current user's name is ${currentUser.fullName}.
They speak ${currentUser.nativeLanguage} natively and are learning ${currentUser.learningLanguage}.
They are chatting with ${targetUser.fullName} who speaks ${targetUser.nativeLanguage} natively and is learning ${targetUser.learningLanguage}.

You help with:
- Translating messages between their languages
- Correcting grammar mistakes kindly
- Suggesting conversation starters in the learning language
- Explaining phrases or words

Always be encouraging, brief, and friendly. Format responses cleanly.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Error in getAIResponse controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}