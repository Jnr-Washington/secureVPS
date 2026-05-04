import './App.css';
import Page from './app/dashboard/page';
import { Login } from './features/auth/login';
import SecureOpsDashboard from './features/dashboards/userdash';
import { Signup } from './features/auth/signup';
import { HomePage } from './pages/home';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path='/dashboard' element={
            <ProtectedRoute><Page /></ProtectedRoute>
          } />
          <Route path='/user-dashboard' element={
            <ProtectedRoute><SecureOpsDashboard /></ProtectedRoute>
          } />
          <Route path='*' element={<HomePage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
