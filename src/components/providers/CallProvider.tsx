"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { IncomingCallModal } from "@/components/call/IncomingCallModal";
import { VideoCallModal } from "@/components/call/VideoCallModal";

interface CallContextType {
  startCall: () => Promise<void>;
  isCallActive: boolean;
}

const CallContext = createContext<CallContextType>({
  startCall: async () => {},
  isCallActive: false,
});

export function CallProvider({ children }: { children: ReactNode }) {
  const { token, couple } = useAuth();
  const [dismissedCallId, setDismissedCallId] = React.useState<string | null>(null);

  const activeCall = useQuery(
    api.calls.getActiveCall,
    token ? { token } : "skip"
  );

  // Clear dismissed state when no active call exists
  React.useEffect(() => {
    if (!activeCall) {
      setDismissedCallId(null);
    }
  }, [activeCall]);

  const initiateCallMutation = useMutation(api.calls.initiateCall);
  const acceptCallMutation = useMutation(api.calls.acceptCall);
  const declineCallMutation = useMutation(api.calls.declineCall);
  const endCallMutation = useMutation(api.calls.endCall);

  const startCall = async () => {
    if (!token || !couple || couple.status !== "active") return;
    setDismissedCallId(null);
    try {
      await initiateCallMutation({ token });
    } catch (err: any) {
      alert(err.message || "Gagal memulai panggilan.");
    }
  };

  const handleAccept = async () => {
    if (!token || !activeCall) return;
    try {
      await acceptCallMutation({
        token,
        callId: activeCall._id,
      });
    } catch (err) {
      console.error("Failed to accept call", err);
    }
  };

  const handleDecline = async () => {
    if (!token || !activeCall) return;
    setDismissedCallId(activeCall._id);
    try {
      await declineCallMutation({
        token,
        callId: activeCall._id,
      });
    } catch (err) {
      console.error("Failed to decline call", err);
    }
  };

  const handleEndCall = async () => {
    if (!token || !activeCall) return;
    const callIdToEnd = activeCall._id;
    setDismissedCallId(callIdToEnd);
    try {
      await endCallMutation({
        token,
        callId: callIdToEnd,
      });
    } catch (err) {
      console.error("Failed to end call", err);
    }
  };

  const isCallActive = !!activeCall && activeCall._id !== dismissedCallId;
  const showIncomingModal =
    isCallActive && activeCall.status === "ringing" && !activeCall.isCaller;
  const showVideoModal =
    isCallActive &&
    (activeCall.status === "ongoing" ||
      (activeCall.status === "ringing" && activeCall.isCaller));

  const partnerName = couple?.partner?.name ?? activeCall?.callerName ?? "Pasangan";
  const partnerAvatar = couple?.partner?.avatarUrl ?? activeCall?.callerAvatarUrl;

  return (
    <CallContext.Provider value={{ startCall, isCallActive }}>
      {children}

      {/* Incoming Call Ringing Modal */}
      {showIncomingModal && (
        <IncomingCallModal
          callerName={activeCall.callerName}
          callerAvatarUrl={activeCall.callerAvatarUrl}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />
      )}

      {/* Ongoing / Calling Video Stage */}
      {showVideoModal && token && (
        <VideoCallModal
          token={token}
          callId={activeCall._id}
          partnerName={partnerName}
          partnerAvatarUrl={partnerAvatar}
          isCaller={activeCall.isCaller}
          status={activeCall.status}
          startedAt={activeCall.startedAt}
          onEndCall={handleEndCall}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}
