import React from 'react';
import Navbar from './components/Navbar';
import IssueForm from './components/IssueForm';

function App() {
  return (
    <div>
      <Navbar />
      <div style={{ textAlign: 'center' }}>
        <h1>Certificate Issuance Portal</h1>
        <IssueForm />
      </div>
    </div>
  );
}

export default App
