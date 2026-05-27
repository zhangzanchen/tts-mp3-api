import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        status: "error",
        message: "Only POST requests are allowed",
      });
    }

    const {
      text,
      voice = "alloy",
      speed = 1,
      format = "mp3",
    } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({
        status: "error",
        message: "Text is required",
      });
    }

    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      speed,
      response_format: format,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    const base64Audio = buffer.toString("base64");

    return res.status(200).json({
      openaiFileResponse: [
        {
          name: "speech.mp3",
          mime_type: "audio/mpeg",
          content: base64Audio,
        },
      ],
    });
  } catch (error) {
    console.error("TTS API error:", error);

    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to generate speech",
    });
  }
}
