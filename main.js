gsap.registerPlugin(ScrollTrigger);

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Liquid refraction only where backdrop SVG filters work (Chromium)
if (/Chrome/.test(navigator.userAgent) && !/Edg|OPR/.test(navigator.userAgent)) {
  document.querySelectorAll(".nav, .float, .tag, .result").forEach(el => el.classList.add("liquid"));
}

function countUp(el, duration = 1.6) {
  const target = parseFloat(el.dataset.count);
  const dec = parseInt(el.dataset.dec || "0", 10);
  const obj = { v: 0 };
  return gsap.to(obj, {
    v: target, duration, ease: "power3.out",
    onUpdate: () => {
      el.textContent = dec ? obj.v.toFixed(dec).replace(".", ",") : Math.round(obj.v).toLocaleString("sv-SE");
    },
  });
}

if (reduce) {
  document.querySelectorAll("[data-count]").forEach(el => (el.textContent = el.dataset.count.replace(".", ",")));
  document.querySelector(".ring-fg").style.strokeDashoffset = 528 * (1 - 1480 / 2100);
  document.querySelectorAll(".tag, .result").forEach(el => (el.style.opacity = 1));
} else {
  // Hero intro
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(".nav", { y: -40, opacity: 0, duration: 1 })
    .from(".hero-title .line > span", { yPercent: 110, duration: 1.3, stagger: 0.12 }, "-=0.7")
    .from(".hero .reveal", { y: 24, opacity: 0, duration: 1, stagger: 0.1 }, "-=0.9")
    .from(".phone", { y: 80, opacity: 0, duration: 1.6 }, "-=0.9")
    .to(".ring-fg", { strokeDashoffset: 528 * (1 - 1480 / 2100), duration: 2, ease: "power3.inOut" }, "-=0.8")
    .add(countUp(document.querySelector(".kcal"), 2), "<")
    .from(".bar i", { scaleX: 0, duration: 1.2, stagger: 0.12, ease: "power3.out" }, "<0.3")
    .from(".meal", { y: 20, opacity: 0, duration: 0.8 }, "<0.4")
    .from(".float", { y: 10, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out" }, "<");

  // Floating chips bob
  gsap.to(".f1", { y: -6, duration: 4, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(".f2", { y: 6, duration: 4.5, repeat: -1, yoyo: true, ease: "sine.inOut" });

  // Phone tilts away on scroll
  gsap.to(".phone", {
    scale: 0.96, y: 30,
    scrollTrigger: { trigger: ".phone-wrap", start: "top 30%", end: "bottom top", scrub: true },
  });

  // Blobs drift with scroll
  gsap.to(".b1", { x: "8vw", y: "12vh", scrollTrigger: { scrub: 1 } });
  gsap.to(".b2", { x: "-8vw", y: "14vh", scrollTrigger: { scrub: 1 } });
  gsap.to(".b3", { x: "-4vw", y: "-16vh", scrollTrigger: { scrub: 1 } });

  // Statement: word-by-word light-up
  const big = document.querySelector(".big-text");
  const wrapWords = node => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part.trim()) return frag.append(part);
          const s = document.createElement("span");
          s.className = "word";
          s.textContent = part;
          frag.append(s);
        });
        child.replaceWith(frag);
      } else wrapWords(child);
    });
  };
  wrapWords(big);
  gsap.to(".big-text .word", {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".statement", start: "top 75%", end: "bottom 45%", scrub: true },
  });

  // Scan: pinned sequence
  const steps = document.querySelectorAll(".step");
  const setStep = i => steps.forEach((s, j) => s.classList.toggle("active", j === i));
  const mm = gsap.matchMedia();
  mm.add({ desktop: "(min-width: 861px)", mobile: "(max-width: 860px)" }, ctx => {
    const scan = gsap.timeline({
      scrollTrigger: {
        trigger: ".scan", start: "top top", end: ctx.conditions.desktop ? "+=1800" : "+=1200",
        pin: ".scan-pin", scrub: 0.6,
        onUpdate: self => setStep(self.progress < 0.33 ? 0 : self.progress < 0.7 ? 1 : 2),
      },
    });
    scan
      .from(".plate", { scale: 0.9, opacity: 0, duration: 1 })
      .from(".food", { opacity: 0, y: 10, stagger: 0.15, duration: 0.6, ease: "power3.out" }, "<0.3")
      .to(".scanline", { opacity: 1, duration: 0.1 })
      .to(".scanline", { top: "100%", duration: 1.2, ease: "none" })
      .to(".scanline", { top: "0%", duration: 1.2, ease: "none" })
      .to(".scanline", { opacity: 0, duration: 0.1 })
      .to(".tag", { opacity: 1, y: -10, stagger: 0.25, duration: 0.5 }, "-=1.6")
      .to(".result", { opacity: 1, y: -10, duration: 0.6 })
      .add(() => {}, "+=0.4");
  });
  ScrollTrigger.create({
    trigger: ".scan", start: "top -60%", once: true,
    onEnter: () => countUp(document.querySelector(".result [data-count]"), 1.2),
  });

  // Generic reveals
  gsap.utils.toArray(".reveal").forEach(el => {
    if (el.closest(".hero")) return;
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });

  gsap.from(".card", {
    y: 40, opacity: 0, duration: 1.1, stagger: 0.1, ease: "expo.out",
    scrollTrigger: { trigger: ".grid", start: "top 80%" },
  });
  ScrollTrigger.create({
    trigger: ".stat-row", start: "top 85%", once: true,
    onEnter: () => document.querySelectorAll(".stat-row [data-count]").forEach(el => countUp(el, 2)),
  });

  gsap.from(".plan", {
    y: 60, opacity: 0, duration: 1, stagger: 0.15, ease: "expo.out",
    scrollTrigger: { trigger: ".plans", start: "top 80%" },
  });

  gsap.from(".final-card", {
    y: 40, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".final", start: "top 80%" },
  });
  gsap.from(".final-title", {
    backgroundPosition: "0% 0%", y: 50, opacity: 0, duration: 1.2, ease: "expo.out",
    scrollTrigger: { trigger: ".final", start: "top 70%" },
  });
}
