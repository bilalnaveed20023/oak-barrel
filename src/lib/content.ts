/** Everything here comes from oakbarrelbar.com — no invented facts. */

export const SITE = {
  name: "The Oak Barrel",
  street: "166 Oak Street",
  city: "Wyandotte",
  region: "MI",
  country: "US",
  phone: "+1 313-456-9909",
  tel: "tel:+13134569909",
  email: "info@prime166.com",
  instagram: "https://www.instagram.com/oakbarrelwyandotte/",
  facebook: "https://www.facebook.com/profile.php?id=100066416667255",
  maps: "https://maps.google.com/?q=166+Oak+Street,+Wyandotte,+MI",
  coords: "42.2142° N — 83.1499° W",
};

/** 0 = Sunday. [openHour, closeHour] in local (America/Detroit) time; close may pass midnight. */
export const HOURS: Record<number, [number, number] | null> = {
  0: [15, 21],
  1: null,
  2: null,
  3: [17, 24],
  4: [17, 24],
  5: [17, 26],
  6: [17, 26],
};

export const HOURS_LIST = [
  { days: "Wednesday — Thursday", time: "5 PM — 12 AM" },
  { days: "Friday — Saturday", time: "5 PM — 2 AM" },
  { days: "Sunday", time: "3 PM — 9 PM" },
  { days: "Monday — Tuesday", time: "Closed" },
];

const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fmt = (h: number) => {
  const hh = h % 24;
  if (hh === 0) return "midnight";
  const s = hh >= 12 ? "PM" : "AM";
  return `${hh % 12 || 12} ${s}`;
};

/** Live open/closed line computed in Wyandotte's timezone. */
export function openStatus(now = new Date()): { open: boolean; text: string } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.find((p) => p.type === "weekday")!.value);
  const hour = Number(parts.find((p) => p.type === "hour")!.value) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  const h = hour + minute / 60;

  // still open from last night?
  const prev = HOURS[(wd + 6) % 7];
  if (prev && prev[1] > 24 && h < prev[1] - 24) return { open: true, text: `Open now — until ${fmt(prev[1])}` };

  const today = HOURS[wd];
  if (today && h >= today[0] && h < today[1]) return { open: true, text: `Open now — until ${fmt(today[1])}` };
  if (today && h < today[0]) return { open: false, text: `Opens today at ${fmt(today[0])}` };

  for (let i = 1; i <= 7; i++) {
    const d = (wd + i) % 7;
    const hrs = HOURS[d];
    if (hrs) return { open: false, text: `Opens ${i === 1 ? "tomorrow" : DAY[d]} at ${fmt(hrs[0])}` };
  }
  return { open: false, text: "" };
}

export const FEATURES = [
  {
    n: "01",
    eyebrow: "Signature cocktails",
    title: ["Cocktails", "with an attitude."],
    italic: 1,
    body: "Built to order behind a back bar that runs the length of the room. The smoked old fashioned arrives under its own drift of oak smoke.",
    detail: ["Stirred", "Shaken", "Smoked"],
  },
  {
    n: "02",
    eyebrow: "Exclusive distillates",
    title: ["The top shelf,", "poured properly."],
    italic: 1,
    body: "Exclusive distillates and fine wines for the whiskey devotee who knows exactly what they want — and the curious one who’s about to find out.",
    detail: ["Whiskey", "Wine", "Agave"],
  },
  {
    n: "03",
    eyebrow: "Live entertainment",
    title: ["The room has", "a soundtrack."],
    italic: 1,
    body: "DJ Donnie‑T every Friday, 9 to midnight. Pure Soul — 70s soul, R&B and Motown — every 2nd & 4th Wednesday, 6 to 8.",
    detail: ["Wednesday", "Thursday", "Friday", "Saturday"],
  },
  {
    n: "04",
    eyebrow: "Private events & bottle service",
    title: ["Your night,", "held for you."],
    italic: 1,
    body: "Private parties, premium bottle service and photo sessions — with a full menu from our sister restaurant, Prime 166.",
    detail: ["Events", "Bottles", "Dining"],
  },
];

/** CC0 stock placeholders until the bar's own photography is ready (see PLACEHOLDER-PHOTOS.md). */
export const GALLERY = [
  { src: "/img/g-gin-tonic.jpg", w: 960, h: 600, caption: "Gin & tonic", note: "Lemon, juniper, one big ice", shape: "wide" },
  { src: "/img/g-martini.jpg", w: 655, h: 873, caption: "Stirred, not shy", note: "Straight up", shape: "tall" },
  { src: "/img/g-manhattan.jpg", w: 1024, h: 640, caption: "From the back bar", note: "Rye, vermouth, patience", shape: "wide" },
  { src: "/img/g-pink-smash.jpg", w: 960, h: 1280, caption: "Something bright", note: "Crushed ice, fresh fruit", shape: "tall" },
  { src: "/img/g-spritz.jpg", w: 768, h: 1024, caption: "The long one", note: "For the early evening", shape: "tall" },
  { src: "/img/g-pink-gin.jpg", w: 1024, h: 640, caption: "Late pour", note: "When the room gets loud", shape: "wide" },
] as const;

export const STATS = [
  { value: 166, prefix: "", suffix: "", label: "Oak Street, Wyandotte — our address and our name." },
  { value: 4, prefix: "", suffix: "", label: "Nights of live music, every week. Wednesday through Saturday." },
  { value: 2, prefix: "", suffix: " AM", label: "Last call on Fridays & Saturdays." },
  { value: 7, prefix: "$", suffix: "", label: "Martinis at Girls Dinner — Wednesdays, after 5." },
];

/** Prefix a /public path with the deploy base path (GitHub Pages serves from /oak-barrel). */
export const asset = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
