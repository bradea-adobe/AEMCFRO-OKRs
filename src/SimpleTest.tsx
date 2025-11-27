// Simple test component to verify React is rendering
import React from 'react';

export const SimpleTest: React.FC = () => {
  console.log('🎨 SimpleTest component rendering');
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <h1 style={{ fontSize: '32px', color: '#1f2937', marginBottom: '20px' }}>
          ✅ React is Working!
        </h1>
        <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
          If you can see this, React is rendering successfully.
        </p>
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>
          Check the browser console (F12) for more details.
        </p>
      </div>
    </div>
  );
};

