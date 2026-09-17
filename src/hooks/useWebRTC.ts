"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun.services.mozilla.com" },
  ],
  iceCandidatePoolSize: 10,
};

interface UseWebRTCOptions {
  token: string | null;
  callId: Id<"calls"> | null;
  isCaller: boolean;
  onEnded?: () => void;
}

export function useWebRTC({ token, callId, isCaller, onEnded }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [connectionState, setConnectionState] = useState<string>("connecting");
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
  const [isPeerReady, setIsPeerReady] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const hasCreatedOfferRef = useRef(false);

  const sendSignalMutation = useMutation(api.calls.sendSignal);

  // Subscribe to signals for this call
  const signals = useQuery(
    api.calls.getCallSignals,
    token && callId ? { token, callId } : "skip"
  );

  // Initialize Media Stream & PeerConnection
  const initConnection = useCallback(async () => {
    try {
      // 1. Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setLocalStream(stream);

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerRef.current = pc;

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote incoming tracks
      const inboundStream = new MediaStream();
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            remoteVideoRef.current.play().catch(() => {});
          }
        } else {
          inboundStream.addTrack(event.track);
          setRemoteStream(inboundStream);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = inboundStream;
            remoteVideoRef.current.play().catch(() => {});
          }
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && token && callId) {
          sendSignalMutation({
            token,
            callId,
            type: "candidate",
            payload: JSON.stringify(event.candidate.toJSON()),
          }).catch(console.error);
        }
      };

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };

      // 3. If caller, create & send Offer
      if (isCaller && !hasCreatedOfferRef.current && token && callId) {
        hasCreatedOfferRef.current = true;
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        await sendSignalMutation({
          token,
          callId,
          type: "offer",
          payload: JSON.stringify(offer),
        });
      }

      setIsPeerReady(true);
      return pc;
    } catch (err) {
      console.error("Failed to access camera/mic or create peer connection", err);
      setConnectionState("error");
      return null;
    }
  }, [token, callId, isCaller, sendSignalMutation]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  // Setup Peer on mount / call start
  useEffect(() => {
    if (!callId || !token) return;

    initConnection();

    return () => {
      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }
      setLocalStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
      setRemoteStream(null);
      setIsPeerReady(false);
      hasCreatedOfferRef.current = false;
      processedSignalIdsRef.current.clear();
      pendingCandidatesRef.current = [];
    };
  }, [callId, token, initConnection]);

  // Process incoming signals
  useEffect(() => {
    if (!signals || !isPeerReady || !peerRef.current || !token || !callId) return;

    const processSignals = async () => {
      const pc = peerRef.current;
      if (!pc) return;

      for (const signal of signals) {
        if (signal.isMe || processedSignalIdsRef.current.has(signal._id)) {
          continue;
        }
        processedSignalIdsRef.current.add(signal._id);

        try {
          if (signal.type === "offer" && !isCaller) {
            const offerData = JSON.parse(signal.payload);
            await pc.setRemoteDescription(new RTCSessionDescription(offerData));

            // Process pending ICE candidates that arrived before offer
            for (const candidate of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error("Error adding queued ICE candidate", e);
              }
            }
            pendingCandidatesRef.current = [];

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await sendSignalMutation({
              token,
              callId,
              type: "answer",
              payload: JSON.stringify(answer),
            });
          } else if (signal.type === "answer" && isCaller) {
            const answerData = JSON.parse(signal.payload);
            if (pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(answerData));

              for (const candidate of pendingCandidatesRef.current) {
                try {
                  await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                  console.error("Error adding queued ICE candidate", e);
                }
              }
              pendingCandidatesRef.current = [];
            }
          } else if (signal.type === "candidate") {
            const candidateData = JSON.parse(signal.payload);
            if (pc.remoteDescription && pc.remoteDescription.type) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidateData));
              } catch (e) {
                console.error("Error adding ICE candidate", e);
              }
            } else {
              pendingCandidatesRef.current.push(candidateData);
            }
          } else if (signal.type === "heart_reaction") {
            // Trigger floating heart animation
            const id = Date.now() + Math.random();
            const x = Math.random() * 80 + 10;
            setHearts((prev) => [...prev, { id, x }]);
            setTimeout(() => {
              setHearts((prev) => prev.filter((h) => h.id !== id));
            }, 3000);
          }
        } catch (err) {
          console.error("Error processing WebRTC signal:", signal.type, err);
        }
      }
    };

    processSignals();
  }, [signals, isPeerReady, isCaller, token, callId, sendSignalMutation]);

  // Controls
  const toggleAudio = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsAudioMuted(!track.enabled);
      });
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoDisabled(!track.enabled);
      });
    }
  }, [localStream]);

  const sendHeart = useCallback(async () => {
    if (!token || !callId) return;
    try {
      // Local burst
      const id = Date.now() + Math.random();
      const x = Math.random() * 80 + 10;
      setHearts((prev) => [...prev, { id, x }]);
      setTimeout(() => {
        setHearts((prev) => prev.filter((h) => h.id !== id));
      }, 3000);

      // Signal partner
      await sendSignalMutation({
        token,
        callId,
        type: "heart_reaction",
        payload: JSON.stringify({ emoji: "❤️" }),
      });
    } catch (err) {
      console.error("Failed to send heart reaction", err);
    }
  }, [token, callId, sendSignalMutation]);

  return {
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoDisabled,
    connectionState,
    hearts,
    toggleAudio,
    toggleVideo,
    sendHeart,
  };
}
