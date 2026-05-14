import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, UserRound, X } from "lucide-react";

import {
  deleteCandidate,
  getCandidates,
  saveCandidate,
} from "../services/localDataService";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  function loadCandidates() {
    setCandidates(getCandidates());
  }

  const filteredCandidates = useMemo(() => {
    return candidates.filter((candidate) => {
      const searchableText = [
        candidate.name,
        candidate.email,
        candidate.phone,
        candidate.position,
        candidate.experienceLevel,
        candidate.status,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchText.toLowerCase());
    });
  }, [candidates, searchText]);

  function handleCandidateCreated() {
    loadCandidates();
    setIsFormOpen(false);
  }

  function handleDeleteCandidate(candidateId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this candidate?",
    );

    if (!confirmed) {
      return;
    }

    const updatedCandidates = deleteCandidate(candidateId);
    setCandidates(updatedCandidates);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">Candidates</h1>
          <p className="mt-2 max-w-3xl text-gray-600">
            Enter, search, and track candidate details before scheduling virtual
            interview sessions.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Add Candidate
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-6">
        <CandidateStatCard title="Total Candidates" value={candidates.length} />
        <CandidateStatCard
          title="Scheduled"
          value={
            candidates.filter((candidate) =>
              candidate.status?.toLowerCase().includes("scheduled"),
            ).length
          }
        />
        <CandidateStatCard
          title="New"
          value={
            candidates.filter((candidate) => candidate.status === "New").length
          }
        />
        <CandidateStatCard
          title="Under Review"
          value={
            candidates.filter(
              (candidate) => candidate.status === "Under Review",
            ).length
          }
        />
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-gray-300 px-4 py-3">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search candidates by name, email, phone, or position"
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
            Showing {filteredCandidates.length} of {candidates.length} candidate
            records.
          </p>
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No candidates found. Add a candidate to begin scheduling interviews.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Experience</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredCandidates.map((candidate) => (
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
                      {candidate.phone || "N/A"}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {candidate.position}
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {candidate.experienceLevel}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {candidate.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-gray-700">
                      {candidate.createdAt
                        ? new Date(candidate.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteCandidate(candidate.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <CandidateFormModal
          onClose={() => setIsFormOpen(false)}
          onCreated={handleCandidateCreated}
        />
      )}
    </div>
  );
}

function CandidateStatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-gray-950">{value}</h3>
    </div>
  );
}

function CandidateFormModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    experienceLevel: "Entry Level",
    status: "New",
    notes: "",
  });

  const [errorMessage, setErrorMessage] = useState("");

  function updateField(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setErrorMessage("Candidate name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage("Candidate email is required.");
      return;
    }

    if (!formData.position.trim()) {
      setErrorMessage("Applied position is required.");
      return;
    }

    saveCandidate(formData);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-950">Add Candidate</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter candidate details for interview tracking.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <FormField
            label="Full Name"
            value={formData.name}
            onChange={(value) => updateField("name", value)}
            placeholder="e.g. Nimal Perera"
          />

          <FormField
            label="Email"
            type="email"
            value={formData.email}
            onChange={(value) => updateField("email", value)}
            placeholder="candidate@email.com"
          />

          <FormField
            label="Phone"
            value={formData.phone}
            onChange={(value) => updateField("phone", value)}
            placeholder="+94..."
          />

          <FormField
            label="Position Applied"
            value={formData.position}
            onChange={(value) => updateField("position", value)}
            placeholder="Software Engineer Intern"
          />

          <SelectField
            label="Experience Level"
            value={formData.experienceLevel}
            onChange={(value) => updateField("experienceLevel", value)}
            options={["Entry Level", "Junior", "Mid Level", "Senior"]}
          />

          <SelectField
            label="Candidate Status"
            value={formData.status}
            onChange={(value) => updateField("status", value)}
            options={[
              "New",
              "Interview Scheduled",
              "Under Review",
              "Rejected",
              "Shortlisted",
            ]}
          />

          <div className="md:col-span-2">
            <label className="text-sm font-semibold text-gray-700">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              rows="3"
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
              placeholder="Optional candidate notes..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Save Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
