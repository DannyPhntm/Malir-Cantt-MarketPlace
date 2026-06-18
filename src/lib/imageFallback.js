// Inline branded placeholder shown when a listing image URL fails to load
// (expired/broken link). Keeps the broken-image browser icon off the page.
// A self-contained SVG data URI so it works offline and needs no extra request.
const FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d2a1a"/>
      <stop offset="0.6" stop-color="#1d4030"/>
      <stop offset="1" stop-color="#2c543f"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <g transform="translate(320 220)" fill="none" stroke="#6ecf94" stroke-width="6"
     stroke-linecap="round" stroke-linejoin="round" opacity="0.85">
    <rect x="-46" y="-46" width="92" height="92" rx="10"/>
    <circle cx="-18" cy="-18" r="8"/>
    <path d="M46 26 14 -6 -46 46"/>
  </g>
  <text x="320" y="320" text-anchor="middle" font-family="Inter, sans-serif"
        font-size="22" fill="#6ecf94" opacity="0.7">Image unavailable</text>
</svg>`;

export const IMG_FALLBACK = `data:image/svg+xml,${encodeURIComponent(FALLBACK_SVG.trim())}`;

// Attach to an <img> via onError; swaps in the fallback once and clears the
// handler so a failing fallback can't loop.
export function handleImgError(e) {
  const img = e.currentTarget;
  if (img.dataset.fallbackApplied) return;
  img.dataset.fallbackApplied = 'true';
  img.src = IMG_FALLBACK;
}
