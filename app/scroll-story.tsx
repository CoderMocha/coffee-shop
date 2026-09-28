"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  {
    className: "story-chapter story-chapter--right",
    title: "Every grind has a landing.",
    body: "Grind size shapes surface area and how water carries flavor out of the bean.",
  },
  {
    className: "story-chapter story-chapter--left",
    title: "Aroma arrives first.",
    body: "Fruit, nuts and caramel are the cup's first introduction.",
  },
  {
    className: "story-chapter story-chapter--right story-chapter--low",
    title: "Clarity over weight.",
    body: "We roast for clean layers, so sweetness, acidity and finish each have room.",
  },
];

export function ScrollStory() {
  const storyRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const story = storyRef.current;
    const video = videoRef.current;
    if (!story || !video) return;

    let ctx: gsap.Context | undefined;
    let active = true;

    const warmVideo = async () => {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;

      try {
        await video.play();
      } catch {
        // Muted autoplay can still be blocked in strict browser modes.
      } finally {
        video.pause();
        video.currentTime = 0;
      }
    };

    const buildTimeline = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        video.currentTime = Math.min(video.duration * 0.55, 5.5);
        return;
      }

      const playhead = { time: 0 };
      ctx = gsap.context(() => {
        gsap.set(".story-chapter, .story-finale", { autoAlpha: 0, y: 28 });

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: story,
            start: "top top",
            end: "+=4200",
            pin: true,
            scrub: 0.65,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            playhead,
            {
              time: Math.max(0.01, video.duration - 0.08),
              duration: 10,
              onUpdate: () => {
                if (!Number.isFinite(playhead.time)) return;
                video.currentTime = playhead.time;
                if (currentTimeRef.current) {
                  currentTimeRef.current.textContent = `00:${Math.floor(playhead.time)
                    .toString()
                    .padStart(2, "0")}`;
                }
                if (progressRef.current) {
                  progressRef.current.style.transform = `scaleX(${playhead.time / video.duration})`;
                }
              },
            },
            0,
          )
          .to(".hero-copy", { autoAlpha: 0, y: -32, duration: 0.7 }, 1.2)
          .to(".story-chapter:nth-of-type(1)", { autoAlpha: 1, y: 0, duration: 0.55 }, 2.15)
          .to(".story-chapter:nth-of-type(1)", { autoAlpha: 0, y: -24, duration: 0.55 }, 3.5)
          .to(".story-chapter:nth-of-type(2)", { autoAlpha: 1, y: 0, duration: 0.55 }, 4.25)
          .to(".story-chapter:nth-of-type(2)", { autoAlpha: 0, y: -24, duration: 0.55 }, 5.65)
          .to(".story-chapter:nth-of-type(3)", { autoAlpha: 1, y: 0, duration: 0.55 }, 6.35)
          .to(".story-chapter:nth-of-type(3)", { autoAlpha: 0, y: -24, duration: 0.55 }, 7.8)
          .to(".story-finale", { autoAlpha: 1, y: 0, duration: 0.65 }, 8.45);
      }, story);
    };

    const initialize = async () => {
      await warmVideo();
      if (active) buildTimeline();
    };

    if (video.readyState >= 1) void initialize();
    else video.addEventListener("loadedmetadata", initialize, { once: true });

    return () => {
      active = false;
      video.removeEventListener("loadedmetadata", initialize);
      ctx?.revert();
    };
  }, []);

  return (
    <main>
      <section ref={storyRef} className="film-story" aria-label="MORROW coffee story">
        <video
          ref={videoRef}
          className="film-story__video"
          src="/coffee-film.mp4"
          poster="/coffee-poster.jpg"
          muted
          autoPlay
          playsInline
          preload="auto"
          aria-label="Ground coffee falling into a clear glass"
        />
        <div className="film-story__scrim" />

        <header className="site-nav">
          <a className="wordmark" href="#top" aria-label="MORROW home">
            MORROW
          </a>
          <nav className="site-nav__links" aria-label="Primary navigation">
            <a href="#origin">Origin</a>
            <a href="#roast">Roast</a>
            <a href="#taste">Notes</a>
          </nav>
          <a className="nav-action" href="#taste">Choose coffee</a>
        </header>

        <div className="hero-copy" id="top">
          <p className="hero-kicker">A COFFEE FILM</p>
          <h1>Ten seconds. One cup.</h1>
          <p className="hero-subtitle">Scroll to guide every grind, fall and aromatic shift beneath your fingertips.</p>
        </div>

        <div className="story-chapters">
          {chapters.map((chapter) => (
            <article className={chapter.className} key={chapter.title}>
              <h2>{chapter.title}</h2>
              <p>{chapter.body}</p>
            </article>
          ))}
        </div>

        <div className="story-finale">
          <p>MORROW</p>
          <h2>Flavor, in motion.</h2>
        </div>

        <div className="film-counter" aria-hidden="true">
          <span ref={currentTimeRef}>00:00</span>
          <span className="film-counter__track">
            <span ref={progressRef} className="film-counter__progress" />
          </span>
          <span>00:10</span>
        </div>
      </section>

      <section className="origin-section" id="origin">
        <div className="origin-copy">
          <p className="section-index">FROM ORIGIN</p>
          <h2>Flavor begins before tasting notes.</h2>
          <p>
            We start with origin, process and roast curve. The complexity stays behind the scenes. What reaches your cup is clarity.
          </p>
        </div>
        <figure className="origin-figure">
          <Image
            src="/coffee-detail-1.jpg"
            alt="Ground coffee forming a fine stream above a glass"
            fill
            sizes="(max-width: 767px) 100vw, 56vw"
          />
        </figure>
      </section>

      <section className="roast-section" id="roast">
        <p className="roast-statement">Light roast. Full expression.</p>
        <div className="roast-notes">
          <div>
            <span>Fruit</span>
            <p>The bright outline of origin stays intact.</p>
          </div>
          <div>
            <span>Sweetness</span>
            <p>Gentle caramelization catches the acidity.</p>
          </div>
          <div>
            <span>Finish</span>
            <p>Clean and lingering, without the burnt edge.</p>
          </div>
        </div>
      </section>

      <section className="taste-section" id="taste">
        <div className="taste-image">
          <Image
            src="/coffee-detail-2.jpg"
            alt="Ground coffee falling into a glass in a fluid arc"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </div>
        <div className="taste-copy">
          <h2>Taste with more clarity.</h2>
          <p>Choose the flavors you enjoy. We will match them with a coffee worth slowing down for.</p>
          <a href="mailto:hello@morrow.coffee">Choose coffee</a>
        </div>
      </section>

      <footer className="site-footer">
        <p className="wordmark">MORROW</p>
        <p>Every cup, with a clear point of origin.</p>
        <a href="mailto:hello@morrow.coffee">hello@morrow.coffee</a>
      </footer>
    </main>
  );
}
