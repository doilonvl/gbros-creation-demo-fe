/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { ReactLenis } from "lenis/react";
import Marquee from "@/components/sections/home/intro/Marquee";
import ShuffleText from "@/components/animation/ShuffleText";
import styles from "./archive.module.css";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

export default function ArchivePage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLElement | null>(null);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const galleryRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      let pinAnimation: ScrollTrigger | null = null;

      const initPinning = () => {
        if (pinAnimation) {
          pinAnimation.kill();
          pinAnimation = null;
        }

        if (!stickyRef.current || !sourceRef.current || !galleryRef.current) {
          return;
        }

        if (window.innerWidth > 900) {
          pinAnimation = ScrollTrigger.create({
            trigger: stickyRef.current,
            start: "top top",
            endTrigger: galleryRef.current,
            end: "bottom bottom",
            pin: sourceRef.current,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });
        }
      };

      initPinning();
      window.addEventListener("resize", initPinning);

      return () => {
        window.removeEventListener("resize", initPinning);
        if (pinAnimation) {
          pinAnimation.kill();
        }
      };
    },
    { scope: containerRef }
  );

  return (
    <ReactLenis root>
      <div className={styles.archive} ref={containerRef}>
        <section className={styles.hero} data-nav-theme="dark">
          <div className={styles.container}>
            <ShuffleText
              as="h1"
              text="Collection 101: Starlight Reverie"
              className={styles.heroTitle}
            />
            <div className={styles.heroImageWrapper}>
              <div className={styles.heroImageRow}>
                <p>+</p>
                <p>+</p>
                <p>+</p>
              </div>
              <div className={styles.heroImageRow}>
                <div className={styles.heroImage}>
                  <img src="/carousel/carousel1.jpg" alt="" />
                </div>
              </div>
              <div className={styles.heroImageRow}>
                <p>+</p>
                <p>+</p>
                <p>+</p>
              </div>
            </div>
          </div>
        </section>

        <section
          className={styles.stickyArchive}
          ref={stickyRef}
          data-nav-theme="dark"
        >
          <div
            className={`${styles.archiveCol} ${styles.source}`}
            ref={sourceRef}
          >
            <div className={styles.sourceContainer}>
              <div className={styles.sourceImage}>
                <img src="/Home/prompt-eg-1.jpg" alt="" />
              </div>
              <div className={styles.sourceContent}>
                <p className={styles.primary}>[ Style Reference ]</p>
                <h4 className={styles.sourceTitle}>Quiet Focus</h4>
              </div>
            </div>
          </div>

          <div
            className={`${styles.archiveCol} ${styles.gallery}`}
            ref={galleryRef}
          >
            <div className={styles.galleryContainer}>
              <div className={styles.galleryCopy}>
                <p className={`${styles.primary} ${styles.prompt}`}>
                  // STYLE BRIEF: Soft editorial portrait with clean lines and a
                  subtle glow.
                </p>
                <p className={styles.secondary}>[ Creative Direction ]</p>
                <h4 className={styles.galleryTitle}>Gmedia Studio</h4>

                <div className={styles.galleryImages}>
                  <div className={styles.mainImage}>
                    <img src="/Home/prompt-eg-2.jpg" alt="" />
                  </div>
                  <div className={styles.subImages}>
                    <div className={styles.subImageCol}>
                      <img src="/Home/prompt-1.jpg" alt="" />
                    </div>
                    <div className={styles.subImageCol}>
                      <img src="/Home/prompt-2.jpg" alt="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.nextArchive} data-nav-theme="dark">
          <div className={styles.nextArchiveBg} aria-hidden="true" />
          <div className={styles.marqueeArchive}>
            <Marquee />
          </div>
          <div className={styles.nextContainer}>
            <p className={styles.primary}>[ Collection 102 ]</p>
            <div className={styles.nextArchiveImage}>
              <img src="/carousel/carousel2.jpg" alt="" />
            </div>
            <h2 className={styles.nextArchiveTitle}>Soft Neon Lookbook</h2>
          </div>
        </section>
      </div>
    </ReactLenis>
  );
}
