type SummaryCardProps = {
  label: string;
  value: string | number;
  detail: string;
};

export function SummaryCard({ label, value, detail }: SummaryCardProps) {
  return (
    <article className="rounded-lg border border-luminoa-line bg-white p-5">
      <p className="text-sm font-medium text-luminoa-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-luminoa-ink">{value}</p>
      <p className="mt-2 text-sm text-luminoa-muted">{detail}</p>
    </article>
  );
}
