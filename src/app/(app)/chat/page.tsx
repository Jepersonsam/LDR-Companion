"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Heart,
  Smile,
  Trash2,
  Sparkles,
  MessageCircleHeart,
  Image as ImageIcon,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatTime, formatRelativeTime } from "@/lib/utils";

const QUICK_EMOJIS = ["❤️", "🥰", "🥺", "😘", "✨", "🫂", "💕", "🌹", "🍰", "💌"];

export default function ChatPage() {
  const { user, couple, token, isLoading } = useAuth();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(
    api.messages.listMessages,
    token ? { token, limit: 100 } : "skip"
  );

  const sendMessageMutation = useMutation(api.messages.sendMessage);
  const deleteMessageMutation = useMutation(api.messages.deleteMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !content.trim()) return;

    const textToSend = content.trim();
    setContent("");
    setIsSending(true);

    try {
      await sendMessageMutation({
        token,
        content: textToSend,
      });
    } catch (err) {
      console.error("Failed to send message", err);
      setContent(textToSend); // Restore on error
    } finally {
      setIsSending(false);
    }
  };

  const handleQuickEmoji = async (emoji: string) => {
    if (!token) return;
    try {
      await sendMessageMutation({
        token,
        content: emoji,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (messageId: any) => {
    if (!token) return;
    if (confirm("Hapus pesan ini?")) {
      try {
        await deleteMessageMutation({
          token,
          messageId,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Menghubungkan ke chat room..." />;
  }

  const partnerName = couple.partner?.name ?? "Partner";

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-6.5rem)] max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden border border-rose-200/80 dark:border-rose-950/80 shadow-2xl shadow-rose-500/5">
      {/* Chat Room Header */}
      <div className="flex items-center justify-between px-6 py-4 glass-panel border-b border-rose-200/60 dark:border-rose-950/60 shrink-0">
        <div className="flex items-center gap-3">
          <Avatar
            name={partnerName}
            src={couple.partner?.avatarUrl}
            size="md"
            ring
          />
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>{partnerName}</span>
              <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ruang Chat Pribadi Berdua</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1">
          {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleQuickEmoji(emoji)}
              className="h-8 w-8 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/60 flex items-center justify-center text-base transition-transform hover:scale-125 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((msg, index) => {
            const isMe = msg.isSender;
            const showAvatar =
              index === 0 ||
              messages[index - 1].senderId !== msg.senderId;

            return (
              <div
                key={msg._id}
                className={`flex items-end gap-2 group ${
                  isMe ? "justify-end" : "justify-start"
                }`}
              >
                {!isMe && (
                  <div className="w-7 shrink-0">
                    {showAvatar && (
                      <Avatar
                        name={msg.senderName}
                        src={msg.senderAvatarUrl}
                        size="xs"
                      />
                    )}
                  </div>
                )}

                <div
                  className={`relative max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm transition-all shadow-sm ${
                    isMe
                      ? "bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-br-none shadow-rose-500/10"
                      : "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-bl-none border border-rose-100 dark:border-rose-900/40"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                      isMe ? "text-rose-100" : "text-stone-400"
                    }`}
                  >
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      <button
                        onClick={() => handleDelete(msg._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white ml-1"
                        title="Hapus pesan"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isMe && (
                  <div className="w-7 shrink-0">
                    {showAvatar && (
                      <Avatar
                        name={user?.name ?? "Me"}
                        src={user?.avatarUrl}
                        size="xs"
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-500 shadow-inner">
              <MessageCircleHeart className="h-8 w-8 text-rose-500 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
              Belum ada pesan di sini
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs">
              Mulai percakapan manis dengan pasanganmu hari ini!
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popup on Mobile/Compact */}
      {showEmojiPicker && (
        <div className="px-4 py-2 border-t border-rose-100 dark:border-rose-950/60 bg-rose-50/80 dark:bg-stone-900/80 flex items-center justify-around">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setContent((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-xl p-1 hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-4 glass-panel border-t border-rose-200/60 dark:border-rose-950/60 flex items-center gap-2 shrink-0"
      >
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2.5 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
        >
          <Smile className="h-5 w-5" />
        </button>

        <input
          type="text"
          placeholder={`Kirim pesan untuk ${partnerName}...`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-white/80 dark:bg-stone-900/80 px-4 py-2.5 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-400/30"
        />

        <Button
          type="submit"
          variant="romantic"
          size="icon"
          isLoading={isSending}
          disabled={!content.trim()}
          className="shrink-0 h-10 w-10 rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
