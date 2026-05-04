import './App.css';
import Page from './app/dashboard/page';
import { Login } from './features/auth/login';
import SecureOpsDashboard from './features/dashboards/userdash';
import { Signup } from './features/auth/signup';

import { HomePage } from './pages/home';
import { BrowserRouter as Router, Routes, Route, useLocation, } from "react-router-dom";

function App() {
  

  return (
    <>
    <Router>
  
            <Routes>
              <Route path='/' element={<HomePage/>}/>
              <Route path='/dashboard' element={<Page />}/>
              <Route path='/login' element={<Login />}/>
              <Route path='/user-dashboard' element={<SecureOpsDashboard />} />
              <Route path='*' element={<HomePage/>}/>
              <Route path='/signup' element={<Signup />}/>
            </Routes>
    </Router>
    
    
    </>
  )
}

export default App
