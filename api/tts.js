import { put } from "@vercel/blob";

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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Missing OPENAI_API_KEY",
      });
    }

    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        voice,
        input: text,
        speed,
        response_format: format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        status: "error",
        message: "OpenAI TTS request failed",
        details: errorText,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
