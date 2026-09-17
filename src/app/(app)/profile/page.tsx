"use client";

import React, { useState, useRef } from "react";
import {
  User,
  Heart,
  Calendar,
  KeyRound,
  Camera,
  Copy,
  Check,
  LogOut,
  Save,
  Sparkles,
  ShieldCheck,
  HeartCrack,
  AlertTriangle,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/ConvexClientProvider";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

export default function ProfilePage() {
  const { user, couple, token, logout, isLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [startDate, setStartDate] = useState(couple?.startDate || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [isLeavingCouple, setIsLeavingCouple] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [dateMsg, setDateMsg] = useState("");

  const updateProfileMutation = useMutation(api.users.updateProfile);
  const generateAvatarUploadUrlMutation = useMutation(
    api.users.generateAvatarUploadUrl
  );
  const updateStartDateMutation = useMutation(api.couples.updateStartDate);
  const leaveCoupleMutation = useMutation(api.couples.leaveCouple);

  const handleLeaveCouple = async () => {
    if (!token) return;
    setIsLeavingCouple(true);
    try {
      await leaveCoupleMutation({ token });
      setShowLeaveConfirm(false);
      router.push("/onboarding");
    } catch (err: any) {
      alert(err.message || "Gagal keluar dari ruang hubungan.");
    } finally {
      setIsLeavingCouple(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setIsUpdatingProfile(true);
    setProfileMsg("");

    try {
      await updateProfileMutation({
        token,
        name: name.trim(),
      });
      setProfileMsg("Profil berhasil diperbarui!");
      setTimeout(() => setProfileMsg(""), 3000);
    } catch (err: any) {
      setProfileMsg(err?.message || "Gagal memperbarui profil.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!token || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    try {
      setIsUpdatingProfile(true);
      const postUrl = await generateAvatarUploadUrlMutation({ token });

      const uploadResult = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResult.ok) throw new Error("Upload avatar gagal.");
      const { storageId } = await uploadResult.json();

      await updateProfileMutation({
        token,
        name: name || user?.name,
        avatarStorageId: storageId,
      });

      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.3 },
        colors: ["#fb7185", "#f43f5e"],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateStartDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !startDate) return;
    setIsUpdatingDate(true);
    setDateMsg("");

    try {
      await updateStartDateMutation({
        token,
        startDate,
      });
      setDateMsg("Tanggal hubungan diperbarui!");
      setTimeout(() => setDateMsg(""), 3000);
    } catch (err: any) {
      setDateMsg(err?.message || "Gagal memperbarui tanggal.");
    } finally {
      setIsUpdatingDate(false);
    }
  };

  const handleCopyCode = () => {
    if (!couple?.inviteCode) return;
    navigator.clipboard.writeText(couple.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading || !couple) {
    return <LoadingSpinner message="Memuat profil..." />;
  }

  const partnerName = couple.partner?.name ?? "Partner Belum Terhubung";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <User className="h-7 w-7 text-rose-500" />
          <span>Profil & Space Setting</span>
        </h1>
        <p className="text-xs md:text-sm text-stone-500 dark:text-stone-400 mt-1">
          Kelola informasi akun pribadi dan pengaturan ruang cinta bersama.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <Card variant="glass" padding="lg">
          <CardHeader className="pb-4 border-b border-rose-100 dark:border-rose-950">
            <CardTitle className="text-base font-bold">Profil Akun</CardTitle>
            <CardDescription>Informasi nama dan foto profil kamu</CardDescription>
          </CardHeader>

          <CardContent className="pt-5 space-y-6">
            {/* Avatar with Upload button */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar
                  name={user?.name ?? "User"}
                  src={user?.avatarUrl}
                  size="xl"
                  ring
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors cursor-pointer"
                  title="Ganti Foto Profil"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  {user?.name}
                </h3>
                <p className="text-xs text-stone-400">{user?.email}</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1"
                >
                  <span>Ganti foto avatar</span>
                </button>
              </div>
            </div>

            {profileMsg && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                {profileMsg}
              </div>
            )}

            {/* Name Form */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Nama Lengkap / Panggilan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Email (Terdaftar)"
                value={user?.email || ""}
                disabled
                hint="Email tidak dapat diubah"
              />

              <Button
                type="submit"
                variant="romantic"
                size="md"
                isLoading={isUpdatingProfile}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                <span>Simpan Perubahan Profil</span>
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Relationship Details Card */}
        <div className="space-y-6">
          <Card variant="glass" padding="lg">
            <CardHeader className="pb-4 border-b border-rose-100 dark:border-rose-950">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">Ruang Hubungan (Couple)</CardTitle>
                <Badge variant={couple.status === "active" ? "rose" : "amber"}>
                  {couple.status === "active" ? "Aktif & Terhubung" : "Menunggu Pasangan"}
                </Badge>
              </div>
              <CardDescription>Detail ikatan cinta kalian</CardDescription>
            </CardHeader>

            <CardContent className="pt-5 space-y-5">
              {/* Partner Overview */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                <Avatar
                  name={partnerName}
                  src={couple.partner?.avatarUrl}
                  size="md"
                  ring
                />
                <div>
                  <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                    Pasangan Tercinta
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {partnerName}
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    {couple.partner?.email || "Menunggu bergabung dengan kode undangan"}
                  </p>
                </div>
              </div>

              {/* Invite Code Share */}
              <div className="p-3.5 rounded-2xl border border-rose-200/80 dark:border-rose-900/60 bg-white/50 dark:bg-stone-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                    Kode Undangan (Invite Code)
                  </span>
                  <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                    {couple.inviteCode}
                  </span>
                </div>
                <Button
                  onClick={handleCopyCode}
                  variant={copied ? "secondary" : "outline"}
                  size="sm"
                  className="w-full gap-2 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Kode Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Kode Undangan</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Anniversary Date Update */}
              {dateMsg && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-2.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {dateMsg}
                </div>
              )}

              <form onSubmit={handleUpdateStartDate} className="space-y-3">
                <Input
                  label="Tanggal Mulai Hubungan (Anniversary)"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  icon={<Calendar className="h-4 w-4" />}
                />

                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={isUpdatingDate}
                  className="w-full gap-1.5 text-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Update Tanggal Hubungan</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone: Leave / Unlink Couple Card */}
          <Card variant="glass" padding="md" className="border-red-300 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                  <HeartCrack className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                    Keluar dari Ruang Hubungan
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                    Memutuskan hubungan pasangan dari ruang ini. Anda akan kembali ke halaman awal (onboarding).
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                variant="outline"
                size="sm"
                className="w-full border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-950/50 gap-2"
              >
                <HeartCrack className="h-4 w-4" />
                <span>Putuskan / Keluar dari Pasangan</span>
              </Button>
            </div>
          </Card>

          {/* Logout Action Card */}
          <Card variant="solid" padding="md" className="border-stone-200 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Keluar dari Akun
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Akhiri sesi login di perangkat ini
                </p>
              </div>

              <Button
                onClick={() => logout()}
                variant="danger"
                size="sm"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal for Leaving Couple Space */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-stone-900 p-6 shadow-2xl border border-red-200 dark:border-red-900/60 animate-in zoom-in-95 duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 mx-auto mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-center text-stone-900 dark:text-white">
              Keluar dari Ruang Hubungan?
            </h3>
            <p className="mt-2 text-xs text-center text-stone-500 dark:text-stone-400 leading-relaxed">
              Tindakan ini akan memisahkan akun Anda dari <strong className="text-stone-900 dark:text-white">{partnerName}</strong>. Ruang chat, jurnal bersama, dan video call akan terputus. Anda akan diarahkan ke halaman onboarding untuk membuat atau bergabung ke ruang baru.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                disabled={isLeavingCouple}
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1"
              >
                Batal
              </Button>

              <Button
                type="button"
                variant="danger"
                size="md"
                isLoading={isLeavingCouple}
                onClick={handleLeaveCouple}
                className="flex-1 gap-1.5"
              >
                <HeartCrack className="h-4 w-4" />
                <span>Ya, Keluar</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
