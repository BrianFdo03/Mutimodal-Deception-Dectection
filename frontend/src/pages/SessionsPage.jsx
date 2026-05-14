import { CalendarDays, Plus } from "lucide-react";

const demoSessions = [
  {
    id: 1,
    candidate: "Demo Candidate",
    stage: "Technical Interview",
    date: "2026-05-14",
    time: "10:30 AM",
    consent: "Pending",
    status: "Scheduled",
    analysis: "Not Started",
  },
];

export default function SessionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">
            Interview Sessions
          </h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Schedule and monitor virtual interview sessions before sending
            recordings for behavioral timeline analysis.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
          <Plus size={18} />
          Schedule Session
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        <MiniStatusCard title="Scheduled" value="1" />
        <MiniStatusCard title="Consent Pending" value="1" />
        <MiniStatusCard title="Analyzed" value="0" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-950">
            Session Records
          </h2>
          <p className="text-sm text-gray-500">
            Demo session workflow. Consent and meeting-room screens can be
            connected next.
          </p>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <th className="px-6 py-3">Session</th>
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Stage</th>
              <th className="px-6 py-3">Date / Time</th>
              <th className="px-6 py-3">Consent</th>
              <th className="px-6 py-3">Analysis</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {demoSessions.map((session) => (
              <tr
                key={session.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-4 font-semibold text-gray-950">
                  #{session.id}
                </td>

                <td className="px-6 py-4 text-gray-700">{session.candidate}</td>

                <td className="px-6 py-4 text-gray-700">{session.stage}</td>

                <td className="px-6 py-4 text-gray-700">
                  {session.date} · {session.time}
                </td>

                <td className="px-6 py-4">
                  <span className="rounded-full border border-yellow-200 bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                    {session.consent}
                  </span>
                </td>

                <td className="px-6 py-4 text-gray-700">{session.analysis}</td>

                <td className="px-6 py-4">
                  <button className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800">
                    <CalendarDays size={14} />
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStatusCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-950">{value}</h3>
    </div>
  );
}
