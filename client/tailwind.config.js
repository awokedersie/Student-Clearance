/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                // Shimmer effect - flowing gradient animation
                'shimmer': 'shimmer 1.5s infinite',
                // Progress shimmer - sliding progress indicator
                'progress-shimmer': 'progress-shimmer 1.5s ease-in-out infinite',
                // Shake animation for form validation errors
                'shake': 'shake 0.5s ease-in-out',
                // Fade in animation
                'fade-in': 'fadeIn 0.3s ease-out',
                // Slide up animation
                'slide-up': 'slideUp 0.3s ease-out',
                // Scale in animation
                'scale-in': 'scaleIn 0.2s ease-out',
                // Bounce in animation
                'bounce-in': 'bounceIn 0.4s ease-out',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'progress-shimmer': {
                    '0%': { transform: 'translateX(-100%)' },
                    '50%': { transform: 'translateX(200%)' },
                    '100%': { transform: 'translateX(-100%)' },
                },
                shake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
                    '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                bounceIn: {
                    '0%': { opacity: '0', transform: 'scale(0.3)' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
        },
    },
    plugins: [],
}
