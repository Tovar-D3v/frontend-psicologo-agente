import { API_URL } from "../config";

export const speakText = async (text) => {
  try {
    const response = await fetch(
      `${API_URL}/api/text-to-speech`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          text: text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Error generando audio");
    }

    const audioBlob = await response.blob();

    const audioUrl = URL.createObjectURL(audioBlob);

    const audio = new Audio(audioUrl);

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };

    await audio.play();

  } catch (error) {
    console.error("Error reproduciendo audio:", error);
  }
};
