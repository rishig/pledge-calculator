import React, { useState } from 'react';

interface InputValue {
  value: number;
}

function App() {
  const [num1, setNum1] = useState<InputValue>({ value: 0 });
  const [num2, setNum2] = useState<InputValue>({ value: 0 });
  const [num3, setNum3] = useState<InputValue>({ value: 0 });

  const handleChange = (setter: React.Dispatch<React.SetStateAction<InputValue>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
      setter({ value: isNaN(value) ? 0 : value });
    };

  const sum = num1.value + num2.value + num3.value;

  return (
    <div className="App" style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h1>Calculator</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Input 1:</label>
          <input 
            type="number" 
            value={num1.value === 0 ? '' : num1.value} 
            onChange={handleChange(setNum1)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Input 2:</label>
          <input 
            type="number" 
            value={num2.value === 0 ? '' : num2.value} 
            onChange={handleChange(setNum2)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Input 3:</label>
          <input 
            type="number" 
            value={num3.value === 0 ? '' : num3.value} 
            onChange={handleChange(setNum3)}
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
      </div>
      
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '5px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Sum</h2>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{sum}</div>
      </div>
    </div>
  );
}

export default App;