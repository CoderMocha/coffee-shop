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
        gsap.set(".story-chapter, .story-finale", { autoAlpha: 0, y: 28 });

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: story,
            start: "top top",
            end: "+=4200",
            pin: true,
            scrub: 0.25,
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
      try {
        await loadSheet(0);
        await drawFrame(0);
      } catch {
        return;
      }

      if (!active) return;
      void loadSheet(1).catch(() => undefined);
      void prefetchEncodedSheets();
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
