import React from 'react';

/**
 * Empty State Component
 * 
 * Displays a visually appealing empty state with:
 * - SVG illustrations matching the context
 * - Clear title and description
 * - Optional call-to-action button
 */

export type EmptyStateType = 
    | 'no-requests'
    | 'no-notifications'
    | 'no-students'
    | 'no-data'
    | 'no-results'
    | 'no-clearance'
    | 'error'
    | 'success'
    | 'pending';

interface EmptyStateProps {
    /** Type of empty state - determines the illustration shown */
    type: EmptyStateType;
    /** Main title text */
    title: string;
    /** Description text explaining the empty state */
    description: string;
    /** Optional action button label */
    actionLabel?: string;
    /** Optional href for the action button (renders as link) */
    actionHref?: string;
    /** Optional click handler for the action button */
    onAction?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

/**
 * SVG Illustrations for each empty state type
 */
const illustrations: Record<EmptyStateType, React.FC<{ className?: string }>> = {
    'no-requests': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="40" y="30" width="120" height="100" rx="12" fill="#E5E7EB" />
            <rect x="50" y="45" width="100" height="8" rx="4" fill="#D1D5DB" />
            <rect x="50" y="60" width="80" height="6" rx="3" fill="#D1D5DB" />
            <rect x="50" y="75" width="90" height="6" rx="3" fill="#D1D5DB" />
            <rect x="50" y="90" width="60" height="6" rx="3" fill="#D1D5DB" />
            <circle cx="100" cy="115" r="20" fill="#6366F1" fillOpacity="0.2" />
            <path d="M93 115L98 120L107 110" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    'no-notifications': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 30C82 30 68 44 68 62V82L58 97H142L132 82V62C132 44 118 30 100 30Z" fill="#E5E7EB" />
            <circle cx="100" cy="115" r="12" fill="#E5E7EB" />
            <path d="M100 40C88 40 78 50 78 62V82L70 94H130L122 82V62C122 50 112 40 100 40Z" fill="#D1D5DB" />
            <circle cx="130" cy="45" r="18" fill="#6366F1" fillOpacity="0.2" />
            <text x="130" y="50" textAnchor="middle" fill="#6366F1" fontSize="14" fontWeight="bold">0</text>
            <path d="M75 135L85 145M85 135L75 145" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
            <path d="M115 135L125 145M125 135L115 145" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    'no-students': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="70" cy="55" r="20" fill="#E5E7EB" />
            <path d="M50 95C50 82 58 75 70 75C82 75 90 82 90 95V100H50V95Z" fill="#E5E7EB" />
            <circle cx="130" cy="55" r="20" fill="#D1D5DB" />
            <path d="M110 95C110 82 118 75 130 75C142 75 150 82 150 95V100H110V95Z" fill="#D1D5DB" />
            <rect x="60" y="115" width="80" height="8" rx="4" fill="#E5E7EB" />
            <rect x="75" y="130" width="50" height="6" rx="3" fill="#D1D5DB" />
            <circle cx="100" cy="85" r="25" fill="#6366F1" fillOpacity="0.15" />
            <path d="M90 85H110M100 75V95" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
        </svg>
    ),
    'no-data': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="30" y="40" width="140" height="90" rx="10" fill="#E5E7EB" />
            <rect x="45" y="55" width="50" height="8" rx="4" fill="#D1D5DB" />
            <rect x="45" y="70" width="110" height="6" rx="3" fill="#D1D5DB" />
            <rect x="45" y="85" width="90" height="6" rx="3" fill="#D1D5DB" />
            <rect x="45" y="100" width="70" height="6" rx="3" fill="#D1D5DB" />
            <circle cx="155" cy="45" r="20" fill="#6366F1" fillOpacity="0.2" />
            <path d="M148 45L155 52L165 40" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    ),
    'no-results': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="85" cy="70" r="35" stroke="#D1D5DB" strokeWidth="8" fill="none" />
            <path d="M110 95L140 125" stroke="#D1D5DB" strokeWidth="8" strokeLinecap="round" />
            <path d="M70 60L100 60" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
            <path d="M70 75L90 75" stroke="#E5E7EB" strokeWidth="4" strokeLinecap="round" />
            <circle cx="145" cy="50" r="15" fill="#6366F1" fillOpacity="0.2" />
            <path d="M140 50H150M145 45V55" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        </svg>
    ),
    'no-clearance': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="50" y="30" width="100" height="110" rx="8" fill="#E5E7EB" />
            <rect x="60" y="45" width="80" height="8" rx="4" fill="#D1D5DB" />
            <rect x="60" y="60" width="60" height="6" rx="3" fill="#D1D5DB" />
            <circle cx="100" cy="95" r="25" fill="#F3F4F6" />
            <path d="M100 80V100M100 108V110" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
            <rect x="75" y="125" width="50" height="8" rx="4" fill="#6366F1" fillOpacity="0.3" />
        </svg>
    ),
    'error': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="80" r="50" fill="#FEE2E2" />
            <circle cx="100" cy="80" r="35" fill="#FECACA" />
            <path d="M85 65L115 95M115 65L85 95" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
            <rect x="60" y="135" width="80" height="6" rx="3" fill="#FCA5A5" />
        </svg>
    ),
    'success': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="80" r="50" fill="#D1FAE5" />
            <circle cx="100" cy="80" r="35" fill="#A7F3D0" />
            <path d="M80 80L95 95L120 65" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="60" y="135" width="80" height="6" rx="3" fill="#6EE7B7" />
        </svg>
    ),
    'pending': ({ className }) => (
        <svg className={className} viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="80" r="50" fill="#FEF3C7" />
            <circle cx="100" cy="80" r="35" fill="#FDE68A" />
            <circle cx="100" cy="80" r="20" fill="#FEF3C7" />
            <path d="M100 65V80L110 90" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="60" y="135" width="80" height="6" rx="3" fill="#FCD34D" />
        </svg>
    ),
};

