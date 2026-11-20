import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    confirmButtonText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    confirmButtonText,
    cancelText = 'Cancel',
    isDangerous = false
}) => {
    if (!isOpen) return null;

    const finalConfirmText = confirmButtonText || confirmText;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
            {/* Backdrop Click Handler */}
            <div
                className="absolute inset-0 bg-transparent"
                onClick={onCancel}
            />

            {/* Modal Card */}
            <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in slide-in-from-bottom-4 duration-300 ring-1 ring-black/5">

                {/* Visual Header / Graphic */}
                <div className="pt-8 px-8 text-center relative z-10">
                    <div className={`mx-auto mb-6 w-20 h-20 rounded-3xl flex items-center justify-center transform rotate-3 shadow-xl ${isDangerous
                            ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-500/30'
                            : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-500/30'
                        }`}>
                        {isDangerous ? (
                            <svg className="w-10 h-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        ) : (
                            <svg className="w-10 h-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight leading-tight">
                        {title}
                    </h3>
                    <p className="text-gray-500 font-medium leading-relaxed mb-4 text-base">
                        {message}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50/80 p-6 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-5 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95 text-sm"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-5 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2 ${isDangerous
                                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/20'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/20'
                            }`}
                    >
                        <span>{finalConfirmText}</span>
                        <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
