import * as React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import RateLimitPage from '../components/errors/RateLimitPage';
import ServerErrorPage from '../components/errors/ServerErrorPage';
import NotFoundPage from '../components/errors/NotFoundPage';

const ErrorRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/error/rate-limit" element={<RateLimitPage />} />
      <Route path="/error/server" element={<ServerErrorPage />} />
      <Route path="/error/not-found" element={<NotFoundPage />} />
      <Route path="/error/*" element={<Navigate to="/error/not-found" replace />} />
    </Routes>
  );
};

export default ErrorRouter;
