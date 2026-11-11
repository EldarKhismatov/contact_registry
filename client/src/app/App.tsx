import { Navigate, Route, Routes } from 'react-router-dom';

import { ContactsPage } from '@/features/contacts/ContactsPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<ContactsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
