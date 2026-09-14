import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import MaskedHeading from './MaskedHeading';
import heroImage from '../assets/hero.png';
import './IntroSplash.css';

// Wie lange der Text nach dem Einblenden stehen bleibt, bevor der Zoom startet.
const HOLD_MS = 850;
// Muss ungefähr zur `duration` unten passen (Reveal-Animation der MaskedHeading).
const REVEAL_DURATION = 1.15;
const ZOOM_DURATION = 1.1;

// Voller schwarzer Screen mit riesiger, maskierter Überschrift beim ersten
// Laden/Refresh der App. Danach zoomt der Screen rein (skaliert stark hoch
// und blendet aus) und gibt den Blick auf die eigentliche Anwendung frei,
// die im Hintergrund bereits fertig gerendert ist.
export default function IntroSplash({ onDone }) {
  const rootRef = useRef(null);
  const [zooming, setZooming] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      // Wer reduzierte Bewegung eingestellt hat, bekommt keinen erzwungenen
      // Zoom/Reveal-Effekt aufgedrängt — direkt zur App.
      onDone?.();
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => setZooming(true), REVEAL_DURATION * 1000 + HOLD_MS);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [onDone]);

  useEffect(() => {
    if (!zooming) return undefined;
    const el = rootRef.current;
    if (!el) {
      onDone?.();
      return undefined;
    }

    const tween = gsap.to(el, {
      scale: 22,
      opacity: 0,
      duration: ZOOM_DURATION,
      ease: 'power3.in',
      onComplete: () => {
        document.body.style.overflow = '';
        onDone?.();
      },
    });

    return () => tween.kill();
  }, [zooming, onDone]);

  return (
    <div ref={rootRef} className="intro-splash">
      <MaskedHeading
        text="LeadForge"
        tag="h1"
        src={heroImage}
        trigger="auto"
        reveal="rise"
        align="center"
        duration={REVEAL_DURATION}
        textScale={0.34}
        minFontSize={56}
        maxFontSize={460}
        fillScale={1.15}
        parallax={0}
        drift={8}
        style={{ width: 'min(92vw, 1400px)' }}
      />
    </div>
  );
}
