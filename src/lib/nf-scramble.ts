import gsap from "gsap";

type ScrambleSpan = HTMLSpanElement & {
  nfScrambleInterval?: number;
  nfScrambleTimeout?: number;
  nfStaggerTimeout?: number;
};

type ScrambleInstance = {
  element: HTMLElement;
  chars: ScrambleSpan[];
  revert: () => void;
};

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
const DEFAULTS = { duration: 0.25, charDelay: 50, stagger: 50 };

function splitToChars(element: HTMLElement): ScrambleInstance {
  const original = element.dataset.nfOriginalText ?? element.textContent ?? "";
  element.dataset.nfOriginalText = original;
  element.textContent = "";

  const fragment = document.createDocumentFragment();
  const parts = original.split(/(\s+)/);

  parts.forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      fragment.appendChild(document.createTextNode(part));
      return;
    }
    const word = document.createElement("span");
    word.className = "nf-word";

    for (const ch of part) {
      const charWrap = document.createElement("span");
      charWrap.className = "nf-char";
      const char = document.createElement("span");
      char.textContent = ch;
      charWrap.appendChild(char);
      word.appendChild(charWrap);
    }
    fragment.appendChild(word);
  });

  element.appendChild(fragment);

  const chars = Array.from(
    element.querySelectorAll<HTMLSpanElement>(".nf-char > span")
  ) as ScrambleSpan[];

  const revert = () => {
    element.textContent = original;
    element.removeAttribute("data-nf-split");
  };

  return { element, chars, revert };
}

function scrambleChar(
  char: ScrambleSpan,
  showAfter = true,
  duration = DEFAULTS.duration,
  charDelay = DEFAULTS.charDelay,
  maxIterations: number | null = null
) {
  if (!char.dataset.nfOriginalText) {
    char.dataset.nfOriginalText = char.textContent ?? "";
  }
  const originalText = char.dataset.nfOriginalText;
  let iterations = 0;
  const iterationsCount = maxIterations ?? Math.floor(Math.random() * 6) + 3;

  if (showAfter) gsap.set(char, { opacity: 1 });

  if (char.nfScrambleInterval) clearInterval(char.nfScrambleInterval);
  if (char.nfScrambleTimeout) clearTimeout(char.nfScrambleTimeout);

  const interval = window.setInterval(() => {
    char.textContent =
      originalText === " "
        ? " "
        : CHARS[Math.floor(Math.random() * CHARS.length)];
    iterations += 1;

    if (iterations >= iterationsCount) {
      clearInterval(interval);
      char.nfScrambleInterval = undefined;
      char.textContent = originalText;
      if (!showAfter) gsap.set(char, { opacity: 0 });
    }
  }, charDelay);

  char.nfScrambleInterval = interval;

  const timeout = window.setTimeout(() => {
    clearInterval(interval);
    char.nfScrambleInterval = undefined;
    char.nfScrambleTimeout = undefined;
    char.textContent = originalText;
    if (!showAfter) gsap.set(char, { opacity: 0 });
  }, duration * 1000);

  char.nfScrambleTimeout = timeout;
}

function scrambleText(
  chars: ScrambleSpan[],
  showAfter = true,
  duration = DEFAULTS.duration,
  charDelay = DEFAULTS.charDelay,
  stagger = DEFAULTS.stagger,
  skipChars = 0,
  maxIterations: number | null = null
) {
  chars.forEach((char, index) => {
    if (index < skipChars) {
      if (showAfter) gsap.set(char, { opacity: 1 });
      return;
    }
    if (char.nfStaggerTimeout) clearTimeout(char.nfStaggerTimeout);

    const timeout = window.setTimeout(() => {
      scrambleChar(char, showAfter, duration, charDelay, maxIterations);
      char.nfStaggerTimeout = undefined;
    }, (index - skipChars) * stagger);

    char.nfStaggerTimeout = timeout;
  });
}

export function scrambleIn(
  element: HTMLElement,
  delay = 0,
  options: {
    duration?: number;
    charDelay?: number;
    stagger?: number;
    skipChars?: number;
    maxIterations?: number | null;
  } = {}
): ScrambleInstance {
  if (!element.textContent?.trim()) {
    return { element, chars: [], revert: () => {} };
  }

  const {
    duration = DEFAULTS.duration,
    charDelay = DEFAULTS.charDelay,
    stagger = DEFAULTS.stagger,
    skipChars = 0,
    maxIterations = null,
  } = options;

  const split = splitToChars(element);
  gsap.set(split.chars, { opacity: 0 });

  window.setTimeout(() => {
    scrambleText(
      split.chars,
      true,
      duration,
      charDelay,
      stagger,
      skipChars,
      maxIterations
    );
  }, delay * 1000);

  return split;
}

export function scrambleOut(element: HTMLElement, delay = 0) {
  const chars = Array.from(
    element.querySelectorAll<HTMLSpanElement>(".nf-char > span")
  ) as ScrambleSpan[];
  if (!chars.length) return;

  gsap.set(chars, { opacity: 1 });

  window.setTimeout(() => {
    scrambleText([...chars].reverse(), false);
  }, delay * 1000);
}

export function scrambleVisible(
  element: HTMLElement,
  delay = 0,
  options: {
    duration?: number;
    charDelay?: number;
    stagger?: number;
    skipChars?: number;
    maxIterations?: number | null;
  } = {}
): ScrambleInstance {
  if (!element.textContent?.trim()) {
    return { element, chars: [], revert: () => {} };
  }

  const {
    duration = DEFAULTS.duration,
    charDelay = DEFAULTS.charDelay,
    stagger = DEFAULTS.stagger,
    skipChars = 0,
    maxIterations = null,
  } = options;

  const split = splitToChars(element);
  gsap.set(split.chars, { opacity: 1 });

  window.setTimeout(() => {
    scrambleText(
      split.chars,
      true,
      duration,
      charDelay,
      stagger,
      skipChars,
      maxIterations
    );
  }, delay * 1000);

  return split;
}
