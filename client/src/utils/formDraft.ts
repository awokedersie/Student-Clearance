/**
 * Form Draft Utility
 * 
 * Provides auto-save functionality for form drafts:
 * - Saves form state to localStorage with debounce
 * - Restores draft on component mount
 * - Clears draft on successful submit
 * - Handles expiration (24 hours by default)
 */

interface DraftData<T> {
    data: T;
    savedAt: number;
    expiresAt: number;
}

const DEFAULT_DEBOUNCE_MS = 1000;
const DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a storage key for a form draft
 */
const getDraftKey = (formId: string, userId?: string): string => {
    const userPart = userId ? `_${userId}` : '';
    return `form_draft_${formId}${userPart}`;
};

/**
 * Check if a draft has expired
 */
const isDraftExpired = (draft: DraftData<unknown>): boolean => {
    return Date.now() > draft.expiresAt;
};

/**
 * Save a form draft to localStorage
 */
export const saveDraft = <T>(
    formId: string,
    data: T,
    userId?: string,
    expiryMs: number = DEFAULT_EXPIRY_MS
): void => {
    try {
        const key = getDraftKey(formId, userId);
        const draft: DraftData<T> = {
            data,
            savedAt: Date.now(),
            expiresAt: Date.now() + expiryMs,
        };
        localStorage.setItem(key, JSON.stringify(draft));
    } catch (error) {
        console.warn('[FormDraft] Failed to save draft:', error);
    }
};

/**
 * Load a form draft from localStorage
 */
export const loadDraft = <T>(
    formId: string,
    userId?: string
): T | null => {
    try {
        const key = getDraftKey(formId, userId);
        const stored = localStorage.getItem(key);
        
        if (!stored) return null;

        const draft: DraftData<T> = JSON.parse(stored);
        
        // Check expiration
        if (isDraftExpired(draft)) {
            clearDraft(formId, userId);
            return null;
        }

        return draft.data;
    } catch (error) {
        console.warn('[FormDraft] Failed to load draft:', error);
        return null;
    }
};

/**
 * Clear a form draft from localStorage
 */
export const clearDraft = (formId: string, userId?: string): void => {
    try {
        const key = getDraftKey(formId, userId);
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('[FormDraft] Failed to clear draft:', error);
    }
};

/**
 * Get draft metadata (when it was saved)
 */
export const getDraftInfo = (formId: string, userId?: string): { savedAt: Date } | null => {
    try {
        const key = getDraftKey(formId, userId);
        const stored = localStorage.getItem(key);
        
        if (!stored) return null;

        const draft: DraftData<unknown> = JSON.parse(stored);
        
        if (isDraftExpired(draft)) {
            clearDraft(formId, userId);
            return null;
        }

        return { savedAt: new Date(draft.savedAt) };
    } catch {
        return null;
    }
};

/**
 * Create a debounced save function
 */
export const createDebouncedSave = <T>(
    formId: string,
    userId?: string,
    debounceMs: number = DEFAULT_DEBOUNCE_MS
): {
    save: (data: T) => void;
    cancel: () => void;
} => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const save = (data: T) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            saveDraft(formId, data, userId);
        }, debounceMs);
    };

    const cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };

    return { save, cancel };
};

/**
 * React hook for form draft functionality
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFormDraftOptions<T> {
    formId: string;
    userId?: string;
    initialData: T;
    debounceMs?: number;
    expiryMs?: number;
    onDraftLoaded?: (data: T) => void;
}

interface UseFormDraftReturn<T> {
    /** Current form data */
    data: T;
    /** Update form data */
    setData: (data: T | ((prev: T) => T)) => void;
    /** Whether a draft was restored */
    hasDraft: boolean;
    /** When the draft was last saved */
    lastSaved: Date | null;
    /** Clear the draft and reset to initial data */
    clearAndReset: () => void;
    /** Clear the draft (call on successful submit) */
    clearDraft: () => void;
    /** Whether data has been modified from initial */
    isDirty: boolean;
}

export const useFormDraft = <T extends Record<string, unknown>>({
    formId,
    userId,
    initialData,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    expiryMs = DEFAULT_EXPIRY_MS,
    onDraftLoaded,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> => {
    const [data, setDataInternal] = useState<T>(initialData);
    const [hasDraft, setHasDraft] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialDataRef = useRef(initialData);

    // Load draft on mount
    useEffect(() => {
        const draft = loadDraft<T>(formId, userId);
        if (draft) {
            setDataInternal(draft);
            setHasDraft(true);
            setIsDirty(true);
            onDraftLoaded?.(draft);
            
            const info = getDraftInfo(formId, userId);
            if (info) {
                setLastSaved(info.savedAt);
            }
        }
    }, [formId, userId, onDraftLoaded]);

    // Save draft with debounce
    const setData = useCallback((newData: T | ((prev: T) => T)) => {
        setDataInternal((prev) => {
            const nextData = typeof newData === 'function' ? newData(prev) : newData;
            
            // Check if data is different from initial
            const isModified = JSON.stringify(nextData) !== JSON.stringify(initialDataRef.current);
            setIsDirty(isModified);

            // Debounced save
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            if (isModified) {
                saveTimeoutRef.current = setTimeout(() => {
                    saveDraft(formId, nextData, userId, expiryMs);
                    setLastSaved(new Date());
                }, debounceMs);
            }

            return nextData;
        });
    }, [formId, userId, debounceMs, expiryMs]);

    // Clear draft and reset
    const clearAndReset = useCallback(() => {
        clearDraft(formId, userId);
        setDataInternal(initialDataRef.current);
        setHasDraft(false);
        setLastSaved(null);
        setIsDirty(false);
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    }, [formId, userId]);

    // Just clear draft (on successful submit)
    const clearDraftOnly = useCallback(() => {
        clearDraft(formId, userId);
        setHasDraft(false);
        setLastSaved(null);
        setIsDirty(false);
        
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
    }, [formId, userId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        data,
        setData,
        hasDraft,
        lastSaved,
        clearAndReset,
        clearDraft: clearDraftOnly,
        isDirty,
    };
};

/**
 * Draft Recovery Banner Component
 */
interface DraftRecoveryBannerProps {
    hasDraft: boolean;
    lastSaved: Date | null;
    onRestore: () => void;
    onDiscard: () => void;
}

export const DraftRecoveryBanner: React.FC<DraftRecoveryBannerProps> = ({
    hasDraft,
    lastSaved,
    onRestore,
    onDiscard,
}) => {
    if (!hasDraft) return null;

    const formatTime = (date: Date): string => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-medium text-amber-800">Draft Found</p>
                    <p className="text-xs text-amber-600">
                        Saved {lastSaved ? formatTime(lastSaved) : 'recently'}
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={onDiscard}
                    className="px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                >
                    Discard
                </button>
                <button
                    onClick={onRestore}
                    className="px-3 py-1.5 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                    Restore
                </button>
            </div>
        </div>
    );
};

// Re-export for convenience
import React from 'react';
export default {
    saveDraft,
    loadDraft,
    clearDraft,
    getDraftInfo,
    createDebouncedSave,
    useFormDraft,
    DraftRecoveryBanner,
};
