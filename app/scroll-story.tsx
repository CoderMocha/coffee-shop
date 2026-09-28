"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  {
    className: "story-chapter story-chapter--right",
    title: ["Grind sets", "the pace."],
    body: "Fine particles release sweetness quickly. Coarser ones leave more room for clarity.",
  },
  {
    className: "story-chapter story-chapter--left",
    title: ["Water carries", "the story."],
    body: "Aroma lifts first. Fruit, caramel and cacao follow in clean layers.",
  },
  {
    className: "story-chapter story-chapter--right story-chapter--low",
    title: ["Clarity", "stays."],
    body: "A precise roast lets each note arrive distinct, then linger.",
  },
];

const FRAME_RATE = 24;
const FRAME_COUNT = 240;
const FRAMES_PER_SHEET = 30;
const SHEET_COUNT = 8;
const SHEET_COLUMNS = 6;
const FRAME_WIDTH = 800;
const FRAME_HEIGHT = 450;

const sheetUrl = (index: number) =>
  `/film-sheets/sheet-${index.toString().padStart(2, "0")}.jpg`;

export function ScrollStory() {
  const storyRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const story = storyRef.current;
    const canvas = canvasRef.current;
    if (!story || !canvas) return;

    const drawingContext = canvas.getContext("2d", { alpha: false });
    if (!drawingContext) return;
    drawingContext.imageSmoothingEnabled = true;
    drawingContext.imageSmoothingQuality = "high";

    let animationContext: gsap.Context | undefined;
    let active = true;
    let currentFrame = 0;
    let lastRenderedFrame = -1;
    let prefetchTimer: ReturnType<typeof window.setTimeout> | undefined;
    const sheets = new Map<number, HTMLImageElement>();
    const pendingSheets = new Map<number, Promise<HTMLImageElement>>();

    const loadSheet = (index: number) => {
      const safeIndex = Math.max(0, Math.min(SHEET_COUNT - 1, index));
      const cached = sheets.get(safeIndex);
      if (cached) return Promise.resolve(cached);

      const pending = pendingSheets.get(safeIndex);
      if (pending) return pending;

      const request = new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.decoding = "async";
        image.onload = () => {
          if (!active) return;
          sheets.set(safeIndex, image);
          pendingSheets.delete(safeIndex);
          resolve(image);
        };
        image.onerror = () => {
          pendingSheets.delete(safeIndex);
          reject(new Error(`Unable to load film sheet ${safeIndex}`));
        };
        image.src = sheetUrl(safeIndex);
      });

      pendingSheets.set(safeIndex, request);
      return request;
    };

    const resizeCanvas = () => {
      const bounds = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.round(bounds.width * pixelRatio));
      const height = Math.max(1, Math.round(bounds.height * pixelRatio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        lastRenderedFrame = -1;
      }
    };

    const evictDistantSheets = (centerIndex: number) => {
      while (sheets.size > 2) {
        const candidate = [...sheets.keys()]
          .filter((index) => index !== centerIndex)
          .sort((a, b) => Math.abs(b - centerIndex) - Math.abs(a - centerIndex))[0];
        if (candidate === undefined) break;
        sheets.get(candidate)?.removeAttribute("src");
        sheets.delete(candidate);
      }
    };

    const drawFrame = async (requestedFrame: number) => {
      const frame = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(requestedFrame)));
      currentFrame = frame;
      if (frame === lastRenderedFrame) return;
      const previousFrame = lastRenderedFrame;

      const sheetIndex = Math.floor(frame / FRAMES_PER_SHEET);
      const frameInSheet = frame % FRAMES_PER_SHEET;

      try {
        const sheet = await loadSheet(sheetIndex);
        if (!active || frame !== currentFrame) return;

        resizeCanvas();
        const sourceX = (frameInSheet % SHEET_COLUMNS) * FRAME_WIDTH;
        const sourceY = Math.floor(frameInSheet / SHEET_COLUMNS) * FRAME_HEIGHT;
        const scale = Math.max(canvas.width / FRAME_WIDTH, canvas.height / FRAME_HEIGHT);
        const targetWidth = FRAME_WIDTH * scale;
        const targetHeight = FRAME_HEIGHT * scale;
        const horizontalFocus = window.innerWidth < 768 ? 0.58 : 0.53;
        const targetX = (canvas.width - targetWidth) * horizontalFocus;
        const targetY = (canvas.height - targetHeight) * 0.5;

        drawingContext.drawImage(
          sheet,
          sourceX,
          sourceY,
          FRAME_WIDTH,
          FRAME_HEIGHT,
          targetX,
          targetY,
          targetWidth,
          targetHeight,
        );

        canvas.dataset.frame = frame.toString();
        canvas.classList.add("is-ready");
        evictDistantSheets(sheetIndex);

        const direction = previousFrame < 0 || frame >= previousFrame ? 1 : -1;
        lastRenderedFrame = frame;
        const adjacentSheet = sheetIndex + direction;
        if (adjacentSheet >= 0 && adjacentSheet < SHEET_COUNT) {
          void loadSheet(adjacentSheet).catch(() => undefined);
        }
      } catch {
        canvas.classList.remove("is-ready");
      }
    };

    const prefetchEncodedSheets = async () => {
      for (let index = 1; index < SHEET_COUNT && active; index += 1) {
        try {
          const response = await fetch(sheetUrl(index), { cache: "force-cache" });
          await response.arrayBuffer();
        } catch {
          return;
        }
      }
    };

    const buildTimeline = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        void drawFrame(Math.round(FRAME_COUNT * 0.55));
        return;
      }

      const playhead = { frame: 0 };
      animationContext = gsap.context(() => {
        const chapterElements = gsap.utils.toArray<HTMLElement>(".story-chapter");
        const finale = story.querySelector<HTMLElement>(".story-finale");
        const hazeLayer = story.querySelector<HTMLElement>(".parallax-layer--haze");
        const causticsLayer = story.querySelector<HTMLElement>(".parallax-layer--caustics");
        const particlesLayer = story.querySelector<HTMLElement>(".parallax-layer--particles");

        gsap.fromTo(
          ".site-nav",
          { y: -16 },
          { y: 0, duration: 0.8, ease: "power3.out" },
        );
        gsap.fromTo(
          ".hero-kicker, .hero-line, .hero-subtitle",
          { y: 24 },
          {
            y: 0,
            duration: 0.9,
            stagger: 0.09,
            ease: "power3.out",
          },
        );

        chapterElements.forEach((chapter) => {
          gsap.set(chapter, { autoAlpha: 0, y: 0 });
          gsap.set(chapter.querySelectorAll(".chapter-line"), { yPercent: 110 });
          const body = chapter.querySelector(".story-chapter__body");
          if (body) gsap.set(body, { autoAlpha: 0, y: 18 });
        });
        gsap.set(finale, { autoAlpha: 0, y: 0 });
        gsap.set(".finale-line", { yPercent: 110 });
        gsap.set(hazeLayer, { xPercent: -2, yPercent: 2, scale: 1.04, rotation: -0.4 });
        gsap.set(causticsLayer, { xPercent: 2, yPercent: -1, scale: 1.05, rotation: 0.35 });
        gsap.set(particlesLayer, { xPercent: 1, yPercent: 3, scale: 1.04, rotation: 0.4 });

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: story,
            start: "top top",
            end: "+=4200",
            pin: true,
            scrub: 0.22,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .to(
            playhead,
            {
              frame: FRAME_COUNT - 1,
              duration: 10,
              onUpdate: () => {
                if (!Number.isFinite(playhead.frame)) return;
                const frame = Math.round(playhead.frame);
                void drawFrame(frame);
                const currentTime = frame / FRAME_RATE;
                if (currentTimeRef.current) {
                  currentTimeRef.current.textContent = `00:${Math.floor(currentTime)
                    .toString()
                    .padStart(2, "0")}`;
                }
                if (progressRef.current) {
                  progressRef.current.style.transform = `scaleX(${frame / (FRAME_COUNT - 1)})`;
                }
              },
            },
            0,
          )
          .to(
            hazeLayer,
            {
              xPercent: 3,
              yPercent: -4,
              scale: 1.1,
              rotation: 0.65,
              force3D: true,
              duration: 10,
            },
            0,
          )
          .to(
            causticsLayer,
            {
              xPercent: -4,
              yPercent: 4,
              scale: 1.13,
              rotation: -1.15,
              force3D: true,
              duration: 10,
            },
            0,
          )
          .to(
            particlesLayer,
            {
              xPercent: -6,
              yPercent: -11,
              scale: 1.18,
              rotation: -2.2,
              force3D: true,
              duration: 10,
            },
            0,
          )
          .to(".hero-copy", { autoAlpha: 0, y: -40, scale: 0.985, duration: 0.72 }, 1.15);

        [2.05, 4.15, 6.25].forEach((start, index) => {
          const chapter = chapterElements[index];
          if (!chapter) return;
          const body = chapter.querySelector(".story-chapter__body");

          timeline
            .set(chapter, { autoAlpha: 1 }, start)
            .to(
              chapter.querySelectorAll(".chapter-line"),
              { yPercent: 0, duration: 0.62, stagger: 0.08, ease: "power3.out" },
              start,
            )
            .to(chapter, { autoAlpha: 0, y: -32, duration: 0.5, ease: "power2.in" }, start + 1.38);

          if (body) {
            timeline.to(
              body,
              { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
              start + 0.14,
            );
          }
        });

        if (finale) {
          timeline
            .set(finale, { autoAlpha: 1 }, 8.35)
            .to(
              finale.querySelectorAll(".finale-line"),
              { yPercent: 0, duration: 0.7, stagger: 0.09, ease: "power3.out" },
              8.35,
            );
        }
      }, story);
    };

    const initialize = async () => {
      try {
        await loadSheet(0);
        await drawFrame(0);
      } catch {
        return;
      }

      if (!active) return;
      void loadSheet(1).catch(() => undefined);
      prefetchTimer = window.setTimeout(() => void prefetchEncodedSheets(), 700);
      buildTimeline();
    };

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      void drawFrame(currentFrame);
    });
    resizeObserver.observe(story);
    void initialize();

    return () => {
      active = false;
      if (prefetchTimer !== undefined) window.clearTimeout(prefetchTimer);
      resizeObserver.disconnect();
      animationContext?.revert();
      sheets.forEach((image) => image.removeAttribute("src"));
      sheets.clear();
      pendingSheets.clear();
    };
  }, []);

  return (
    <main>
      <section ref={storyRef} className="film-story" aria-label="MORROW coffee story">
        <canvas
          ref={canvasRef}
          className="film-story__canvas"
          role="img"
          aria-label="Ground coffee falling into a clear glass"
        />
        <div className="film-story__scrim" />
        <div className="parallax-layer parallax-layer--haze" aria-hidden="true">
          <Image
            src="/parallax/steam-haze.webp"
            alt=""
            fill
            sizes="100vw"
            unoptimized
            draggable={false}
          />
        </div>
        <div className="parallax-layer parallax-layer--caustics" aria-hidden="true">
          <Image
            src="/parallax/glass-caustics.webp"
            alt=""
            fill
            sizes="100vw"
            unoptimized
            draggable={false}
          />
        </div>
        <div className="film-story__vignette" />
        <div className="parallax-layer parallax-layer--particles" aria-hidden="true">
          <Image
            src="/parallax/coffee-particles.webp"
            alt=""
            fill
            sizes="100vw"
            unoptimized
            draggable={false}
          />
        </div>

        <header className="site-nav">
          <a className="wordmark" href="#top" aria-label="MORROW home">
            MORROW
          </a>
          <a className="nav-action" href="mailto:hello@morrow.coffee">Choose coffee</a>
        </header>

        <div className="hero-copy" id="top">
          <p className="hero-kicker">MORROW COFFEE</p>
          <h1 aria-label="Before the first sip.">
            <span className="hero-line">Before</span>
            <span className="hero-line hero-line--offset">the first sip.</span>
          </h1>
          <p className="hero-subtitle">A ten-second study of grind, water and the moment flavor takes shape.</p>
        </div>

        <div className="story-chapters">
          {chapters.map((chapter) => (
            <article className={chapter.className} key={chapter.title.join(" ")}>
              <h2 aria-label={chapter.title.join(" ")}>
                {chapter.title.map((line) => (
                  <span className="chapter-line-mask" key={line}>
                    <span className="chapter-line">{line}</span>
                  </span>
                ))}
              </h2>
              <p className="story-chapter__body">{chapter.body}</p>
            </article>
          ))}
        </div>

        <div className="story-finale">
          <h2 aria-label="Flavor, made visible.">
            <span className="chapter-line-mask">
              <span className="finale-line">Flavor,</span>
            </span>
            <span className="chapter-line-mask">
              <span className="finale-line">made visible.</span>
            </span>
          </h2>
        </div>

        <div className="film-counter" aria-hidden="true">
          <span ref={currentTimeRef}>00:00</span>
          <span className="film-counter__track">
            <span ref={progressRef} className="film-counter__progress" />
          </span>
          <span>00:10</span>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__heading">
          <p>Roasted for clarity. Remembered for flavor.</p>
          <a className="site-footer__action" href="mailto:hello@morrow.coffee">Choose coffee</a>
        </div>
        <p className="site-footer__wordmark" aria-label="MORROW">MORROW</p>
        <div className="site-footer__meta">
          <p>Specialty coffee, seen clearly.</p>
          <a href="mailto:hello@morrow.coffee">hello@morrow.coffee</a>
          <p>© 2026 MORROW</p>
        </div>
      </footer>
    </main>
  );
}
