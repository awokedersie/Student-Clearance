import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
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
    cancelText = 'Cancel',
    isDangerous = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay-backdrop">
            <div
                className="absolute inset-0"
                onClick={onCancel}
            ></div>
            <div className="modal-card-small">
                <div className="p-6 text-center">
                    <div className={`mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{message}</p>
                </div>
                <div className="bg-gray-50 p-4 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="btn-secondary"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-4 py-2.5 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-sm ${isDangerous
                            ? 'bg-red-600 hover:bg-red-700 shadow-red-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
