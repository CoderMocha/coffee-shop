"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const chapters = [
  {
    className: "story-chapter story-chapter--right",
    title: "每一粒，都有落点。",
    body: "研磨决定接触面积，也决定水如何把风味带出来。",
  },
  {
    className: "story-chapter story-chapter--left",
    title: "让香气先抵达。",
    body: "闻到的果香、坚果与焦糖，是一杯咖啡最早的自我介绍。",
  },
  {
    className: "story-chapter story-chapter--right story-chapter--low",
    title: "清晰，胜过浓重。",
    body: "我们追求干净的层次，让甜感、酸质与余韵各自发生。",
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

    if (video.readyState >= 1) buildTimeline();
    else video.addEventListener("loadedmetadata", buildTimeline, { once: true });

    return () => {
      video.removeEventListener("loadedmetadata", buildTimeline);
      ctx?.revert();
    };
  }, []);

  return (
    <main>
      <section ref={storyRef} className="film-story" aria-label="MORROW 咖啡品牌故事">
        <video
          ref={videoRef}
          className="film-story__video"
          src="/coffee-film.mp4"
          poster="/coffee-poster.jpg"
          muted
          playsInline
          preload="auto"
          aria-label="咖啡粉缓缓落入透明玻璃杯"
        />
        <div className="film-story__scrim" />

        <header className="site-nav">
          <a className="wordmark" href="#top" aria-label="MORROW 首页">
            MORROW
          </a>
          <nav className="site-nav__links" aria-label="主导航">
            <a href="#origin">产地</a>
            <a href="#roast">烘焙</a>
            <a href="#taste">风味</a>
          </nav>
          <a className="nav-action" href="#taste">选豆</a>
        </header>

        <div className="hero-copy" id="top">
          <p className="hero-kicker">A COFFEE FILM</p>
          <h1>把十秒，磨成一杯咖啡。</h1>
          <p className="hero-subtitle">滚动，让研磨、落下与香气发生在你的指尖。</p>
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
          <h2>风味，正在发生。</h2>
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
          <h2>风味，从不靠形容词开始。</h2>
          <p>
            我们从产地信息、处理方式与烘焙曲线开始理解每支豆子，再把复杂留在幕后，把清晰留在杯中。
          </p>
        </div>
        <figure className="origin-figure">
          <Image
            src="/coffee-detail-1.jpg"
            alt="咖啡粉在玻璃杯上方形成细腻的流动"
            fill
            sizes="(max-width: 767px) 100vw, 56vw"
          />
        </figure>
      </section>

      <section className="roast-section" id="roast">
        <p className="roast-statement">轻烘，不轻描淡写。</p>
        <div className="roast-notes">
          <div>
            <span>果香</span>
            <p>保留产地本身的明亮轮廓。</p>
          </div>
          <div>
            <span>甜感</span>
            <p>让焦糖化的温柔接住酸质。</p>
          </div>
          <div>
            <span>余韵</span>
            <p>干净、悠长，不留下焦苦。</p>
          </div>
        </div>
      </section>

      <section className="taste-section" id="taste">
        <div className="taste-image">
          <Image
            src="/coffee-detail-2.jpg"
            alt="落入杯中的咖啡粉呈现出丰富颗粒与流动质感"
            fill
            sizes="(max-width: 767px) 100vw, 50vw"
          />
        </div>
        <div className="taste-copy">
          <h2>今天，喝得更清楚。</h2>
          <p>选择你喜欢的风味方向，我们会把合适的咖啡寄到你手中。</p>
          <a href="mailto:hello@morrow.coffee">选豆</a>
        </div>
      </section>

      <footer className="site-footer">
        <p className="wordmark">MORROW</p>
        <p>让每一杯，都有清晰来处。</p>
        <a href="mailto:hello@morrow.coffee">hello@morrow.coffee</a>
      </footer>
    </main>
  );
}
