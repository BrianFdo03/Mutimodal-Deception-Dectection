import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Loader2,
  PhoneOff,
  PlayCircle,
  Square,
  Upload,
  Video,
} from "lucide-react";

import { getSessionById, updateSession } from "../services/sessionApi";

import JitsiMeetingFrame from "../components/JitsiMeetingFrame";
import { analyzeVideo } from "../services/videoAnalysisApi";

export default function MeetingRoomPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const [session, setSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [meetingStarted, setMeetingStarted] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState("");

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [completedAnalysisId, setCompletedAnalysisId] = useState(null);

  useEffect(() => {
    return () => {
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  useEffect(() => {
    loadSession();

    return () => {
      stopCameraStream();
    };
  }, [sessionId]);
  // useEffect(() => {
  //   const foundSession = getSessionById(sessionId);

  //   if (!foundSession) {
  //     setErrorMessage("Interview session was not found.");
  //     return;
  //   }

  //   setSession(foundSession);
  //   setInterviewNotes(foundSession.meetingNotes || "");
  //   setMeetingEnded(foundSession.sessionStatus === "Completed");

  //   return () => {
  //     stopCameraStream();
  //     if (recordedVideoUrl) {
  //       URL.revokeObjectURL(recordedVideoUrl);
  //     }
  //   };
  // }, [sessionId]);

  async function loadSession() {
    try {
      setErrorMessage("");

      const response = await getSessionById(sessionId);

      if (!response.success) {
        throw new Error("Interview session was not found.");
      }

      const loadedSession = response.data;

      setSession(loadedSession);
      setInterviewNotes(loadedSession.meeting_notes || "");
      setCompletedAnalysisId(loadedSession.linked_analysis_id || null);
      setMeetingEnded(
        loadedSession.session_status === "Completed" ||
          loadedSession.session_status === "Analyzed",
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Interview session was not found.",
      );
    }
  }

  function stopCameraStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function getSupportedMimeType() {
    const preferredTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    for (const type of preferredTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return "";
  }

  async function startMeeting() {
    try {
      setErrorMessage("");

      await updateSession(sessionId, {
        session_status: "In Progress",
      });

      setMeetingStarted(true);

      setSession((currentSession) => ({
        ...currentSession,
        session_status: "In Progress",
      }));
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while starting the interview.",
      );
    }
  }
  // function startMeeting() {
  //   setMeetingStarted(true);

  //   updateSession(sessionId, {
  //     sessionStatus: "In Progress",
  //   });

  //   setSession((currentSession) => ({
  //     ...currentSession,
  //     sessionStatus: "In Progress",
  //   }));
  // }

  async function startRecording() {
    try {
      setErrorMessage("");

      let stream = streamRef.current;

      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      recordedChunksRef.current = [];
      setRecordedBlob(null);

      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }

      setRecordedVideoUrl("");

      const mimeType = getSupportedMimeType();
      const recorderOptions = mimeType ? { mimeType } : undefined;

      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: mimeType || "video/webm",
        });

        const videoUrl = URL.createObjectURL(blob);

        setRecordedBlob(blob);
        setRecordedVideoUrl(videoUrl);
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Camera or microphone access was denied. Please allow permissions and try recording again.",
      );

      setIsRecording(false);
    }
  }
  // function startRecording() {
  //   if (!streamRef.current) {
  //     setErrorMessage("Please enable camera and microphone before recording.");
  //     return;
  //   }

  //   recordedChunksRef.current = [];
  //   setRecordedBlob(null);
  //   setRecordedVideoUrl("");

  //   const mimeType = getSupportedMimeType();

  //   const recorderOptions = mimeType ? { mimeType } : undefined;

  //   const mediaRecorder = new MediaRecorder(streamRef.current, recorderOptions);

  //   mediaRecorderRef.current = mediaRecorder;

  //   mediaRecorder.ondataavailable = (event) => {
  //     if (event.data && event.data.size > 0) {
  //       recordedChunksRef.current.push(event.data);
  //     }
  //   };

  //   mediaRecorder.onstop = () => {
  //     const blob = new Blob(recordedChunksRef.current, {
  //       type: mimeType || "video/webm",
  //     });

  //     const videoUrl = URL.createObjectURL(blob);

  //     setRecordedBlob(blob);
  //     setRecordedVideoUrl(videoUrl);
  //     setIsRecording(false);
  //   };

  //   mediaRecorder.start();
  //   setIsRecording(true);
  // }

  function stopRecording() {
    if (!mediaRecorderRef.current) {
      return;
    }

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  async function saveNotes() {
    try {
      setErrorMessage("");

      await updateSession(sessionId, {
        meeting_notes: interviewNotes,
      });

      alert("Interview notes saved.");
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while saving interview notes.",
      );
    }
  }
  // function saveNotes() {
  //   updateSession(sessionId, {
  //     meetingNotes: interviewNotes,
  //   });

  //   alert("Interview notes saved.");
  // }

  async function endMeeting() {
    const confirmed = window.confirm(
      "Are you sure you want to end this interview session?",
    );

    if (!confirmed) {
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    try {
      setErrorMessage("");

      const analysisStatus =
        recordedBlob || recordedChunksRef.current.length > 0
          ? "Ready for Analysis"
          : "Recording Required";

      await updateSession(sessionId, {
        session_status: "Completed",
        analysis_status: analysisStatus,
        meeting_notes: interviewNotes,
      });

      setMeetingEnded(true);

      setSession((currentSession) => ({
        ...currentSession,
        session_status: "Completed",
        analysis_status: analysisStatus,
        meeting_notes: interviewNotes,
      }));
    } catch (error) {
      console.error(error);

      setErrorMessage(
        error?.response?.data?.detail ||
          "Something went wrong while ending the interview.",
      );
    }
  }
  // function endMeeting() {
  //   const confirmed = window.confirm(
  //     "Are you sure you want to end this interview session?",
  //   );

  //   if (!confirmed) {
  //     return;
  //   }

  //   if (isRecording) {
  //     stopRecording();
  //   }

  //   updateSession(sessionId, {
  //     sessionStatus: "Completed",
  //     analysisStatus: recordedBlob
  //       ? "Ready for Analysis"
  //       : "Recording Required",
  //     meetingNotes: interviewNotes,
  //     completedAt: new Date().toISOString(),
  //   });

  //   setMeetingEnded(true);

  //   setSession((currentSession) => ({
  //     ...currentSession,
  //     sessionStatus: "Completed",
  //     analysisStatus: recordedBlob
  //       ? "Ready for Analysis"
  //       : "Recording Required",
  //     meetingNotes: interviewNotes,
  //     completedAt: new Date().toISOString(),
  //   }));
  // }

  async function analyzeRecordedInterview() {
    if (!recordedBlob) {
      setErrorMessage("No recorded video is available for analysis.");
      return;
    }

    if (session?.linked_analysis_id) {
      const confirmed = window.confirm(
        "This session already has a linked analysis. Running analysis again will create a new analysis record and replace the linked analysis for this session. Do you want to continue?",
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage("");

      const recordedFile = new File(
        [recordedBlob],
        `session-${sessionId}-interview-recording.webm`,
        {
          type: recordedBlob.type || "video/webm",
        },
      );

      const response = await analyzeVideo(recordedFile, sessionId);

      if (!response.success) {
        throw new Error(response.message || "Video analysis failed.");
      }

      const analysisId = response.data.analysis_id;

      await updateSession(sessionId, {
        analysis_status: "Analyzed",
        linked_analysis_id: analysisId,
        session_status: "Analyzed",
      });

      setCompletedAnalysisId(analysisId);

      setSession((currentSession) => ({
        ...currentSession,
        analysis_status: "Analyzed",
        linked_analysis_id: analysisId,
        session_status: "Analyzed",
      }));

      navigate(`/saved-analysis?id=${analysisId}`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error?.response?.data?.detail ||
          error.message ||
          "Something went wrong while analyzing the recorded interview.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  if (errorMessage && !session) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading meeting room...
        </div>
      </div>
    );
  }

  const consentGiven = session.consent_status === "Given";

  if (!consentGiven) {
    return <ConsentRequiredView session={session} navigate={navigate} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-950">
            Online Interview Room
          </h1>

          <p className="mt-2 max-w-3xl text-gray-600">
            Conduct the live interview using the embedded meeting room. After
            the session, recorded interview media can be analyzed through the
            multimodal pipeline and linked back to this session for review and
            reporting.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate("/sessions")}
            className="rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Back to Sessions
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          {errorMessage}
        </div>
      )}

      {meetingEnded && !completedAnalysisId && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={22} className="mt-0.5" />
            <div>
              <p className="font-semibold">Interview completed</p>
              <p className="mt-1 text-sm">
                This session is ready for analysis if a recording is available.
              </p>
            </div>
          </div>
        </div>
      )}

      {completedAnalysisId && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="mt-0.5" />

              <div>
                <p className="font-semibold">Analysis completed successfully</p>
                <p className="mt-1 text-sm">
                  This interview session is linked to analysis #
                  {completedAnalysisId}. You can review the multimodal timeline
                  or open the generated report.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate(`/saved-analysis?id=${completedAnalysisId}`)
                }
                className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
              >
                Open Analysis
              </button>

              <button
                onClick={() => navigate(`/report/${completedAnalysisId}`)}
                className="rounded-xl border border-green-300 bg-white px-5 py-3 text-sm font-semibold text-green-800 hover:bg-green-100"
              >
                Open Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-950">
                  Live Interview Room
                </h2>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  This embedded Jitsi room allows the interviewer and candidate
                  to join the same virtual interview session.
                </p>
              </div>

              <div className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-600">
                Room: {session?.meeting_room_name || "N/A"}
              </div>
            </div>

            <JitsiMeetingFrame
              roomName={session?.meeting_room_name}
              displayName="Demo Interviewer"
              role="interviewer"
              height={620}
            />

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {!meetingStarted && !meetingEnded && (
                <button
                  onClick={startMeeting}
                  className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                >
                  <PlayCircle size={18} />
                  Start Interview
                </button>
              )}

              {!isRecording && meetingStarted && !meetingEnded && (
                <button
                  onClick={startRecording}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  <Video size={18} />
                  Start Recording
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="inline-flex items-center gap-2 rounded-xl bg-yellow-600 px-5 py-3 text-sm font-semibold text-white hover:bg-yellow-700"
                >
                  <Square size={18} />
                  Stop Recording
                </button>
              )}

              {!meetingEnded && (
                <button
                  onClick={endMeeting}
                  disabled={!meetingStarted}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                    meetingStarted
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-300 text-gray-600 cursor-not-allowed"
                  }`}
                >
                  <PhoneOff size={18} />
                  End Interview
                </button>
              )}
            </div>

            {isRecording && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
                Recording in progress...
              </div>
            )}
          </div>

          {recordedVideoUrl && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-950">
                    Recorded Interview Preview
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Review the recording before sending it to the analysis
                    pipeline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={analyzeRecordedInterview}
                  disabled={isAnalyzing}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                    isAnalyzing
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-gray-950 text-white hover:bg-gray-800"
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Running Multimodal Analysis...
                    </>
                  ) : completedAnalysisId ? (
                    <>
                      <Upload size={18} />
                      Re-analyze Recording
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Analyze Recording
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl bg-black">
                <video
                  ref={previewVideoRef}
                  src={recordedVideoUrl}
                  controls
                  className="w-full max-h-[460px]"
                />
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
                <ClipboardList size={22} />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-950">
                  Interview Notes
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Add notes during the interview. These notes are stored locally
                  for the demo workflow.
                </p>

                <textarea
                  value={interviewNotes}
                  onChange={(event) => setInterviewNotes(event.target.value)}
                  rows="6"
                  className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-950"
                  placeholder="Write interviewer notes here..."
                />

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveNotes}
                    className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SessionInfoCard session={session} />

          {completedAnalysisId && (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <h2 className="text-lg font-semibold text-green-950">
                Analysis Available
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-800">
                This session has already been analyzed and linked to analysis #
                {completedAnalysisId}. You can open the saved timeline or
                report.
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={() =>
                    navigate(`/saved-analysis?id=${completedAnalysisId}`)
                  }
                  className="rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Open Analysis
                </button>

                <button
                  onClick={() => navigate(`/report/${completedAnalysisId}`)}
                  className="rounded-xl border border-green-300 bg-white px-5 py-3 text-sm font-semibold text-green-800 hover:bg-green-100"
                >
                  Open Report
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-lg font-semibold text-blue-950">
              Recording Workflow
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-800">
              This demo records the local browser media stream and sends the
              resulting recording to the FastAPI multimodal analysis endpoint.
              The completed result is linked back to this interview session.
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-6">
            <h2 className="text-lg font-semibold text-yellow-950">
              Format Notice
            </h2>
            <p className="mt-2 text-sm leading-6 text-yellow-800">
              Browser recordings are usually saved as WEBM. If your backend
              cannot decode WEBM, we can add FFmpeg conversion to MP4 as the
              next improvement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentRequiredView({ session, navigate }) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="rounded-2xl bg-yellow-100 p-4 text-yellow-800">
            <AlertTriangle size={32} />
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-yellow-950">
              Candidate Consent Required
            </h1>

            <p className="mt-3 leading-7 text-yellow-900">
              This interview session cannot be opened until the candidate has
              provided consent for recording and behavioral inconsistency
              analysis.
            </p>

            <div className="mt-6 rounded-2xl bg-white/70 p-5">
              <p className="text-sm text-yellow-900">
                <span className="font-semibold">Session:</span> #
                {session.session_id}
              </p>
              <p className="mt-2 text-sm text-yellow-900">
                <span className="font-semibold">Candidate:</span>{" "}
                {session.candidate_name}
              </p>
              <p className="mt-2 text-sm text-yellow-900">
                <span className="font-semibold">Stage:</span> {session.stage}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate(`/consent/${session.session_id}`)}
                className="rounded-xl bg-yellow-700 px-5 py-3 text-sm font-semibold text-white hover:bg-yellow-800"
              >
                Open Consent Form
              </button>

              <button
                onClick={() => navigate("/sessions")}
                className="rounded-xl border border-yellow-300 bg-white px-5 py-3 text-sm font-semibold text-yellow-900 hover:bg-yellow-100"
              >
                Back to Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionInfoCard({ session }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-gray-100 p-3 text-gray-700">
          <CalendarDays size={22} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            Session Details
          </h2>
          <p className="text-sm text-gray-500">Interview session metadata</p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <InfoRow label="Session ID" value={`#${session.session_id}`} />
        <InfoRow label="Candidate" value={session.candidate_name} />
        <InfoRow label="Stage" value={session.stage} />
        <InfoRow label="Date" value={session.session_date} />
        <InfoRow label="Time" value={session.session_time} />
        <InfoRow label="Mode" value={session.meeting_mode} />
        <InfoRow label="Consent" value={session.consent_status} />
        <InfoRow label="Status" value={session.session_status} />
        <InfoRow label="Analysis" value={session.analysis_status} />
        {session.linked_analysis_id && (
          <InfoRow
            label="Analysis ID"
            value={`#${session.linked_analysis_id}`}
          />
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-semibold text-gray-950">
        {value || "N/A"}
      </span>
    </div>
  );
}
