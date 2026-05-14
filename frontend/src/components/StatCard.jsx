export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-gray-950">{value}</h3>

          {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
        </div>

        {Icon && (
          <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
}
