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
  const spread = exercisePrice - strikePrice;
  const gain = salePrice - exercisePrice;
  const sprain = salePrice - strikePrice;
  
  // Process different formula types
  let result = 0;
  
  if (formula === 'income tax * sprain') {
    result = incomeTaxRate * sprain;
  } else if (formula === '(1 - income tax) * sprain') {
    result = (1 - incomeTaxRate) * sprain;
  } else if (formula === 'sale price') {
    result = salePrice;
  } else if (formula === '- strike price - income tax * sprain') {
    result = -strikePrice - incomeTaxRate * sprain;
  } else if (formula === 'exercise price') {
    result = exercisePrice;
  } else if (formula === 'ltcg tax * sprain') {
    result = ltcgRate * sprain;
  } else if (formula === '(1 - ltcg) * sprain') {
    result = (1 - ltcgRate) * sprain;
  } else if (formula === 'amt * spread') {
    // Assume AMT is some percentage (using income tax for simplicity)
    result = incomeTaxRate * spread;
  } else if (formula === '- strike price') {
    result = -strikePrice;
  } else if (formula === 'income tax * spread + ltcg * gain') {
    result = incomeTaxRate * spread + ltcgRate * gain;
  } else if (formula === '(1 - income tax) * spread + (1 - ltcg) * gain') {
    result = (1 - incomeTaxRate) * spread + (1 - ltcgRate) * gain;
  } else if (formula === 'income tax * spread') {
    result = incomeTaxRate * spread;
  } else if (formula === '- strike price - income tax * spread') {
    result = -strikePrice - incomeTaxRate * spread;
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
  const spread = exercisePrice - strikePrice;
  const gain = salePrice - exercisePrice;
  const sprain = salePrice - strikePrice;
  
  // Handle special cases based on the specific formula text
  if (formula === 'sale price') {
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
  } else if (formula === '- strike price - income tax * sprain') {
    // The formula is "sale price - strike price - income tax * sprain"
    // But written as "- strike price - income tax * sprain" with sale price implied
    const value = salePrice - strikePrice - incomeTaxRate * sprain;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(multiplyByNumShares(value))}</div>
    `;
  } else if (formula === '- strike price - income tax * spread') {
    // The formula is "sale price - strike price - income tax * spread"
    // But written as "- strike price - income tax * spread" with sale price implied
    const value = salePrice - strikePrice - incomeTaxRate * spread;
    
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
  // Get all formula cells
  const cells = document.querySelectorAll('.grid-cell');
  const rowSize = 8; // 8 columns per row
  
  // Update all cells that have formulas
  cells.forEach((cell, index) => {
    const row = Math.floor(index / rowSize);
    const col = index % rowSize;
    
    // Only update columns 4-8 (indices 3-7) which contain formulas
    if (col >= 3) {
      const formula = cell.getAttribute('data-formula');
      if (formula) {
        cell.innerHTML = createTableCell(formula);
      }
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
  const spread = exercisePrice - strikePrice;
  const gain = salePrice - exercisePrice;
  const sprain = salePrice - strikePrice;
  
  // Apply number of shares
  const spreadWithShares = multiplyByNumShares(spread);
  const gainWithShares = multiplyByNumShares(gain);
  const sprainWithShares = multiplyByNumShares(sprain);
  
  // Create results HTML - simplified to one line with definitions
  let resultsHTML = `
    <div style="display: flex; gap: 30px; flex-wrap: wrap;">
      <div>
        <div style="font-weight: 500;">spread: ${formatCurrency(spreadWithShares)}</div>
        <div class="description">
          exercise price - strike price
        </div>
      </div>
      <div>
        <div style="font-weight: 500;">gain: ${formatCurrency(gainWithShares)}</div>
        <div class="description">
          sale price - exercise price
        </div>
      </div>
      <div>
        <div style="font-weight: 500;">sprain: ${formatCurrency(sprainWithShares)}</div>
        <div class="description">
          sale price - strike price<br>
          (or spread + gain)
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
  // Get all formula cells - these are all grid cells after the header row
  const cells = document.querySelectorAll('.grid-cell');
  const rowSize = 8; // 8 columns per row
  
  // Process all cells using their row and column position
  cells.forEach((cell, index) => {
    const row = Math.floor(index / rowSize);
    const col = index % rowSize;
    
    // Only process columns 4-8 (indices 3-7) which have formulas
    if (col >= 3) {
      // Store original formula text as a data attribute
      const formula = cell.textContent.trim();
      if (formula) {
        cell.setAttribute('data-formula', formula);
      } else {
        // For empty cells, set formula to empty string
        cell.setAttribute('data-formula', '');
      }
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