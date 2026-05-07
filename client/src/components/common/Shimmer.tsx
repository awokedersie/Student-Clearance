import React from 'react';

/**
 * Shimmer Effect Component
 * 
 * Provides a flowing shimmer animation effect for loading states.
 * More visually appealing than static pulse animations.
 */

interface ShimmerProps {
    className?: string;
    /** Width of the shimmer element */
    width?: string | number;
    /** Height of the shimmer element */
    height?: string | number;
    /** Border radius style */
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
    /** Whether to use a circle shape */
    circle?: boolean;
    /** Custom inline styles */
    style?: React.CSSProperties;
}

/**
 * Base Shimmer block with flowing gradient animation
 */
export const Shimmer: React.FC<ShimmerProps> = ({
    className = '',
    width,
    height,
    rounded = 'xl',
    circle = false,
    style = {}
}) => {
    const roundedClasses = {
        'none': '',
        'sm': 'rounded-sm',
        'md': 'rounded-md',
        'lg': 'rounded-lg',
        'xl': 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
        'full': 'rounded-full'
    };

    const baseStyles: React.CSSProperties = {
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
    };

    return (
        <div
            className={`
                relative overflow-hidden bg-gray-200
                ${circle ? 'rounded-full' : roundedClasses[rounded]}
                ${className}
            `.trim()}
            style={baseStyles}
        >
            <div
                className="absolute inset-0 -translate-x-full animate-shimmer"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                }}
            />
        </div>
    );
};

/**
 * Shimmer text line - simulates a line of text
 */
export const ShimmerLine: React.FC<{
    width?: string;
    height?: string;
    className?: string;
}> = ({ width = '100%', height = '1rem', className = '' }) => (
    <Shimmer
        className={className}
        width={width}
        height={height}
        rounded="md"
    />
);

/**
 * Shimmer avatar - circular shimmer for profile pictures
 */
export const ShimmerAvatar: React.FC<{
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}> = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-14 w-14',
        xl: 'h-20 w-20'
    };

    return <Shimmer className={`${sizes[size]} ${className}`} circle />;
};

/**
 * Shimmer button - simulates a button shape
 */
export const ShimmerButton: React.FC<{
    width?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}> = ({ width, size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12'
    };

    return (
        <Shimmer
            className={`${sizes[size]} ${className}`}
            width={width || '6rem'}
            rounded="2xl"
        />
    );
};

/**
 * Shimmer card - simulates a card container
 */
export const ShimmerCard: React.FC<{
    className?: string;
    children?: React.ReactNode;
}> = ({ className = '', children }) => (
    <div className={`bg-white rounded-3xl border border-gray-100 p-6 space-y-4 ${className}`}>
        {children || (
            <>
                <Shimmer className="h-6 w-1/3" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-2/3" />
            </>
        )}
    </div>
);

/**
 * Shimmer paragraph - multiple lines of text
 */
export const ShimmerParagraph: React.FC<{
    lines?: number;
    className?: string;
}> = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {[...Array(lines)].map((_, i) => (
            <Shimmer
                key={i}
                className="h-3"
                width={i === lines - 1 ? '60%' : '100%'}
                rounded="md"
            />
        ))}
    </div>
);

/**
 * Shimmer table row - simulates a table row
 */
export const ShimmerTableRow: React.FC<{
    columns?: number;
    className?: string;
}> = ({ columns = 5, className = '' }) => (
    <div className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 ${className}`}>
        {[...Array(columns)].map((_, i) => (
            <Shimmer key={i} className="h-4 flex-1" rounded="md" />
        ))}
    </div>
);

/**
 * Shimmer badge - simulates a status badge
 */
export const ShimmerBadge: React.FC<{
    className?: string;
}> = ({ className = '' }) => (
    <Shimmer className={`h-6 w-20 ${className}`} rounded="full" />
);

/**
 * Shimmer icon - simulates an icon placeholder
 */
export const ShimmerIcon: React.FC<{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}> = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'h-5 w-5',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return <Shimmer className={`${sizes[size]} ${className}`} rounded="lg" />;
};

/**
 * Shimmer input - simulates a form input field
 */
export const ShimmerInput: React.FC<{
    label?: boolean;
    className?: string;
}> = ({ label = true, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {label && <Shimmer className="h-3 w-24" rounded="md" />}
        <Shimmer className="h-12 w-full" rounded="2xl" />
    </div>
);

/**
 * Shimmer stat card - simulates a statistics card
 */
export const ShimmerStatCard: React.FC<{
    className?: string;
}> = ({ className = '' }) => (
    <div className={`bg-white rounded-3xl border border-gray-100 p-6 space-y-3 ${className}`}>
        <ShimmerIcon size="md" />
        <Shimmer className="h-3 w-1/2" rounded="md" />
        <Shimmer className="h-8 w-1/3" rounded="md" />
        <Shimmer className="h-2 w-1/4" rounded="md" />
    </div>
);

/**
 * Progress shimmer - animated progress indicator
 */
export const ShimmerProgress: React.FC<{
    className?: string;
}> = ({ className = '' }) => (
    <div className={`relative h-2 w-full bg-gray-200 rounded-full overflow-hidden ${className}`}>
        <div
            className="absolute inset-y-0 left-0 w-1/3 bg-indigo-400/50 rounded-full animate-progress-shimmer"
        />
    </div>
);

export default Shimmer;
