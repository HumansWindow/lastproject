import * as React from 'react';

const ServerErrorPage: React.FC = () => {
  return (
    <div className="error-container">
      <h1>Server Error</h1>
      <p>Sorry, something went wrong on our end. Please try again later.</p>
      <button onClick={() => window.location.href = '/'}>
        Return to Home
      </button>
    </div>
  );
};

export default ServerErrorPage;
