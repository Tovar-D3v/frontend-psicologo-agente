import { API_URL } from "../config";

export const connectRealtime = async (offerSdp, sessionId) => {
  const params = new URLSearchParams();

  if (sessionId) {
    params.set("session_id", sessionId);
  }

  const url =
    `${API_URL}/api/realtime/connect` +
    (params.toString() ? `?${params.toString()}` : "");

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/sdp",
    },

    body: offerSdp,
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(error);
  }

  return response.json();
};
