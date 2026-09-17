"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CategoryPicker } from "@/components/create/category-picker";
import { ImageDrop } from "@/components/create/image-drop";
import { ContenderCard } from "@/components/match/contender-card";
import { VersusMark } from "@/components/match/versus-mark";
import { Icon } from "@/components/ui/icon";
import { DEFAULT_COLOR_A, DEFAULT_COLOR_B, PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; accentColor: string; isSystem: boolean };

type SideState = {
  name: string;
  nickname: string;
  color: string;
  imageUrl: string | null;
};

/** One attribute, scored for both sides on a shared 0-100 scale. */
type StatRow = { label: string; a: number; b: number };

const emptySide = (color: string): SideState => ({
  name: "",
  nickname: "",
  color,
  imageUrl: null,
});

/** `datetime-local` wants "YYYY-MM-DDTHH:mm" in LOCAL time, not an ISO UTC
 *  string — feeding it toISOString() silently shifts the value by the user's
 *  offset. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pickable = categories.filter((c) => !c.isSystem);

  const [question, setQuestion] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [startNow, setStartNow] = useState(true);
  const [startsAt, setStartsAt] = useState(() =>
    toLocalInput(new Date(Date.now() + 60 * 60_000)),
  );
  const [endsAt, setEndsAt] = useState(() =>
    toLocalInput(new Date(Date.now() + 24 * 3_600_000)),
  );
  const [a, setA] = useState(emptySide(DEFAULT_COLOR_A));
  const [b, setB] = useState(emptySide(DEFAULT_COLOR_B));
  const [stats, setStats] = useState<StatRow[]>([
    { label: "Power", a: 50, b: 50 },
    { label: "Charm", a: 50, b: 50 },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endDate = new Date(endsAt);
  const startDate = startNow ? new Date() : new Date(startsAt);
  const scheduleValid =
    !Number.isNaN(endDate.getTime()) &&
    !Number.isNaN(startDate.getTime()) &&
    endDate > startDate;

  const ready =
    question.trim().length >= 3 &&
    categorySlug.length > 0 &&
    a.name.trim() &&
    b.name.trim() &&
    a.color !== b.color &&
    scheduleValid;

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);

    const named = stats.filter((x) => x.label.trim());
    const side = (s: SideState, which: "a" | "b") => ({
      name: s.name.trim(),
      nickname: s.nickname.trim() || undefined,
      color: s.color,
      imageUrl: s.imageUrl || undefined,
      // Stored per contender, but always from the same shared label set, so
      // the two sides line up row for row when rendered.
      stats: named.map((x) => ({ label: x.label.trim(), value: x[which] })),
    });

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          categorySlug,
          a: side(a, "a"),
          b: side(b, "b"),
          startsAt: startNow ? undefined : startDate.toISOString(),
          endsAt: endDate.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Could not create the match");
      }
      const { slug } = (await res.json()) as { slug: string };
      router.push(`/m/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the match");
      setBusy(false);
    }
  }

  // The preview renders through the real card, so what the creator sees here
  // is literally what everyone else will see — not an approximation of it.
  const preview = (s: SideState, which: "a" | "b", fallback: string) => ({
    id: "preview",
    contenderId: "preview",
    slug: "preview",
    side: "a" as const,
    name: s.name.trim() || fallback,
    nickname: s.nickname.trim() || null,
    color: s.color,
    imageUrl: s.imageUrl,
    stats: stats.filter((x) => x.label.trim()).map((x) => ({ label: x.label, value: x[which] })),
    answer: null,
    voteCount: 0,
  });

  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-7">
        <Section title="The matchup">
          <Field
            label="The question"
            hint="This is the headline. The matchup names itself from the two contenders."
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Which one actually gets you through the day?"
              maxLength={160}
              className={inputClass}
            />
          </Field>

          <Field label="Category">
            <CategoryPicker
              categories={pickable}
              value={categorySlug}
              onChange={setCategorySlug}
            />
          </Field>

          <Field label="Starts">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStartNow(true)}
                className={cn(
                  "press rounded-pill border px-3.5 py-2 text-sm font-semibold",
                  startNow
                    ? "border-transparent bg-ink text-paper"
                    : "border-rule bg-card text-ink-soft hover:border-rule-strong",
                )}
              >
                Right now
              </button>
              <button
                type="button"
                onClick={() => setStartNow(false)}
                className={cn(
                  "press rounded-pill border px-3.5 py-2 text-sm font-semibold",
                  !startNow
                    ? "border-transparent bg-ink text-paper"
                    : "border-rule bg-card text-ink-soft hover:border-rule-strong",
                )}
              >
                Schedule
              </button>
              {!startNow && (
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="rounded-2xl border border-rule bg-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              )}
            </div>
          </Field>

          <Field label="Ends">
            <input
              type="datetime-local"
              value={endsAt}
              min={startNow ? undefined : startsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="rounded-2xl border border-rule bg-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
            />
          </Field>

          {!scheduleValid && (
            <p className="text-sm font-semibold text-berry">
              The match has to end after it starts.
            </p>
          )}
        </Section>

        <SideEditor label="Side A" state={a} onChange={setA} />
        <SideEditor label="Side B" state={b} onChange={setB} />


        <Section title="Tale of the tape">
          <p className="-mt-2 text-sm text-ink-soft">
            Same attributes, scored for both sides on a 0&ndash;100 scale.
          </p>
          <div className="space-y-4">
            {stats.map((row, i) => (
              <div key={i} className="rounded-2xl bg-sand/60 p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={row.label}
                    onChange={(e) => {
                      const next = [...stats];
                      next[i] = { ...row, label: e.target.value };
                      setStats(next);
                    }}
                    placeholder="Attribute"
                    maxLength={18}
                    className="min-w-0 flex-1 rounded-xl border border-rule bg-card px-3 py-2 text-sm font-semibold focus:border-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setStats(stats.filter((_, x) => x !== i))}
                    aria-label={`Remove ${row.label || "attribute"}`}
                    className="press text-ink-faint hover:text-berry"
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>

                <div className="mt-2.5 space-y-2">
                  <StatSlider
                    name={a.name.trim() || "Side A"}
                    color={a.color}
                    value={row.a}
                    onChange={(v) => {
                      const next = [...stats];
                      next[i] = { ...row, a: v };
                      setStats(next);
                    }}
                  />
                  <StatSlider
                    name={b.name.trim() || "Side B"}
                    color={b.color}
                    value={row.b}
                    onChange={(v) => {
                      const next = [...stats];
                      next[i] = { ...row, b: v };
                      setStats(next);
                    }}
                  />
                </div>
              </div>
            ))}

            {stats.length < 6 && (
              <button
                type="button"
                onClick={() => setStats([...stats, { label: "", a: 50, b: 50 }])}
                className="press inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
              >
                <Icon name="plus" size={15} strong />
                Add attribute
              </button>
            )}
          </div>
        </Section>

        {a.color === b.color && (
          <p className="text-sm font-semibold text-berry">
            Pick different colours so the two sides stay tellable apart.
          </p>
        )}
        {error && <p className="text-sm font-semibold text-berry">{error}</p>}

        <button
          onClick={submit}
          disabled={!ready || busy}
          className="press inline-flex w-full items-center justify-center gap-2 rounded-pill bg-marigold-400 px-6 py-4 font-bold text-ink hover:bg-marigold-300 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Starting…" : "Start the match"}
          <Icon name="arrow-right" size={18} strong />
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="label mb-3">Live preview</p>
        <div className="relative grid grid-cols-2 gap-3">
          <ContenderCard contender={preview(a, "a", "Side A")} percentage={50} revealed={false} />
          <ContenderCard contender={preview(b, "b", "Side B")} percentage={50} revealed={false} />
          <div className="pointer-events-none absolute left-1/2 top-[30%] z-10 -translate-x-1/2 -translate-y-1/2">
            <VersusMark size={40} />
          </div>
        </div>
      </aside>
    </div>
  );
}

/** True when the colour came from the picker rather than the preset palette. */
function isCustom(color: string): boolean {
  return !PALETTE.some((p) => p.value.toLowerCase() === color.toLowerCase());
}

