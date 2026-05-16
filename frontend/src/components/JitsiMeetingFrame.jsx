import { useEffect, useRef, useState } from "react";

const JITSI_SCRIPT_URL = "https://meet.jit.si/external_api.js";
const JITSI_DOMAIN = "meet.jit.si";

function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${JITSI_SCRIPT_URL}"]`,
    );

    if (existingScript) {
      existingScript.addEventListener("load", resolve);
      existingScript.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = JITSI_SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;

    document.body.appendChild(script);
  });
}

export default function JitsiMeetingFrame({
  roomName,
  displayName,
  userEmail,
  role = "participant",
  height = 620,
}) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);

  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function initializeJitsi() {
      if (!roomName) {
        setErrorMessage("Meeting room name is missing.");
        return;
      }

      try {
        setErrorMessage("");

        await loadJitsiScript();

        if (!isMounted || !containerRef.current) {
          return;
        }

        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }

        const options = {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height,
          userInfo: {
            displayName: displayName || "Participant",
            email: userEmail || "",
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: role === "candidate",
            startWithVideoMuted: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
            DEFAULT_LOCAL_DISPLAY_NAME:
              role === "candidate" ? "Candidate" : "Interviewer",
          },
        };

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);

        api.addListener("videoConferenceJoined", () => {
          console.log("Joined Jitsi room:", roomName);
        });

        api.addListener("videoConferenceLeft", () => {
          console.log("Left Jitsi room:", roomName);
        });

        apiRef.current = api;
      } catch (error) {
        console.error(error);
        setErrorMessage(
          "Could not load the Jitsi meeting. Please check your internet connection.",
        );
      }
    }

    initializeJitsi();

    return () => {
      isMounted = false;

      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, userEmail, role, height]);

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div ref={containerRef} className="w-full bg-gray-950" />
    </div>
  );
}
