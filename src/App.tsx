import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppWithAuth from './components/AppWithAuth';

function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

export default App;
