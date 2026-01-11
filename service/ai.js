const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analyzeImageAndGenerateContent(
  imageBuffer,
  mimeType,
  userText = "",
  style = "default"
) {

  const modelsToTry = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-pro-vision"
  ];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting to use model: ${modelName}`);

      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `
You are an AI content assistant for a modern photo-based blogging platform.

Analyze the uploaded image and optional user text, then generate:
1. A short attractive Title
2. A creative Caption
3. 10–15 relevant Hashtags

The content must be based on the actual image — not generic guesses.

You must infer:
- Objects in the image
- Scene (city, beach, indoor, night, nature, sunset, etc.)
- Mood (calm, happy, dark, aesthetic, luxury, emotional, etc.)
- Style (vintage, cinematic, minimal, modern, old-money, artistic, etc.)

User text: "${userText}"
Requested style: "${style}"

Style guide:
poetic → artistic, expressive  
professional → clean, informative  
minimal → short and simple  
luxury → elegant, premium  
emotional → deep feelings  
funny → light humor  

Return JSON only in this format:

{
  "title": "",
  "caption": "",
  "hashtags": [],
  "detected": {
    "scene": "",
    "mood": "",
    "style": "",
    "objects": []
  }
}
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType
        }
      };

      const result = await model.generateContent([
        { text: prompt },
        imagePart
      ]);

      const text = result.response.text();
      console.log(`Success with model: ${modelName}`);
      console.log("Raw AI response:", text);

      let clean = text.replace(/```json|```/g, "").trim();
      clean = clean.substring(clean.indexOf("{"), clean.lastIndexOf("}") + 1);

      return JSON.parse(clean);

    } catch (err) {
      console.warn(`Model failed: ${modelName}`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

module.exports = { analyzeImageAndGenerateContent };
