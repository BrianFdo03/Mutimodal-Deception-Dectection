import { Mic, MonitorUp, PhoneOff, Video } from "lucide-react";

export default function MeetingDemoPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-950">
          Online Meeting Demo
        </h1>
        <p className="mt-2 max-w-3xl text-gray-600">
          Demo interview room for one interviewer and one candidate. Full
          real-time conferencing can be connected later using WebRTC or a
          meeting SDK.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <VideoPanel name="Candidate" role="Interviewee" />
            <VideoPanel name="Demo Interviewer" role="HR Evaluator" />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <MeetingButton icon={Mic} label="Mute" />
            <MeetingButton icon={Video} label="Camera" />
            <MeetingButton icon={MonitorUp} label="Share" />
            <button className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">
              <PhoneOff size={18} />
              End Interview
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Session Info
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="Candidate" value="Demo Candidate" />
              <InfoRow label="Stage" value="Technical Interview" />
              <InfoRow label="Consent" value="Pending" />
              <InfoRow label="Analysis" value="Not Started" />
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-lg font-semibold text-blue-950">
              Consent Required
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              Before analysis, the candidate must consent to video recording and
              behavioral review. The analysis supports interviewer judgment
              only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoPanel({ name, role }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gray-950">
      <div className="flex h-72 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-gray-950">
            {name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </div>
          <p className="mt-4 font-semibold text-white">{name}</p>
          <p className="text-sm text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

function MeetingButton({ icon: Icon, label }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
      <Icon size={18} />
      {label}
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-950">{value}</span>
    </div>
  );
}
