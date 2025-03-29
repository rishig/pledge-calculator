// Get DOM elements
const incomeTaxRateInput = document.getElementById('incomeTaxRate');
const ltcgRateInput = document.getElementById('ltcgRate');
const strikePriceInput = document.getElementById('strikePrice');
const exercisePriceInput = document.getElementById('exercisePrice');
const salePriceInput = document.getElementById('salePrice');
const numSharesInput = document.getElementById('numShares');
const resultsElement = document.getElementById('results');

// Function to parse input as a number
function parseInputAsNumber(input) {
  const value = input.value.trim();
  return value === '' ? 0 : parseFloat(value);
}

// Function to multiply by number of shares and round appropriately
function multiplyByNumShares(amount) {
  const numShares = parseInputAsNumber(numSharesInput);
  const result = amount * numShares;
  
  if (numShares > 1) {
    // Round to nearest dollar if more than 1 share
    return Math.round(result);
  } else {
    // Round to nearest cent if just 1 share
    return Math.round(result * 100) / 100;
  }
}

// Function to format currency
function formatCurrency(amount) {
  // Convert to fixed 2 decimals and format with commas
  const formatted = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  // Remove .00 if present
  return '$' + formatted.replace(/\.00$/, '');
}

// Calculate the value for a formula given in the table
function calculateFormulaValue(formula) {
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
  
  // Process different formula types
  let result = 0;
  
  if (formula === 'Income tax * Sprain') {
    result = incomeTaxRate * Sprain;
  } else if (formula === '(1 - income tax) * Sprain') {
    result = (1 - incomeTaxRate) * Sprain;
  } else if (formula === 'Sale price') {
    result = salePrice;
  } else if (formula === '- strike price - income tax * Sprain') {
    result = -strikePrice - incomeTaxRate * Sprain;
  } else if (formula === 'Exercise price') {
    result = exercisePrice;
  } else if (formula === 'Ltcg tax * Sprain') {
    result = ltcgRate * Sprain;
  } else if (formula === '(1 - ltcg) * Sprain') {
    result = (1 - ltcgRate) * Sprain;
  } else if (formula === 'AMT * Spread') {
    // Assume AMT is some percentage (using income tax for simplicity)
    result = incomeTaxRate * Spread;
  } else if (formula === '- strike price') {
    result = -strikePrice;
  } else if (formula === 'Income tax * Spread + ltcg * Gain') {
    result = incomeTaxRate * Spread + ltcgRate * Gain;
  } else if (formula === '(1 - income tax) * Spread + (1 - ltcg) * Gain') {
    result = (1 - incomeTaxRate) * Spread + (1 - ltcgRate) * Gain;
  } else if (formula === 'Income tax * Spread') {
    result = incomeTaxRate * Spread;
  } else if (formula === '- strike price - income tax * Spread') {
    result = -strikePrice - incomeTaxRate * Spread;
  }
  
  return multiplyByNumShares(result);
}

// Create HTML for a table cell with both formula and calculated value
function createTableCell(formula) {
  if (!formula || formula.trim() === '') {
    return '';
  }
  
  // Get input values for calculations
  const incomeTaxRate = parseInputAsNumber(incomeTaxRateInput) / 100;
  const ltcgRate = parseInputAsNumber(ltcgRateInput) / 100;
  const strikePrice = parseInputAsNumber(strikePriceInput);
  const exercisePrice = parseInputAsNumber(exercisePriceInput);
  const salePrice = parseInputAsNumber(salePriceInput);
  
  // Calculate basic values
  const Spread = exercisePrice - strikePrice;
  const Gain = salePrice - exercisePrice;
  const Sprain = salePrice - strikePrice;
  
  // Handle special cases based on the specific formula text
  if (formula === 'Sale price') {
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(multiplyByNumShares(salePrice))}</div>
    `;
  } else if (formula === '0') {
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(0)}</div>
    `;
  } else if (formula === '- strike price') {
    // For row 6, charity gets "Sale price - strike price"
    // but the formula is shown as "- strike price"
    const value = salePrice - strikePrice;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(multiplyByNumShares(value))}</div>
    `;
  } else if (formula === '- strike price - income tax * Sprain') {
    // The formula is "Sale price - strike price - income tax * Sprain"
    // But written as "- strike price - income tax * Sprain" with Sale price implied
    const value = salePrice - strikePrice - incomeTaxRate * Sprain;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(multiplyByNumShares(value))}</div>
    `;
  } else if (formula === '- strike price - income tax * Spread') {
    // The formula is "Sale price - strike price - income tax * Spread"
    // But written as "- strike price - income tax * Spread" with Sale price implied
    const value = salePrice - strikePrice - incomeTaxRate * Spread;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(multiplyByNumShares(value))}</div>
    `;
  } else {
    // Standard formula
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(calculateFormulaValue(formula))}</div>
    `;
  }
}

// Update all table cells with calculated values
function updateTableCells() {
  // Get all grid cells (skip headers and first three columns)
  const cells = document.querySelectorAll('.grid-cell');
  
  cells.forEach((cell, index) => {
    // Skip the header row and the first three columns in each row
    if (index < 8 || index % 8 < 3) {
      return;
    }
    
    const formula = cell.getAttribute('data-formula');
    if (formula) {
      cell.innerHTML = createTableCell(formula);
    }
  });
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
  
  // Apply number of shares
  const spreadWithShares = multiplyByNumShares(Spread);
  const gainWithShares = multiplyByNumShares(Gain);
  const sprainWithShares = multiplyByNumShares(Sprain);
  
  // Create results HTML - simplified to one line with definitions
  let resultsHTML = `
    <div style="display: flex; gap: 30px; flex-wrap: wrap;">
      <div>
        <div style="font-weight: 500;">Spread: ${formatCurrency(spreadWithShares)}</div>
        <div class="description">
          Exercise price - Strike price
        </div>
      </div>
      <div>
        <div style="font-weight: 500;">Gain: ${formatCurrency(gainWithShares)}</div>
        <div class="description">
          Sale price - Exercise price
        </div>
      </div>
      <div>
        <div style="font-weight: 500;">Sprain: ${formatCurrency(sprainWithShares)}</div>
        <div class="description">
          Sale price - Strike price<br>
          (or Spread + Gain)
        </div>
      </div>
    </div>
  `;
  
  // Update results
  resultsElement.innerHTML = resultsHTML;
  
  // Update table cells
  updateTableCells();
}

// Initialize the table by storing formulas as data attributes
function initializeTable() {
  // Get all grid cells (skip headers and first three columns)
  const cells = document.querySelectorAll('.grid-cell');
  
  cells.forEach((cell, index) => {
    // Skip the header row and the first three columns in each row
    if (index < 8 || index % 8 < 3) {
      return;
    }
    
    // Store original formula text as a data attribute
    const formula = cell.textContent.trim();
    if (formula) {
      cell.setAttribute('data-formula', formula);
    } else {
      // For empty cells, set formula to empty string
      cell.setAttribute('data-formula', '');
    }
  });
  
  // Initial update of cells
  updateTableCells();
}

// Add event listeners
incomeTaxRateInput.addEventListener('input', calculateTaxes);
ltcgRateInput.addEventListener('input', calculateTaxes);
strikePriceInput.addEventListener('input', calculateTaxes);
exercisePriceInput.addEventListener('input', calculateTaxes);
salePriceInput.addEventListener('input', calculateTaxes);
if (numSharesInput) {
  numSharesInput.addEventListener('input', calculateTaxes);
}

// Initialize table and calculate on page load
window.addEventListener('DOMContentLoaded', function() {
  initializeTable();
  calculateTaxes();
});