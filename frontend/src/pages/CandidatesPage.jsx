import { Plus, Search, UserRound } from "lucide-react";

const demoCandidates = [
  {
    id: 1,
    name: "Demo Candidate",
    email: "candidate@demo.com",
    position: "Software Engineer Intern",
    status: "Interview Scheduled",
    lastRisk: "medium",
  },
];

export default function CandidatesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">Candidates</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Manage candidate records and track interview analysis history.
          </p>
        </div>

        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800">
          <Plus size={18} />
          Add Candidate
        </button>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, or position"
            className="w-full text-sm outline-none"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-950">
            Candidate Records
          </h2>
          <p className="text-sm text-gray-500">
            Demo-ready candidate tracking page. Database integration can be
            connected next.
          </p>
        </div>

        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <th className="px-6 py-3">Candidate</th>
              <th className="px-6 py-3">Position</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Last Risk</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {demoCandidates.map((candidate) => (
              <tr
                key={candidate.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                      <UserRound size={19} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-950">
                        {candidate.name}
                      </p>
                      <p className="text-gray-500">{candidate.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-gray-700">
                  {candidate.position}
                </td>

                <td className="px-6 py-4 text-gray-700">{candidate.status}</td>

                <td className="px-6 py-4">
                  <span className="rounded-full border border-yellow-200 bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                    {candidate.lastRisk.toUpperCase()}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <button className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800">
                    View Profile
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
