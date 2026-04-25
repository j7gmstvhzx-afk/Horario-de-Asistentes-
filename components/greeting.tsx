export function Greeting({ name }: { name: string }) {
  const hour = new Date().getHours();
  let text = "Buenos días";
  let emoji = "☀️";
  if (hour >= 12 && hour < 19) {
    text = "Buenas tardes";
    emoji = "🌤️";
  } else if (hour >= 19 || hour < 5) {
    text = "Buenas noches";
    emoji = "🌙";
  }
  const firstName = name.split(" ")[0] ?? name;
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
        Casino Atlántico Manatí
      </p>
      <h1 className="font-display text-[34px] sm:text-[40px] font-bold leading-[1.05] text-white">
        {text},
        <br />
        {firstName} <span aria-hidden>{emoji}</span>
      </h1>
    </div>
  );
}
