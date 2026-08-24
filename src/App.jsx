import { useCallback, useRef, useState } from "react";

import AudioMixer from "./components/AudioMixer";
import VoiceAgent from "./components/VoiceAgent";

const DEFAULT_AUDIO_MIX = {
  dominant_emotion: "neutral",
  rain_volume: 0.04,
  piano_volume: 0.08,
  binaural_volume: 0.04,
  white_noise_volume: 0,
  transition_seconds: 4,
};

export default function App() {
  const audioMixerRef = useRef(null);
  const [audioMix, setAudioMix] = useState(DEFAULT_AUDIO_MIX);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleBeforeStart = useCallback(async () => {
    console.log("🔊 Iniciando AudioMixer");

    await audioMixerRef.current?.startAudio();

    setIsPlaying(true);
  }, []);

  const handleAudioMix = useCallback((mix) => {
    setAudioMix({
      dominant_emotion: mix.dominant_emotion ?? "neutral",
      rain_volume: Number(mix.rain_volume) || 0,
      piano_volume: Number(mix.piano_volume) || 0,
      binaural_volume: Number(mix.binaural_volume) || 0,
      white_noise_volume: Number(mix.white_noise_volume) || 0,
      transition_seconds: Number(mix.transition_seconds) || 4,
    });
  }, []);

  const handleStop = useCallback(() => {
    audioMixerRef.current?.stopAudio();
    setIsPlaying(false);
    setAudioMix(DEFAULT_AUDIO_MIX);
  }, []);

  return (
    <div
      className="bg-[#050506] text-white min-h-screen p-8"
    >
      <h1
        className=" text-3xl font-bold mb-6"
      >
        Cabina
      </h1>

      <AudioMixer
        ref={audioMixerRef}
        audioMix={audioMix}
        isPlaying={isPlaying}
      />

      <VoiceAgent
        onBeforeStart={handleBeforeStart}
        onAudioMix={handleAudioMix}
        onStop={handleStop}
      />
    </div>
  );
}
