export default function RiskBadge({ risk }) {
  const normalizedRisk = risk?.toLowerCase();

  let badgeClass = "bg-green-100 text-green-700 border-green-200";
  let label = "LOW";

  if (normalizedRisk === "high") {
    badgeClass = "bg-red-100 text-red-700 border-red-200";
    label = "HIGH";
  } else if (normalizedRisk === "medium") {
    badgeClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    label = "MEDIUM";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass}`}
    >
      {label}
    </span>
  );
}
