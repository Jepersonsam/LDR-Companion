"use client";

import React, { useState, useRef } from "react";
import {
  Camera,
  Plus,
  Trash2,
  Calendar,
  User,
  Sparkles,
  UploadCloud,
  Maximize2,
  X,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function MemoriesPage() {
  const { user, couple, token, isLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [memoryDate, setMemoryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  // Lightbox State
  const [lightboxMemory, setLightboxMemory] = useState<any>(null);

  const memories = useQuery(
    api.memories.listMemories,
    token ? { token } : "skip"
  );

  const generateUploadUrlMutation = useMutation(
    api.memories.generateMemoryUploadUrl
  );
  const saveMemoryMutation = useMutation(api.memories.saveMemory);
  const deleteMemoryMutation = useMutation(api.memories.deleteMemory);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setError("Ukuran gambar maksimal 10MB.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError("");
    }
  };

  const handleOpenUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    setMemoryDate(new Date().toISOString().split("T")[0]);
    setError("");
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedFile || !caption.trim()) {
      setError("Pilih foto dan isi caption.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      // 1. Get upload URL from Convex
      const postUrl = await generateUploadUrlMutation({ token });

      // 2. POST the image file to Convex storage
      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResult.ok) {
        throw new Error("Gagal mengunggah foto ke storage.");
      }

      const { storageId } = await uploadResult.json();

      // 3. Save memory metadata to Convex DB
      await saveMemoryMutation({
        token,
        storageId,
        caption: caption.trim(),
        date: memoryDate,
      });

      setIsUploadModalOpen(false);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.4 },
        colors: ["#fb7185", "#f43f5e", "#fda4af"],
      });
    } catch (err: any) {
      setError(err?.message || "Gagal mengunggah kenangan.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (memoryId: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) return;
    if (confirm("Hapus foto kenangan ini?")) {
      try {
        await deleteMemoryMutation({
          token,
          memoryId,
        });
        if (lightboxMemory?._id === memoryId) {
          setLightboxMemory(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Membuka album kenangan..." />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Camera className="h-7 w-7 text-rose-500" />
            <span>Memories Gallery</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Galeri foto abadi untuk momen spesial dan kerinduan kalian.
          </p>
        </div>

        <Button
          onClick={handleOpenUpload}
          variant="romantic"
          size="md"
          className="gap-2 shadow-rose-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Foto Kenangan</span>
        </Button>
      </div>

      {/* Photo Gallery Grid */}
      {memories && memories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {memories.map((mem) => (
            <div
              key={mem._id}
              onClick={() => setLightboxMemory(mem)}
              className="glass-card rounded-3xl overflow-hidden border border-rose-200/60 dark:border-rose-950/60 group cursor-pointer hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 flex flex-col"
            >
              {/* Image Thumbnail */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-rose-100 dark:bg-stone-900">
                {mem.imageUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={mem.imageUrl}
                    alt={mem.caption}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white">
                  <span className="text-[11px] font-medium flex items-center gap-1">
                    <Maximize2 className="h-3.5 w-3.5" />
                    Lihat Penuh
                  </span>
                  {mem.isUploader && (
                    <button
                      onClick={(e) => handleDelete(mem._id, e)}
                      className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption & Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 line-clamp-2 leading-relaxed">
                  {mem.caption}
                </p>

                <div className="mt-3 pt-2 border-t border-rose-100 dark:border-rose-950 flex items-center justify-between text-[10px] text-stone-400">
                  <span className="font-medium text-rose-600 dark:text-rose-400 truncate max-w-[100px]">
                    {mem.uploaderName}
                  </span>
                  <span>{formatDate(mem.date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card variant="glass" padding="lg" className="text-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 dark:bg-rose-950 text-rose-500 mx-auto mb-4">
            <Camera className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Belum ada foto kenangan
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Unggah foto kencan pertama, tiket perjalanan, atau momen manis bersama untuk dikenang selamanya.
          </p>
          <Button
            onClick={handleOpenUpload}
            variant="romantic"
            size="md"
            className="mt-6 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Kenangan Pertama</span>
          </Button>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Foto Kenangan Baru"
        description="Foto akan tersimpan dengan aman di Convex Storage ruang kalian."
        maxWidth="md"
      >
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* File Picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-rose-300 dark:border-rose-900/60 rounded-2xl p-4 text-center cursor-pointer hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-all"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-stone-900/80 text-white text-[10px] px-2 py-1 rounded-md">
                  Klik untuk ganti foto
                </div>
              </div>
            ) : (
              <div className="py-6 space-y-2">
                <UploadCloud className="h-10 w-10 text-rose-500 mx-auto" />
                <p className="text-xs font-bold text-stone-700 dark:text-stone-200">
                  Pilih Foto dari Perangkat
                </p>
                <p className="text-[10px] text-stone-400">
                  JPG, PNG, WebP (Maksimal 10MB)
                </p>
              </div>
            )}
          </div>

          <Input
            label="Caption Kenangan"
            placeholder="contoh: Momen seru kita waktu di kafe favorit ❤️"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            required
          />

          <Input
            label="Tanggal Momen / Foto"
            type="date"
            value={memoryDate}
            onChange={(e) => setMemoryDate(e.target.value)}
            required
            icon={<Calendar className="h-4 w-4" />}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="romantic"
              size="md"
              isLoading={isUploading}
              disabled={!selectedFile || !caption.trim()}
            >
              <span>Upload ke Galeri</span>
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      {lightboxMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md animate-in fade-in">
          <button
            onClick={() => setLightboxMemory(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxMemory.imageUrl}
              alt={lightboxMemory.caption}
              className="max-h-[70vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-4 text-center text-white max-w-lg">
              <p className="text-base font-bold">{lightboxMemory.caption}</p>
              <p className="text-xs text-rose-200 mt-1">
                Diunggah oleh {lightboxMemory.uploaderName} • {formatDate(lightboxMemory.date)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
