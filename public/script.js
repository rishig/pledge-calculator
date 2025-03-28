// Get DOM elements
const input1 = document.getElementById('input1');
const input2 = document.getElementById('input2');
const input3 = document.getElementById('input3');
const sumElement = document.getElementById('sum');

// Function to calculate sum
function calculateSum() {
  const value1 = input1.value === '' ? 0 : parseFloat(input1.value);
  const value2 = input2.value === '' ? 0 : parseFloat(input2.value);
  const value3 = input3.value === '' ? 0 : parseFloat(input3.value);
  
  const sum = value1 + value2 + value3;
  sumElement.textContent = sum;
}

// Add event listeners
input1.addEventListener('input', calculateSum);
input2.addEventListener('input', calculateSum);
input3.addEventListener('input', calculateSum);
