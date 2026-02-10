import React from 'react';

const Loading: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-md">
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>

                {/* Inner Static Text or Pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter animate-pulse">DBU</span>
                </div>

                {/* Decorative Pulsing Background */}
                <div className="absolute -inset-4 bg-indigo-500/5 rounded-full animate-ping opacity-20 -z-10"></div>
            </div>
        </div>
    );
};

export default Loading;
