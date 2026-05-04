import './App.css';
import Page from './app/dashboard/page';
import { Login } from './features/auth/login';
import SecureOpsDashboard from './features/dashboards/userdash';


import { HomePage } from './pages/home';
import { BrowserRouter as Router, Routes, Route, useLocation, } from "react-router-dom";

function App() {
  

  return (
    <>
    <Router>
  
<Routes>
  {/* This new line below tells the app what to show at http://localhost:5173/ */}
  <Route path="/" element={<HomePage />} /> 

  <Route path='/dashboard' element={<Page />}/>
  <Route path='/home' element={<HomePage/>}/>
  <Route path='/login' element={<Login />}/>
  <Route path='/user-dashboard' element={<SecureOpsDashboard />} />
</Routes>
    </Router>
    
    
    </>
  )
}

export default App
