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
    <div className="flex flex-col">
      <h1 className="font-display text-3xl font-bold leading-tight text-white">
        {text}, {firstName} <span aria-hidden>{emoji}</span>
      </h1>
      <p className="text-sm text-white/85">Casino Atlántico Manatí</p>
    </div>
  );
}
