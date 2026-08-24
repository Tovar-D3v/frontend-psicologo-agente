import { API_URL } from '../config';

export const startSession = async (sessionId) => {
  const response = await fetch(
    `${API_URL}/api/chat/start?session_id=${sessionId}`
  );

  if (!response.ok) {
    throw new Error(`Error al iniciar sesión: ${response.status}`);
  }

  return await response.json();
};

export const sendMessage = async (sessionId, message) => {
  const response = await fetch(`${API_URL}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Error al enviar mensaje: ${response.status}`);
  }

  return await response.json();
};

