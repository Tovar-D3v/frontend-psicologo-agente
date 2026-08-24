import { useState, useRef, useEffect } from "react";
import { speakText } from "../services/speed_text_service";

export default function Chat({
  messages,
  onSendMessage,
  isDisabled,
}) {
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!input.trim()) return;

    onSendMessage(input);
    setInput("");
  };

  const handleSpeak = async (text) => {
    try {
      await speakText(text);
    } catch (error) {
      console.error("Error reproduciendo audio:", error);
    }
  };

  return (
    <div>
      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            <p>{msg.content}</p>

            {msg.role === "assistant" && (
              <button
                type="button"
                onClick={() => handleSpeak(msg.content)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                🔊 Escuchar
              </button>
            )}
          </div>
        ))}

        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isDisabled
              ? "Haz clic abajo para iniciar..."
              : "Escribe cómo te sientes..."
          }
          disabled={isDisabled}
        />

        <button type="submit" disabled={isDisabled}>
          Enviar
        </button>
      </form>
    </div>
  );
}