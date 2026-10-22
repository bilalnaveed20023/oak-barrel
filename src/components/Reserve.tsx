"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { app } from "@/lib/app";
import { gsap, prefersReduced } from "@/lib/motion";
import { HOURS, HOURS_LIST, SITE } from "@/lib/content";

/**
 * Reservation panel. Opens from any "Reserve" button via openReserve().
 * Tables are held by phone or email; the request card just composes a tidy
 * email so the bar gets every detail in one message.
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Night = { date: Date; open: [number, number] | null };

/** Today's date and hour in Wyandotte, regardless of the visitor's timezone. */
function detroitNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Detroit",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  return { date: new Date(get("year"), get("month") - 1, get("day")), hour: (get("hour") % 24) + get("minute") / 60 };
}

const fmtTime = (h: number) => {
  const hh = Math.floor(h) % 24;
  const mm = h % 1 ? "30" : "00";
  return `${hh % 12 || 12}:${mm} ${hh >= 12 && hh < 24 ? "PM" : "AM"}`;
};

function slotsFor(night: Night, isToday: boolean, nowHour: number) {
  if (!night.open) return [];
  const [o, c] = night.open;
  const out: number[] = [];
  // last seating an hour before close
  for (let h = o; h <= c - 1; h += 0.5) if (!isToday || h >= nowHour + 1) out.push(h);
  return out;
}

