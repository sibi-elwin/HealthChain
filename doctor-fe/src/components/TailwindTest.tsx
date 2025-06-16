import React from 'react';

const TailwindTest = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-soft p-6">
        <h1 className="text-3xl font-bold text-primary-900 mb-4">
          Tailwind CSS Test
        </h1>
        <p className="text-secondary-600 mb-4">
          If you can see this styled text and the gradient background, Tailwind CSS is working!
        </p>
        <div className="space-y-4">
          <button className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Primary Button
          </button>
          <button className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest; 