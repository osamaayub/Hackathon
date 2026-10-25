const palettes = [
  'from-indigo-600 via-violet-700 to-slate-900',
  'from-rose-600 via-red-700 to-zinc-900',
  'from-blue-600 via-indigo-700 to-slate-900',
  'from-emerald-600 via-teal-700 to-slate-900',
  'from-fuchsia-600 via-purple-700 to-slate-900',
  'from-amber-500 via-orange-700 to-zinc-900',
];

function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Generated banner art for an event card, styled like lablab.ai's event thumbnails. */
export function EventBanner({ title, className = 'h-44' }: { title: string; className?: string }) {
  const palette = palettes[hash(title) % palettes.length];
  return (
    <div className={`relative isolate flex items-end overflow-hidden bg-linear-to-br ${palette} ${className}`}>
      <div className="bg-grid absolute inset-0 -z-10 opacity-40" />
      <div className="absolute -top-10 -right-10 -z-10 size-48 rounded-full bg-white/15 blur-2xl" />
      <p className="p-5 text-2xl leading-tight font-extrabold tracking-tight text-white uppercase drop-shadow">
        {title}
      </p>
    </div>
  );
}
