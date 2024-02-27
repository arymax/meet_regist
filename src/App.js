import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './HomePage';
import AdminPage from './AdminPage';
import MeetingDetails from './MeetingDetails';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={
            <div className="main-content">
              <h1>歡迎來到會議管理系統</h1>
              <Link to="/admin" className="link-button">會議管理</Link>
            </div>
          } />
          {/* 使用路由參數 :code 來捕獲會議室代碼 */}
          <Route path="/checkin/:code" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/meeting-details/:meetingCode" element={<MeetingDetails />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;