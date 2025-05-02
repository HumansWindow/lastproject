'use client';

import { dynamicClientOnly } from '../utils/clientOnly';

// Import AdminLayout dynamically with client-side only rendering
const ClientAdminLayout = dynamicClientOnly(
  () => import('../components/dashboard/AdminLayout')
);

export default function Home() {
  return (
    <ClientAdminLayout />
  );
}