const inputClass =
  "w-full rounded-2xl border border-rule bg-card px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-ink focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-card bg-card p-5 card-shadow sm:p-6">
      <h2 className="mb-4 font-display text-xl text-ink">{title}</h2>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

function SideEditor({
  label,
  state,
  onChange,
}: {
  label: string;
  state: SideState;
  onChange: (s: SideState) => void;
}) {
  const set = <K extends keyof SideState>(key: K, value: SideState[K]) =>
    onChange({ ...state, [key]: value });

  return (
    <Section title={label}>
      <div className="grid min-w-0 gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <ImageDrop
          value={state.imageUrl}
          onChange={(url) => set("imageUrl", url)}
          accent={state.color}
        />

        <div className="min-w-0 space-y-3">
          <Field label="Name">
            <input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="A Rock"
              maxLength={60}
              className={inputClass}
            />
          </Field>
          <Field label="Nickname">
            <input
              value={state.nickname}
              onChange={(e) => set("nickname", e.target.value)}
              placeholder="The Silent Type"
              maxLength={40}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <Field label="Colour">
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set("color", c.value)}
              aria-label={c.name}
              aria-pressed={state.color === c.value}
              className={cn(
                "press h-8 w-8 rounded-full ring-offset-2 ring-offset-card",
                state.color === c.value && "ring-2 ring-ink",
              )}
              style={{ background: c.value }}
            />
          ))}

          <span className="mx-1 h-6 w-px bg-rule" aria-hidden />

          <label
            className="press relative grid h-8 w-8 cursor-pointer place-items-center rounded-full ring-offset-2 ring-offset-card"
            style={{
              background: isCustom(state.color)
                ? state.color
                : "conic-gradient(from 0deg, #f43f5e, #facc15, #84cc16, #2dd4bf, #6366f1, #a855f7, #f43f5e)",
              boxShadow: isCustom(state.color) ? "0 0 0 2px var(--color-ink)" : undefined,
            }}
            title="Custom colour"
          >
            <input
              type="color"
              value={state.color}
              onChange={(e) => set("color", e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Custom colour"
            />
            {!isCustom(state.color) && (
              <Icon name="plus" size={14} strong className="text-white drop-shadow" />
            )}
          </label>

          <span className="tnum text-xs font-semibold uppercase text-ink-faint">
            {state.color}
          </span>
        </div>
      </Field>


    </Section>
  );
}

function StatSlider({
  name,
  color,
  value,
  onChange,
}: {
  name: string;
  color: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2.5">
      <span className="flex w-24 shrink-0 items-center gap-1.5 truncate text-xs font-bold text-ink">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="truncate">{name}</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1"
        style={{ accentColor: color }}
      />
      <span className="tnum w-8 shrink-0 text-right text-sm font-bold text-ink">
        {value}
      </span>
    </label>
  );
}

