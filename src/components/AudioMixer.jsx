import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import { Brain, CloudRain, Music, Wind } from "lucide-react";

import rainSrc from "../assets/audio/lluvia.mp3";
import pianoSrc from "../assets/audio/piano.mp3";
import binauralSrc from "../assets/audio/binaural.mp3";
import whiteNoiseSrc from "../assets/audio/ruido_blanco.mp3";

const AudioMixer = forwardRef(function AudioMixer(
  { audioMix, isPlaying },
  ref,
) {
  const audioRefs = useRef(null);

  const animationRefs = useRef({});

  if (audioRefs.current === null) {
    audioRefs.current = {
      rain: new Audio(rainSrc),

      piano: new Audio(pianoSrc),

      binaural: new Audio(binauralSrc),

      white: new Audio(whiteNoiseSrc),
    };
  }


  useEffect(() => {
    const audios = audioRefs.current;

    Object.entries(audios).forEach(([name, audio]) => {
      audio.loop = true;
      audio.volume = 0.001;
      audio.preload = "auto";
      audio.addEventListener("playing", () => {
        console.log(`${name} activo`);
      });
      audio.addEventListener("error", () => {
        console.error(`Error ${name}:`, audio.error);
      });
    });

    return () => {
      Object.values(audios).forEach((audio) => {
        audio.pause();

        audio.currentTime = 0;
      });
    };
  }, []);

  useImperativeHandle(ref, () => ({
    async startAudio() {
      console.log("Iniciando canales ambientales");

      const promises = Object.entries(audioRefs.current).map(
        async ([name, audio]) => {
          try {
            await audio.play();

            console.log(`${name} iniciado`);
          } catch (error) {
            console.error(`${name} bloqueado`, error);
          }
        },
      );

      await Promise.allSettled(promises);
    },

    stopAudio() {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
      });
    },
  }));

  
  const fadeTo = (name, value, duration) => {
    const audio = audioRefs.current[name];

    if (!audio) {
      return;
    }

    if (animationRefs.current[name]) {
      cancelAnimationFrame(animationRefs.current[name]);
    }

    const target = Math.max(0, Math.min(1, Number(value) || 0));
    const initial = audio.volume;
    const difference = target - initial;
    const start = performance.now();

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const smooth = progress * progress * (3 - 2 * progress);

      audio.volume = Math.max(0, Math.min(1, initial + difference * smooth));

      if (progress < 1) {
        animationRefs.current[name] = requestAnimationFrame(animate);
      } else {
        console.log(`${name}:`, audio.volume);
      }
    };

    animationRefs.current[name] = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!isPlaying || !audioMix) {
      return;
    }

    const duration = Math.max(
      100,
      (Number(audioMix.transition_seconds) || 4) * 1000,
    );

    fadeTo("rain", audioMix.rain_volume, duration);

    fadeTo("piano", audioMix.piano_volume, duration);

    fadeTo("binaural", audioMix.binaural_volume, duration);

    fadeTo("white", audioMix.white_noise_volume, duration);
  }, [audioMix, isPlaying]);


  useEffect(() => {
    if (isPlaying) {
      return;
    }

    Object.values(audioRefs.current).forEach((audio) => {
      audio.pause();
    });
  }, [isPlaying]);

  return (
    <div className=" bg-[#141419] p-4 rounded mb-5">
      <div className="mb-4">
        Estado emocional:{" "}
        <strong className=" text-[#a1b5cc] uppercase">
          {audioMix?.dominant_emotion || "neutral"}
        </strong>
      </div>

      <div className=" grid grid-cols-2 gap-4">
        <div>
          <Music size={14} />
          Piano: {Number(audioMix?.piano_volume ?? 0).toFixed(3)}
        </div>

        <div>
          <CloudRain size={14} />
          Lluvia: {Number(audioMix?.rain_volume ?? 0).toFixed(3)}
        </div>

        <div>
          <Brain size={14} />
          Binaural: {Number(audioMix?.binaural_volume ?? 0).toFixed(3)}
        </div>

        <div>
          <Wind size={14} />
          Ruido: {Number(audioMix?.white_noise_volume ?? 0).toFixed(3)}
        </div>
      </div>
    </div>
  );
});

export default AudioMixer;