/**
 * EmptyState Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
    type,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className = '',
    size = 'md',
}) => {
    const Illustration = illustrations[type];

    const sizeClasses = {
        sm: {
            container: 'py-8 px-4',
            illustration: 'w-24 h-20',
            title: 'text-lg',
            description: 'text-sm',
            button: 'px-4 py-2 text-sm'
        },
        md: {
            container: 'py-12 px-6',
            illustration: 'w-40 h-32',
            title: 'text-xl',
            description: 'text-base',
            button: 'px-6 py-3 text-base'
        },
        lg: {
            container: 'py-16 px-8',
            illustration: 'w-52 h-40',
            title: 'text-2xl',
            description: 'text-lg',
            button: 'px-8 py-4 text-lg'
        }
    };

    const sizes = sizeClasses[size];

    const ActionButton = () => {
        if (!actionLabel) return null;

        const buttonClasses = `
            ${sizes.button}
            bg-indigo-600 text-white font-medium rounded-2xl
            hover:bg-indigo-700 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        `.trim();

        if (actionHref) {
            return (
                <a href={actionHref} className={buttonClasses}>
                    {actionLabel}
                </a>
            );
        }

        if (onAction) {
            return (
                <button onClick={onAction} className={buttonClasses}>
                    {actionLabel}
                </button>
            );
        }

        return null;
    };

    return (
        <div className={`flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}>
            <Illustration className={`${sizes.illustration} mb-6`} />
            <h3 className={`${sizes.title} font-semibold text-gray-900 mb-2`}>
                {title}
            </h3>
            <p className={`${sizes.description} text-gray-500 max-w-md mb-6`}>
                {description}
            </p>
            <ActionButton />
        </div>
    );
};

/**
 * Pre-configured Empty States for common scenarios
 */

export const NoRequestsState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
    <EmptyState
        type="no-requests"
        title="No Clearance Requests"
        description="You haven't submitted any clearance requests yet. Start your clearance process to graduate."
        actionLabel="Submit Request"
        onAction={onAction}
    />
);

export const NoNotificationsState: React.FC = () => (
    <EmptyState
        type="no-notifications"
        title="All Caught Up!"
        description="You have no new notifications. We'll let you know when something important happens."
        size="sm"
    />
);

export const NoStudentsState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
    <EmptyState
        type="no-students"
        title="No Students Found"
        description="No students match your search criteria. Try adjusting your filters or add new students."
        actionLabel="Add Student"
        onAction={onAction}
    />
);

export const NoResultsState: React.FC<{ searchTerm?: string }> = ({ searchTerm }) => (
    <EmptyState
        type="no-results"
        title="No Results Found"
        description={searchTerm 
            ? `We couldn't find anything matching "${searchTerm}". Try different keywords.`
            : "No results match your search. Try different keywords or filters."
        }
        size="sm"
    />
);

export const ErrorState: React.FC<{ 
    message?: string;
    onRetry?: () => void;
}> = ({ message, onRetry }) => (
    <EmptyState
        type="error"
        title="Something Went Wrong"
        description={message || "An error occurred while loading the data. Please try again."}
        actionLabel="Try Again"
        onAction={onRetry}
    />
);

export const NoClearanceState: React.FC<{ onAction?: () => void }> = ({ onAction }) => (
    <EmptyState
        type="no-clearance"
        title="No Active Clearance"
        description="You don't have an active clearance request. Submit one to start your clearance process."
        actionLabel="Request Clearance"
        onAction={onAction}
    />
);

export const PendingState: React.FC<{ title?: string; description?: string }> = ({ 
    title = "Processing...",
    description = "Your request is being processed. Please wait."
}) => (
    <EmptyState
        type="pending"
        title={title}
        description={description}
        size="sm"
    />
);

export const SuccessState: React.FC<{ 
    title?: string; 
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}> = ({ 
    title = "Success!",
    description = "Your action was completed successfully.",
    actionLabel,
    onAction
}) => (
    <EmptyState
        type="success"
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={onAction}
    />
);

export default EmptyState;
