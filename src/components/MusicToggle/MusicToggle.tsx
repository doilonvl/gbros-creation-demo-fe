/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MusicToggle.module.css";

export type MusicToggleProps = {
  audioSrc?: string;
  lottieSrc?: string;
  className?: string;
};

export default function MusicToggle({
  audioSrc = "/musics/demoted2.mp3",
  lottieSrc = "/animations/sound-bars.json",
  className = "",
}: MusicToggleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lottieRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isActive = true;
    let animation: any;

    import("lottie-web").then((lottieModule) => {
      if (!isActive || !containerRef.current) return;
      const lottie = lottieModule.default;

      animation = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: false,
        path: lottieSrc,
      });

      lottieRef.current = animation;
      audioRef.current = new Audio(audioSrc);
    });

    return () => {
      isActive = false;
      if (animation) {
        animation.destroy();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc, lottieSrc]);

  const toggleMusic = () => {
    if (!audioRef.current || !lottieRef.current) return;

    if (!isPlaying) {
      audioRef.current.play();
      lottieRef.current.playSegments([0, 120], true);
    } else {
      audioRef.current.pause();
      lottieRef.current.stop();
    }

    setIsPlaying(!isPlaying);
  };

  const rootClassName = className ? `${styles.root} ${className}` : styles.root;

  return (
    <div className={rootClassName}>
      <button
        type="button"
        className={styles.button}
        onClick={toggleMusic}
        aria-pressed={isPlaying}
        aria-label="Toggle music"
      >
        <div
          ref={containerRef}
          className={styles.bars}
          style={{ width: "20px", height: "20px" }}
        />
        <span className={styles.label}>{isPlaying ? "on" : "off"}</span>
      </button>
    </div>
  );
}
