import React from 'react';

const BackgroundGrid = () => {
  return (
    <div className="background-grid">
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-0 left-0"
      >
        <defs>
          <pattern
            id="smallGrid"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 10 0 L 0 0 0 10"
              fill="none"
              stroke="rgba(99, 187, 51, 0.05)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <rect width="50" height="50" fill="url(#smallGrid)" />
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="rgba(99, 187, 51, 0.1)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
};

export default BackgroundGrid;