import { useRef, useState } from "react";

import { connectRealtime } from "../services/realtime_services";

const AUDIO_MIX_PREFIX = "__AUDIO_MIX__";

export default function VoiceAgent({ onAudioMix, onBeforeStart, onStop }) {
  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [status, setStatus] = useState("desconectado");
  const [connected, setConnected] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const findAudioMixInObject = (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const markerIndex = value.indexOf(AUDIO_MIX_PREFIX);

      if (markerIndex === -1) {
        return null;
      }

      const jsonText = value.substring(markerIndex + AUDIO_MIX_PREFIX.length);

      try {
        const payload = JSON.parse(jsonText);

        if (payload?.audio_mix) {
          return payload.audio_mix;
        }

        if (
          payload?.piano_volume !== undefined ||
          payload?.rain_volume !== undefined
        ) {
          return payload;
        }
      } catch (error) {
        console.error(
          "Encontré __AUDIO_MIX__ pero " + "no pude parsear el JSON:",
          jsonText,
          error,
        );
      }

      return null;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = findAudioMixInObject(item);

        if (result) {
          return result;
        }
      }

      return null;
    }

    if (typeof value === "object") {
      for (const child of Object.values(value)) {
        const result = findAudioMixInObject(child);

        if (result) {
          return result;
        }
      }
    }

    return null;
  };

  const handleRealtimeEvent = (event) => {
    try {
      const data = JSON.parse(event.data);

      console.log("Realtime event:", data);

      const audioMix = findAudioMixInObject(data);

      if (audioMix) {
        onAudioMix?.(audioMix);
      }

      switch (data.type) {
        case "session.created":
          break;

        case "session.updated":
          break;

        case "input_audio_buffer.speech_started":
          setStatus("escuchando");

          break;

        case "input_audio_buffer.speech_stopped":
          setStatus("procesando");

          break;

        case "output_audio_buffer.started":
          setStatus("hablando");

          break;

        case "output_audio_buffer.stopped":
          setStatus("escuchando");

          break;

        case "conversation.item.input_audio_transcription.completed":
          break;

        case "response.output_audio_transcript.done":
          break;

        case "conversation.item.added":
          break;

        case "conversation.item.done":
          break;

        case "response.created":
          setStatus("procesando");
          break;

        case "response.done":
          setStatus("escuchando");

          break;

        case "error":
          break;

        default:
          break;
      }
    } catch (error) {
      console.error("Error procesando evento Realtime:", event.data, error);
    }
  };

  const startRealtime = async () => {
    if (connected || isStarting) {
      return;
    }

    setIsStarting(true);

    setStatus("conectando");

    try {
      await onBeforeStart?.();
      const pc = new RTCPeerConnection();

      peerConnectionRef.current = pc;

      pc.onconnectionstatechange = () => {
        console.log("WebRTC state:", pc.connectionState);

        if (pc.connectionState === "connected") {
          setConnected(true);

          setStatus("escuchando");
        }

        if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
          setConnected(false);

          setStatus("desconectado");
        }
      };

      pc.ontrack = (event) => {
        if (!remoteAudioRef.current) {
          return;
        }

        remoteAudioRef.current.srcObject = event.streams[0];

        remoteAudioRef.current.play().catch((error) => {
          console.error("❌ Error reproduciendo " + "audio GPT:", error);
        });
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });

      localStreamRef.current = stream;

      stream.getAudioTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const dataChannel = pc.createDataChannel("oai-events");

      dataChannelRef.current = dataChannel;

      dataChannel.onopen = () => {
        console.log("DataChannel Realtime abierto");
      };

      dataChannel.onmessage = handleRealtimeEvent;

      dataChannel.onerror = (error) => {
        console.error("DataChannel error:", error);
      };

      dataChannel.onclose = () => {
        console.log("DataChannel cerrado");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const response = await connectRealtime(offer.sdp);

      const answer = {
        type: "answer",

        sdp: response.sdp,
      };

      await pc.setRemoteDescription(answer);

      setConnected(true);

      setStatus("escuchando");
    } catch (error) {
      console.error("Error iniciando Realtime:", error);

      stopRealtime();
    } finally {
      setIsStarting(false);
    }
  };

  const stopRealtime = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch {}
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.close();
      } catch {}
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
    }

    peerConnectionRef.current = null;
    dataChannelRef.current = null;
    localStreamRef.current = null;

    setConnected(false);
    setStatus("desconectado");
    onStop?.();
  };

  return (
    <div className=" flex flex-col items-center gap-4">
      <audio ref={remoteAudioRef} autoPlay />

      <div className=" text-lg font-bold">Agente de Voz</div>

      <div>
        Estado: <span className="font-bold">{status}</span>
      </div>

      {!connected ? (
        <button
          onClick={startRealtime}
          disabled={isStarting}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50
          "
        >
          {isStarting ? "Conectando..." : "Iniciar Realtime"}
        </button>
      ) : (
        <button
          onClick={stopRealtime}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Detener Realtime
        </button>
      )}
    </div>
  );
}
