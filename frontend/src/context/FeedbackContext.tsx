import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ModalConfig {
    title: string;
    message: string;
    type: 'alert' | 'confirm' | 'prompt';
    defaultValue?: string;
    onResolve: (value: any) => void;
}

interface FeedbackContextType {
    showToast: (message: string, type?: ToastType) => void;
    showAlert: (title: string, message: string) => Promise<void>;
    showConfirm: (title: string, message: string) => Promise<boolean>;
    showPrompt: (title: string, message: string, defaultValue?: string) => Promise<string | null>;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
};

interface FeedbackProviderProps {
    children: ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [modal, setModal] = useState<ModalConfig | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const showAlert = useCallback((title: string, message: string) => {
        return new Promise<void>((resolve) => {
            setModal({
                title,
                message,
                type: 'alert',
                onResolve: () => {
                    setModal(null);
                    resolve();
                }
            });
        });
    }, []);

    const showConfirm = useCallback((title: string, message: string) => {
        return new Promise<boolean>((resolve) => {
            setModal({
                title,
                message,
                type: 'confirm',
                onResolve: (value) => {
                    setModal(null);
                    resolve(value);
                }
            });
        });
    }, []);

    const showPrompt = useCallback((title: string, message: string, defaultValue = '') => {
        return new Promise<string | null>((resolve) => {
            setModal({
                title,
                message,
                type: 'prompt',
                defaultValue,
                onResolve: (value) => {
                    setModal(null);
                    resolve(value);
                }
            });
        });
    }, []);

    return (
        <FeedbackContext.Provider value={{ showToast, showAlert, showConfirm, showPrompt }}>
            {children}
            
            {/* Toasts Container */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-10 duration-300 ${
                            toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-xl">
                                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '🚨' : 'ℹ️'}
                            </span>
                            <p className="font-bold text-sm">{toast.message}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay */}
            {modal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <h3 className="text-xl font-black text-white italic tracking-tight mb-2 uppercase">
                                {modal.title}
                            </h3>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-6">
                                {modal.message}
                            </p>

                            {modal.type === 'prompt' && (
                                <input
                                    autoFocus
                                    type="text"
                                    className="feedback-modal-input w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-6"
                                    placeholder="Enter your response..."
                                    defaultValue={modal.defaultValue}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') modal.onResolve((e.target as HTMLInputElement).value);
                                        if (e.key === 'Escape') modal.onResolve(null);
                                    }}
                                />
                            )}

                            <div className="flex gap-3">
                                {modal.type !== 'alert' && (
                                    <button
                                        onClick={() => modal.onResolve(null)}
                                        className="flex-1 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest transition-all"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (modal.type === 'prompt') {
                                            const input = document.querySelector('.feedback-modal-input') as HTMLInputElement;
                                            modal.onResolve(input?.value || '');
                                        } else {
                                            modal.onResolve(true);
                                        }
                                    }}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    {modal.type === 'confirm' ? 'Confirm' : modal.type === 'prompt' ? 'Submit' : 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
};
