type PlaceholderPanelProps = {
  title: string;
  description: string;
};

export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <section className="rounded-lg border border-luminoa-line bg-white p-6">
      <p className="text-sm font-semibold uppercase text-luminoa-teal">Sprint 1</p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-luminoa-muted">{description}</p>
    </section>
  );
}
