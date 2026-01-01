import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/home';
import CodeSession from './components/codesession';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:sessionId" element={<CodeSession />} />
      </Routes>
    </Router>
  );
}

export default App;