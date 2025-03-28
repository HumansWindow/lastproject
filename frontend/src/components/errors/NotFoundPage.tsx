import * as React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="error-container">
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="button">Return to Home</Link>
    </div>
  );
};

export default NotFoundPage;
