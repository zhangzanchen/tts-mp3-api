import OpenAI from "openai";
import { put } from "@vercel/blob";

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

    const filename = `speech-${Date.now()}.mp3`;

    const blob = await put(filename, buffer, {
      access: "public",
      contentType: "audio/mpeg",
    });

    return res.status(200).json({
      status: "success",
      filename,
      format: "mp3",
      audio_url: blob.url,
      message: "MP3 generated successfully.",
    });
  } catch (error) {
    console.error("TTS API error:", error);

    return res.status(500).json({
      status: "error",
      message: error.message || "Failed to generate speech",
    });
  }
}