export default function Reserve() {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const [nights, setNights] = useState<Night[]>([]);
  const [nowHour, setNowHour] = useState(0);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [party, setParty] = useState(2);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("oak:reserve", onOpen);
    return () => window.removeEventListener("oak:reserve", onOpen);
  }, []);

  // the next two weeks of nights, computed on open so "today" is always current
  useEffect(() => {
    if (!open) return;
    const { date, hour } = detroitNow();
    setNowHour(hour);
    const list: Night[] = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(date);
      d.setDate(d.getDate() + i);
      return { date: d, open: HOURS[d.getDay()] };
    });
    setNights(list);
    setDay((cur) => cur ?? list.findIndex((n, i) => slotsFor(n, i === 0, hour).length > 0));
  }, [open]);

  const slots = useMemo(() => (day == null || !nights[day] ? [] : slotsFor(nights[day], day === 0, nowHour)), [day, nights, nowHour]);
  useEffect(() => {
    if (time != null && !slots.includes(time)) setTime(null);
  }, [slots, time]);

  useEffect(() => {
    const el = root.current!;
    const panel = el.querySelector<HTMLElement>("[data-panel]")!;
    const lines = el.querySelectorAll("[data-rline]");
    const reduced = prefersReduced();
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      app.lenis?.stop();
      document.documentElement.style.overflow = "hidden";
      gsap.set(el, { visibility: "visible" });
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.5, ease: "power2.out" });
      if (!reduced) {
        gsap.fromTo(panel, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.out" });
        gsap.fromTo(lines, { yPercent: 118, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.07, delay: 0.15, ease: "expo.out" });
      }
      closeBtn.current?.focus({ preventScroll: true });
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }
    if (el.style.visibility === "visible") {
      gsap.to(el, {
        opacity: 0,
        duration: reduced ? 0.15 : 0.45,
        ease: "power2.out",
        onComplete: () => {
          gsap.set(el, { visibility: "hidden" });
        },
      });
      document.documentElement.style.overflow = "";
      app.lenis?.start();
      lastFocus.current?.focus({ preventScroll: true });
    }
  }, [open]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SITE.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${SITE.email}`;
    }
  };

  const send = () => {
    if (day == null || !nights[day]?.open) return setError("Choose a night we’re open.");
    if (time == null) return setError("Choose a time.");
    if (!name.trim()) return setError("Add a name for the table.");
    setError("");
    const d = nights[day].date;
    const dateText = `${FULL_DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} at ${fmtTime(time)}`;
    const subject = `Table request · ${party} ${party === 1 ? "guest" : "guests"} · ${MONTHS[d.getMonth()]} ${d.getDate()}, ${fmtTime(time)}`;
    const body = [
      "Hi Oak Barrel,",
      "",
      "I’d like to hold a table:",
      "",
      `Name: ${name.trim()}`,
      `When: ${dateText}`,
      `Party: ${party} ${party === 1 ? "guest" : "guests"}`,
      "",
      "Thank you!",
    ].join("\n");
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div
      ref={root}
      className="reserve"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-labelledby="reserve-title"
      aria-hidden={!open}
      onClick={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div className="reserve__panel" data-panel>
        <button ref={closeBtn} className="reserve__close eyebrow" onClick={() => setOpen(false)} aria-label="Close reservations">
          <span className="reserve__close-text">Close</span> <span aria-hidden="true">✕</span>
        </button>

        <div className="reserve__copy">
          <span className="mask"><span className="eyebrow reserve__eyebrow" data-rline>Reservations · {SITE.street}</span></span>
          <h2 id="reserve-title" className="reserve__title display">
            <span className="mask"><span data-rline>Hold a table</span></span>
            <span className="mask"><span data-rline><em>for tonight.</em></span></span>
          </h2>
          <span className="mask">
            <p className="reserve__note" data-rline>
              Call or email and we’ll hold it for you. Booths, bar seats, birthdays, bottle service or the whole room.
            </p>
          </span>

          <div className="reserve__contact">
            <a className="reserve__line" href={SITE.tel}>
              <span className="eyebrow">Call</span>
              <span className="reserve__big display">{SITE.phone}</span>
            </a>
            <div className="reserve__line">
              <span className="eyebrow">Email</span>
              <span className="reserve__email-row">
                <a className="reserve__big reserve__big--email display" href={`mailto:${SITE.email}`}>{SITE.email}</a>
                <button type="button" className="reserve__copy-btn eyebrow" onClick={copyEmail} aria-live="polite">
                  {copied ? "Copied" : "Copy"}
                </button>
              </span>
            </div>
          </div>

          <dl className="reserve__hours">
            {HOURS_LIST.map((h) => (
              <div key={h.days}>
                <dt className="eyebrow">{h.days}</dt>
                <dd>{h.time}</dd>
              </div>
            ))}
          </dl>
        </div>

        <form
          className="reserve__card"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          noValidate
        >
          <div className="reserve__card-head">
            <span className="reserve__diamond" aria-hidden="true" />
            <span className="eyebrow">Request a table</span>
            <span className="reserve__diamond" aria-hidden="true" />
          </div>

          <fieldset className="reserve__field">
            <legend className="eyebrow">Night</legend>
            <div className="reserve__nights">
              {nights.map((n, i) => {
                const closed = !n.open || slotsFor(n, i === 0, nowHour).length === 0;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`reserve__night${day === i ? " is-on" : ""}`}
                    disabled={closed}
                    aria-pressed={day === i}
                    aria-label={`${DAYS[n.date.getDay()]} ${MONTHS[n.date.getMonth()]} ${n.date.getDate()}${closed ? ", closed" : ""}`}
                    onClick={() => {
                      setDay(i);
                      setError("");
                    }}
                  >
                    <span>{i === 0 ? "Today" : DAYS[n.date.getDay()]}</span>
                    <b>{n.date.getDate()}</b>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="reserve__row">
            <label className="reserve__field">
              <span className="eyebrow">Time</span>
              <select
                value={time ?? ""}
                onChange={(e) => {
                  setTime(e.target.value === "" ? null : Number(e.target.value));
                  setError("");
                }}
              >
                <option value="">{slots.length ? "Choose" : "Closed"}</option>
                {slots.map((h) => (
                  <option key={h} value={h}>
                    {fmtTime(h)}
                  </option>
                ))}
              </select>
            </label>
            <div className="reserve__field">
              <span className="eyebrow">Guests</span>
              <div className="reserve__stepper">
                <button type="button" aria-label="Fewer guests" onClick={() => setParty((p) => Math.max(1, p - 1))}>−</button>
                <span aria-live="polite">{party}</span>
                <button type="button" aria-label="More guests" onClick={() => setParty((p) => Math.min(20, p + 1))}>+</button>
              </div>
            </div>
          </div>

          <label className="reserve__field">
            <span className="eyebrow">Name for the table</span>
            <input
              type="text"
              autoComplete="name"
              placeholder="Jordan M."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </label>

          {party >= 8 && <p className="reserve__hint">For 8 or more, a quick call is best. We’ll plan the space with you.</p>}
          {error && <p className="reserve__error" role="alert">{error}</p>}

          <button type="submit" className="btn btn--lg reserve__send">
            Email request <span className="btn__arrow" aria-hidden="true">→</span>
          </button>
          <p className="reserve__fine">Opens your email with everything filled in. We’ll confirm by reply.</p>
        </form>
      </div>
    </div>
  );
}
