// Get DOM elements
const incomeTaxRateInput = document.getElementById('incomeTaxRate');
const ltcgRateInput = document.getElementById('ltcgRate');
const strikePriceInput = document.getElementById('strikePrice');
const exercisePriceInput = document.getElementById('exercisePrice');
const salePriceInput = document.getElementById('salePrice');
const resultsElement = document.getElementById('results');

// Function to parse input as a number
function parseInputAsNumber(input) {
  const value = input.value.trim();
  return value === '' ? 0 : parseFloat(value);
}

// Function to format currency
function formatCurrency(amount) {
  return '$' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Function to calculate taxes and display results
function calculateTaxes() {
  // Get input values
  const incomeTaxRate = parseInputAsNumber(incomeTaxRateInput) / 100;
  const ltcgRate = parseInputAsNumber(ltcgRateInput) / 100;
  const strikePrice = parseInputAsNumber(strikePriceInput);
  const exercisePrice = parseInputAsNumber(exercisePriceInput);
  const salePrice = parseInputAsNumber(salePriceInput);
  
  // Calculate basic values
  const Spread = exercisePrice - strikePrice;
  const Gain = salePrice - exercisePrice;
  const Sprain = salePrice - strikePrice;
  
  // Create results HTML - simplified to one line with definitions
  let resultsHTML = `
    <div style="display: flex; gap: 30px; flex-wrap: wrap;">
      <div>
        <div style="font-weight: 500;">Spread: ${formatCurrency(Spread)}</div>
        <div class="description">Exercise price - Strike price</div>
      </div>
      <div>
        <div style="font-weight: 500;">Gain: ${formatCurrency(Gain)}</div>
        <div class="description">Sale price - Exercise price</div>
      </div>
      <div>
        <div style="font-weight: 500;">Sprain: ${formatCurrency(Sprain)}</div>
        <div class="description">Sale price - Strike price</div>
      </div>
    </div>
  `;
  
  // Update results
  resultsElement.innerHTML = resultsHTML;
}

// Add event listeners
incomeTaxRateInput.addEventListener('input', calculateTaxes);
ltcgRateInput.addEventListener('input', calculateTaxes);
strikePriceInput.addEventListener('input', calculateTaxes);
exercisePriceInput.addEventListener('input', calculateTaxes);
salePriceInput.addEventListener('input', calculateTaxes);

// Calculate on page load
calculateTaxes();