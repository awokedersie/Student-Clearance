import React from 'react';

/* ─── Base pulse block ──────────────────────────────────────────── */
const Pulse: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-gray-200 animate-pulse rounded-xl ${className}`} />
);

/* ─── Student Dashboard skeleton ────────────────────────────────── */
export const SkeletonStudentDashboard: React.FC = () => (
    <div className="space-y-6 md:space-y-8 p-4 md:p-8">
        {/* Welcome card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 border border-gray-100">
            <div className="space-y-3 w-full max-w-lg">
                <Pulse className="h-5 w-32" />
                <Pulse className="h-10 w-3/4" />
                <Pulse className="h-4 w-2/3" />
            </div>
            <div className="flex gap-3">
                <Pulse className="h-16 w-28 rounded-2xl" />
                <Pulse className="h-16 w-28 rounded-2xl" />
            </div>
        </div>

        {/* Nav cards row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 border border-gray-50 space-y-4">
                    <Pulse className="h-14 w-14 rounded-[20px]" />
                    <Pulse className="h-5 w-2/3" />
                    <Pulse className="h-3 w-full" />
                    <Pulse className="h-3 w-4/5" />
                    <Pulse className="h-3 w-1/3 mt-6" />
                </div>
            ))}
        </div>

        {/* Info + status row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 bg-white rounded-[32px] p-6 md:p-8 border border-gray-50 space-y-4">
                <Pulse className="h-5 w-1/3" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-[20px] border border-gray-100">
                        <Pulse className="h-12 w-12 rounded-2xl shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Pulse className="h-4 w-1/2" />
                            <Pulse className="h-3 w-3/4" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-indigo-900/10 rounded-[32px] p-6 md:p-8 space-y-6">
                <Pulse className="h-5 w-1/2" />
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Pulse className="h-3 w-1/3 bg-indigo-200" />
                        <Pulse className="h-6 w-1/2 bg-indigo-200" />
                    </div>
                ))}
                <Pulse className="h-10 w-full rounded-2xl bg-indigo-200 mt-4" />
            </div>
        </div>
    </div>
);

/* ─── Admin Dashboard skeleton ──────────────────────────────────── */
export const SkeletonAdminDashboard: React.FC = () => (
    <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <Pulse className="h-8 w-48" />
                <Pulse className="h-4 w-64" />
            </div>
            <Pulse className="h-10 w-24 rounded-2xl" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 space-y-3">
                    <Pulse className="h-8 w-8 rounded-xl" />
                    <Pulse className="h-3 w-1/2" />
                    <Pulse className="h-9 w-1/3" />
                    <Pulse className="h-3 w-1/4" />
                </div>
            ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 space-y-4">
                <Pulse className="h-4 w-40" />
                <Pulse className="h-[300px] w-full rounded-2xl" />
            </div>
            <div className="bg-white rounded-[2rem] p-8 border border-gray-100 space-y-4">
                <Pulse className="h-4 w-32" />
                <Pulse className="h-[250px] w-full rounded-full" />
            </div>
        </div>

        {/* Control panel */}
        <div className="bg-indigo-900/10 rounded-[2.5rem] p-10 flex justify-between items-center gap-6">
            <div className="space-y-3 max-w-md">
                <Pulse className="h-8 w-56 bg-indigo-200" />
                <Pulse className="h-4 w-full bg-indigo-200" />
                <Pulse className="h-4 w-3/4 bg-indigo-200" />
            </div>
            <div className="flex gap-4">
                <Pulse className="h-12 w-36 rounded-2xl bg-indigo-200" />
                <Pulse className="h-12 w-36 rounded-2xl bg-emerald-200" />
            </div>
        </div>
    </div>
);

/* ─── Table skeleton (Manage Students, Admins, Audit Logs, Dept) ─ */
export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 8, cols = 5 }) => (
    <div className="p-8 space-y-6">
        {/* Action bar */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 flex justify-between items-center">
            <div className="flex gap-3">
                <Pulse className="h-11 w-32 rounded-2xl" />
                <Pulse className="h-11 w-24 rounded-2xl" />
            </div>
            <div className="flex gap-2">
                <Pulse className="h-11 w-44 rounded-2xl" />
                <Pulse className="h-11 w-11 rounded-2xl" />
            </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[40px] border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex gap-6 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                {[...Array(cols)].map((_, i) => (
                    <Pulse key={i} className="h-3 flex-1" />
                ))}
            </div>
            {/* Rows */}
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-gray-50 last:border-0">
                    <Pulse className="h-5 w-5 rounded-lg shrink-0" />
                    <div className="flex items-center gap-3 flex-1">
                        <Pulse className="h-11 w-11 rounded-2xl shrink-0" />
                        <div className="space-y-1.5 flex-1">
                            <Pulse className="h-3.5 w-32" />
                            <Pulse className="h-2.5 w-20" />
                        </div>
                    </div>
                    <Pulse className="h-3 flex-1" />
                    <Pulse className="h-7 w-20 rounded-full" />
                    <Pulse className="h-7 w-20 rounded-full" />
                    <div className="flex gap-1.5">
                        <Pulse className="h-9 w-9 rounded-xl" />
                        <Pulse className="h-9 w-9 rounded-xl" />
                        <Pulse className="h-9 w-9 rounded-xl" />
                    </div>
                </div>
            ))}
            {/* Pagination */}
            <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 border-t border-gray-100">
                <Pulse className="h-4 w-36" />
                <div className="flex gap-2">
                    <Pulse className="h-9 w-20 rounded-xl" />
                    <Pulse className="h-9 w-20 rounded-xl" />
                </div>
            </div>
        </div>
    </div>
);

/* ─── Notifications / Feed skeleton ─────────────────────────────── */
export const SkeletonFeed: React.FC = () => (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <Pulse className="h-8 w-40" />
                <Pulse className="h-3 w-64" />
            </div>
            <Pulse className="h-12 w-52 rounded-2xl" />
        </div>

        {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-[32px] p-8 border border-gray-100 flex gap-6">
                <Pulse className="h-14 w-14 rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between">
                        <Pulse className="h-5 w-48" />
                        <Pulse className="h-5 w-20 rounded-full" />
                    </div>
                    <Pulse className="h-px w-full" />
                    <Pulse className="h-3 w-full" />
                    <Pulse className="h-3 w-3/4" />
                </div>
            </div>
        ))}
    </div>
);

/* ─── Profile skeleton ───────────────────────────────────────────── */
export const SkeletonProfile: React.FC = () => (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Photo card */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 space-y-4 text-center flex flex-col items-center">
                <Pulse className="h-40 w-40 rounded-3xl" />
                <Pulse className="h-5 w-1/2" />
                <Pulse className="h-3 w-2/3" />
                <div className="bg-indigo-900/10 rounded-3xl p-6 w-full space-y-3">
                    {[...Array(3)].map((_, i) => <Pulse key={i} className="h-3 w-3/4 mx-auto bg-indigo-200" />)}
                </div>
            </div>
            {/* Details */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 md:p-10 border border-gray-100 space-y-6">
                <Pulse className="h-6 w-40" />
                <div className="grid sm:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Pulse className="h-3 w-1/3" />
                            <Pulse className="h-12 w-full rounded-2xl" />
                        </div>
                    ))}
                </div>
                <Pulse className="h-14 w-full rounded-[24px] mt-4" />
            </div>
        </div>
    </div>
);

/* ─── Clearance Request skeleton ────────────────────────────────── */
export const SkeletonClearanceRequest: React.FC = () => (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        {/* Status alert */}
        <div className="p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
            <Pulse className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
                <Pulse className="h-4 w-32" />
                <Pulse className="h-3 w-2/3" />
            </div>
            <Pulse className="h-10 w-28 rounded-2xl hidden sm:block" />
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-3">
                    <Pulse className="h-3 w-1/3" />
                    <div className="flex items-center gap-4">
                        <Pulse className="h-10 w-10 rounded-xl shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Pulse className="h-4 w-1/2" />
                            <Pulse className="h-3 w-3/4" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 space-y-6">
            <Pulse className="h-7 w-56" />
            <div className="space-y-2">
                <div className="flex justify-between">
                    <Pulse className="h-3 w-40" />
                    <Pulse className="h-3 w-16" />
                </div>
                <Pulse className="h-32 w-full rounded-2xl" />
            </div>
            <Pulse className="h-20 w-full rounded-2xl" />
            <Pulse className="h-14 w-full rounded-[24px]" />
        </div>
    </div>
);

/* ─── Clearance Status skeleton ─────────────────────────────────── */
export const SkeletonClearanceStatus: React.FC = () => (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="bg-white rounded-3xl border border-gray-100">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <div className="space-y-2">
                    <Pulse className="h-7 w-44" />
                    <Pulse className="h-3 w-36" />
                </div>
                <Pulse className="h-7 w-28 rounded-full" />
            </div>
            <div className="px-8 py-10 space-y-6">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-5">
                        <Pulse className="h-11 w-11 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2 pt-1">
                            <div className="flex justify-between items-center">
                                <Pulse className="h-5 w-36" />
                                <Pulse className="h-6 w-24 rounded-full" />
                            </div>
                            <Pulse className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/* ─── Clearance Settings skeleton ───────────────────────────────── */
export const SkeletonSettings: React.FC = () => (
    <div className="p-8 space-y-8">
        {/* Hero */}
        <div className="bg-white rounded-[40px] p-10 border border-gray-100 flex justify-between items-center gap-8">
            <div className="space-y-3">
                <Pulse className="h-4 w-28" />
                <Pulse className="h-9 w-64" />
                <Pulse className="h-4 w-48" />
            </div>
            <Pulse className="h-24 w-24 rounded-[30px]" />
        </div>
        {/* Config form */}
        <div className="bg-white rounded-[40px] p-10 border border-gray-100 space-y-8">
            <Pulse className="h-5 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Pulse className="h-3 w-1/3" />
                        <Pulse className="h-14 w-full rounded-3xl" />
                    </div>
                ))}
            </div>
            <Pulse className="h-16 w-full rounded-3xl" />
            <Pulse className="h-14 w-full rounded-3xl" />
        </div>
    </div>
);

/* ─── Default full-page spinner (keep for fallback) ─────────────── */
export const SkeletonSpinner: React.FC = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="relative">
            <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter animate-pulse">DBU</span>
            </div>
            <div className="absolute -inset-4 bg-indigo-500/5 rounded-full animate-ping opacity-20 -z-10" />
        </div>
    </div>
);
