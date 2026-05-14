import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/Auth';
import Messenger from './components/Messenger';

export default function App() {
  const isAuthenticated = !!localStorage.getItem('userId');

  return (
    <BrowserRouter>
      <div className="h-screen bg-tg-background font-sans">
        <Routes>
          <Route 
            path="/login" 
            element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} 
          />
          <Route 
            path="/" 
            element={isAuthenticated ? <Messenger /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}