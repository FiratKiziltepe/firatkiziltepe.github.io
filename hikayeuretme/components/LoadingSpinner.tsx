
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-10 p-5 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg shadow-lg">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-pink-500"></div>
      <p className="text-white text-xl mt-4">Generating your magical story...</p>
    </div>
  );
};
