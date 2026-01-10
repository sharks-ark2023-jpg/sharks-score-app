
import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'h-12 w-12' }) => {
    return (
        <div className={`animate-spin rounded-full ${size} border-t-2 border-b-2 border-highlight`}></div>
    );
};

export default LoadingSpinner;
