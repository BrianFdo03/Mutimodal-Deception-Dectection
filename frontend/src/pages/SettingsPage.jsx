export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">Settings</h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Configure data retention, ethical notices, and analysis preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Data Retention
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Interview recordings should only be stored for a limited period.
            Delete controls and automatic retention policies can be connected
            later.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-950">
            Ethical Use Notice
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            The system highlights behavioral inconsistencies for human review.
            It should not be used as a standalone lie detector or autonomous
            hiring tool.
          </p>
        </div>
      </div>
    </div>
  );
}
