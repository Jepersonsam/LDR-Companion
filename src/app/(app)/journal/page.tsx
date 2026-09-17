"use client";

import React, { useState } from "react";
import {
  BookHeart,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  User,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export default function JournalPage() {
  const { user, couple, token, isLoading } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const journals = useQuery(
    api.journals.listJournals,
    token ? { token } : "skip"
  );

  const createJournalMutation = useMutation(api.journals.createJournal);
  const updateJournalMutation = useMutation(api.journals.updateJournal);
  const deleteJournalMutation = useMutation(api.journals.deleteJournal);

  const handleOpenCreate = () => {
    setEditingJournalId(null);
    setTitle("");
    setContent("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (journal: any) => {
    setEditingJournalId(journal._id);
    setTitle(journal.title);
    setContent(journal.content);
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError("");
    setIsSubmitting(true);

    try {
      if (editingJournalId) {
        await updateJournalMutation({
          token,
          journalId: editingJournalId,
          title,
          content,
        });
      } else {
        await createJournalMutation({
          token,
          title,
          content,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan journal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (journalId: any) => {
    if (!token) return;
    if (confirm("Hapus catatan journal ini?")) {
      try {
        await deleteJournalMutation({
          token,
          journalId,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Membuka buku journal bersama..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BookHeart className="h-7 w-7 text-rose-500" />
            <span>Shared Journal</span>
          </h1>
          <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
            Buku harian bersama untuk mencatat cerita, ungkapan hati, dan kenangan indah.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="romantic"
          size="md"
          className="gap-2 shadow-rose-500/20"
        >
          <Plus className="h-4 w-4" />
          <span>Tulis Catatan Baru</span>
        </Button>
      </div>

      {/* Journals List */}
      {journals && journals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {journals.map((j) => (
            <Card
              key={j._id}
              variant="glass"
              padding="lg"
              className="flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-900 transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant={j.isAuthor ? "rose" : "pink"}>
                    <User className="h-3 w-3" />
                    <span>{j.authorName} {j.isAuthor ? "(Kamu)" : ""}</span>
                  </Badge>
                  <span className="text-[11px] text-stone-400 font-medium">
                    {formatDate(j.createdAt)}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 line-clamp-1">
                  {j.title}
                </h3>
                <p className="mt-2 text-xs md:text-sm text-stone-600 dark:text-stone-300 whitespace-pre-wrap leading-relaxed">
                  {j.content}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 pt-3 border-t border-rose-100 dark:border-rose-950 flex items-center justify-between text-xs text-stone-400">
                <span>
                  {j.updatedAt !== j.createdAt
                    ? `Diedit ${formatRelativeTime(j.updatedAt)}`
                    : formatRelativeTime(j.createdAt)}
                </span>

                {j.isAuthor && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(j)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-stone-800 text-stone-500 hover:text-rose-600 transition-colors"
                      title="Edit journal"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(j._id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-stone-500 hover:text-red-600 transition-colors"
                      title="Hapus journal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="glass" padding="lg" className="text-center py-14">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-100 dark:bg-rose-950 text-rose-500 mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-rose-500" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Belum ada catatan journal
          </h3>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Jadikan halaman ini sebagai diary perjalanan cinta kalian. Tulis perasaan atau ceritamu hari ini.
          </p>
          <Button
            onClick={handleOpenCreate}
            variant="romantic"
            size="md"
            className="mt-6 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Mulai Menulis Journal Pertama</span>
          </Button>
        </Card>
      )}

      {/* Modal Write / Edit Journal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingJournalId ? "Edit Catatan Journal" : "Tulis Catatan Journal Baru"}
        description="Catatan ini akan dapat dibaca langsung oleh pasanganmu."
        maxWidth="lg"
      >
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 p-3 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Judul Catatan"
            placeholder="contoh: Hari yang Membuatku Rindu Kamu"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-300">
              Isi Catatan Journal
            </label>
            <textarea
              rows={6}
              placeholder="Tuliskan ceritamu di sini..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-white/70 dark:bg-stone-900/60 p-3.5 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-400/20 backdrop-blur-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="romantic"
              size="md"
              isLoading={isSubmitting}
            >
              <span>{editingJournalId ? "Perbarui Catatan" : "Simpan Journal"}</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
