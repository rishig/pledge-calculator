// Get DOM elements
const incomeTaxRateInput = document.getElementById('incomeTaxRate');
const ltcgRateInput = document.getElementById('ltcgRate');
const strikePriceInput = document.getElementById('strikePrice');
const exercisePriceInput = document.getElementById('exercisePrice');
const salePriceInput = document.getElementById('salePrice');
const matchRadios = document.querySelectorAll('input[name="match"]');
const resultsElement = document.getElementById('results');
const priceWarningElement = document.getElementById('price-warning');
const totalToCharityElement = document.getElementById('total-to-charity');
const totalToYouElement = document.getElementById('total-to-you');

const rowCount = 8; // Number of rows in the table

// Function to parse input as a number
function parseInputAsNumber(input) {
  const value = input.value.trim();
  return value === '' ? 0 : parseFloat(value);
}

// Function to get the current match value
function getMatchMultiplier() {
  // Find the checked radio button
  const checkedRadio = Array.from(matchRadios).find(radio => radio.checked);
  
  if (!checkedRadio) return 0; // Default to 0 if none found
  
  if (checkedRadio.value === '1:1') {
    return 1; // 1:1 match
  } else if (checkedRadio.value === '3:1') {
    return 3; // 3:1 match
  } else {
    return 0; // No match
  }
}

// Function to format numbers appropriately (previously multiplyByNumShares)
function formatNumber(amount) {
  // Round to nearest cent
  return Math.round(amount * 100) / 100;
}

// Function to get row share count
function getRowShares(rowIndex) {
  // Safety check
  if (rowIndex < 1 || rowIndex > rowCount) {
    throw new Error(`Invalid row index: ${rowIndex}`);
  }
  
  let input = null;
  
  // Method 1: Get by direct ID
  input = document.querySelector(`#shares-row-${rowIndex}`);
  
  // Method 2: Try by data-row attribute if ID doesn't work
  if (!input) {
    input = document.querySelector(`input.shares-input[data-row="${rowIndex}"]`);
  }
  
  // Method 3: Try by position in document
  if (!input) {
    const allInputs = document.querySelectorAll('input.shares-input');
    
    // For row 1, we want input at index 0, and so on
    const inputIndex = rowIndex - 1;
    if (inputIndex >= 0 && inputIndex < allInputs.length) {
      input = allInputs[inputIndex];
    }
  }
  
  // Method 4: Try by grid cell index
  if (!input) {
    const columnCount = 8; // Number of columns in the table
    
    // Calculate expected indices for share inputs in the grid
    // Each row has columnCount cells, and the share input is in the last column (index 7)
    const cellIndices = Array.from({length: rowCount}, (_, i) => (i + 1) * columnCount + 7);
    const cellIndex = cellIndices[rowIndex - 1];
    
    if (cellIndex !== undefined) {
      const cells = document.querySelectorAll('.grid-cell');
      
      if (cellIndex < cells.length) {
        const cell = cells[cellIndex];
        input = cell.querySelector('input.shares-input');
      }
    }
  }
  
  // If still not found after all attempts
  if (!input) {
    throw new Error(`Shares input not found for row ${rowIndex}`);
  }
  
  // Get the value
  const value = parseFloat(input.value);
  if (isNaN(value)) {
    // Default to 0 if not a number - this will show a useful error in console but not break the app
    console.error(`Invalid share value for row ${rowIndex}: "${input.value}" is not a number`);
    return 0;
  }
  return value;
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
  } else if (formula === '(1 - income tax) * sprain * income tax') {
    result = (1 - incomeTaxRate) * sprain * incomeTaxRate;
  } else if (formula === '(1 - income tax) * sprain * (1 + match)') {
    result = (1 - incomeTaxRate) * sprain * (1 + getMatchMultiplier());
  } else if (formula === 'sale price') {
    result = salePrice;
  } else if (formula === 'sale price * income tax') {
    result = salePrice * incomeTaxRate;
  } else if (formula === 'sale price * (1 + match)') {
    result = salePrice * (1 + getMatchMultiplier());
  } else if (formula === '- strike price - income tax * sprain') {
    result = -strikePrice - incomeTaxRate * sprain;
  } else if (formula === 'exercise price') {
    result = exercisePrice;
  } else if (formula === 'exercise price * income tax') {
    result = exercisePrice * incomeTaxRate;
  } else if (formula === 'ltcg * sprain') {
    result = ltcgRate * sprain;
  } else if (formula === '(1 - ltcg) * sprain') {
    result = (1 - ltcgRate) * sprain;
  } else if (formula.startsWith('amt * spread')) {
    // Assume AMT is some percentage (using income tax for simplicity)
    result = 0.35 * spread;
  } else if (formula === '- strike price') {
    // Just the negative of the strike price
    result = -strikePrice;
  } else if (formula === 'income tax * spread + ltcg * gain') {
    result = incomeTaxRate * spread + ltcgRate * gain;
  } else if (formula === '(1 - income tax) * spread + (1 - ltcg) * gain') {
    result = (1 - incomeTaxRate) * spread + (1 - ltcgRate) * gain;
  } else if (formula === 'income tax * spread') {
    result = incomeTaxRate * spread;
  } else if (formula === '- strike price - income tax * spread') {
    // Negative of strike price minus income tax * spread
    result = -strikePrice - incomeTaxRate * spread;
  }
  
  return formatNumber(result);
}

// Create HTML for a table cell with both formula and calculated value
function createTableCell(formula, cell) {
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
  
  // No need for special match column handling as it's been removed
  
  // Handle special cases based on the specific formula text
  // Get the match multiplier for charity calculations
  const matchMultiplier = getMatchMultiplier();

  // Handle sale price with match multiplier  
  if (formula === 'sale price * (1 + match)') {
    const value = salePrice * (1 + matchMultiplier);
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(formatNumber(value))}</div>
    `;
  } else if (formula === 'sale price') {
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(formatNumber(salePrice))}</div>
    `;
  } else if (formula === '0') {
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(0)}</div>
    `;
  } else if (formula === '- strike price') {
    // This is just the negative of the strike price
    const value = -strikePrice;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(formatNumber(value))}</div>
    `;
  } else if (formula === '- strike price - income tax * sprain') {
    // This should be just the negative of strike price minus income tax * sprain
    const value = -strikePrice - incomeTaxRate * sprain;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(formatNumber(value))}</div>
    `;
  } else if (formula === '- strike price - income tax * spread') {
    // This should be just the negative of strike price minus income tax * spread
    const value = -strikePrice - incomeTaxRate * spread;
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(formatNumber(value))}</div>
    `;
  } else if (formula.startsWith('amt * spread')) {
    // Special case for AMT * spread - display in brackets
    const value = 0.35 * spread; // Using 0.35 as per the formula's definition
    
    return `
      <div class="formula">${formula}</div>
      <div class="value">[${formatCurrency(formatNumber(value))}]</div>
    `;
  } else {
    // Standard formula
    return `
      <div class="formula">${formula}</div>
      <div class="value">${formatCurrency(calculateFormulaValue(formula))}</div>
    `;
  }
}

// Calculate value for a specific cell (row, column) with shares
function calculateCellValue(row, col) {
  const columnCount = 8; // Number of columns in the table
  
  // Validate inputs
  if (row < 1 || row > rowCount || col < 0 || col > columnCount - 1) {
    throw new Error(`Invalid row or column: row ${row}, col ${col}`);
  }
  
  // Mapping of row/col to cell indices
  const rowOffset = (row - 1) * columnCount; 
  const cellIndex = rowOffset + col;
  
  // Find the cell
  const cells = document.querySelectorAll('.grid-cell');
  if (cellIndex >= cells.length) {
    throw new Error(`Cell index ${cellIndex} out of bounds (max: ${cells.length - 1})`);
  }
  
  const cell = cells[cellIndex];
  const formula = cell.getAttribute('data-formula');
  
  if (!formula) {
    throw new Error(`No formula found for cell at index ${cellIndex}`);
  }
  
  // Special case for amt * spread - don't include in totals
  if (formula.startsWith('amt * spread')) {
    return 0; // This is an intentional exclusion from totals, not a failure
  }
  
  // Get base value from formula
  const value = calculateFormulaValue(formula);
  
  // Get shares for this specific row
  const shares = getRowShares(row);
  
  // If no shares, return 0
  if (shares === 0) return 0;
  
  // Calculate final value
  return value * shares;
}

// Update all table cells with calculated values
function updateTableCells() {
  // Get all formula cells
  const cells = document.querySelectorAll('.grid-cell');
  const columnCount = 8; // Number of columns in the table
  
  // Update all cells that have formulas
  cells.forEach((cell, index) => {
    const row = Math.floor(index / columnCount);
    const col = index % columnCount;
    
    // Only update columns 4-7 (indices 3-6) which contain formulas
    // Skip column 8 (index 7) which contains input boxes
    if (col >= 3 && col < 7) {
      const formula = cell.getAttribute('data-formula');
      if (formula) {
        cell.innerHTML = createTableCell(formula, cell);
      }
    }
  });
  
  // Update totals
  updateTotals();
}

// Function to format total values (show blank for zero)
function formatTotalValue(value) {
  if (value === 0) return '';
  return `<div class="value">${formatCurrency(value)}</div>`;
}

// Update the totals row
function updateTotals() {
  // Calculate totals for columns 4-7 (indices 3-6)
  const totalGov = document.getElementById('total-gov');
  const totalCharity = document.getElementById('total-charity');
  const totalCash = document.getElementById('total-cash');
  const totalDeduction = document.getElementById('total-deduction');
  const totalShares = document.getElementById('total-shares');
  
  if (!totalGov || !totalCharity || !totalCash || !totalDeduction || !totalShares) {
    throw new Error('Required total elements not found in the DOM');
  }
  
  // Find number of rows (excluding header and totals rows)
  const numRows = rowCount; // Use rowCount constant
  
  // Initialize totals
  let govTotal = 0;
  let charityTotal = 0;
  let cashTotal = 0;
  let deductionTotal = 0;
  let sharesTotal = 0;
  
  // Sum up each column (multiply by shares)
  for (let row = 1; row <= numRows; row++) { // Start at 1 to include the first data row
    // Get shares for this row
    const shares = getRowShares(row);
    sharesTotal += shares;
    
    // Calculate values for each column
    const govValue = calculateCellValue(row, 3);
    const charityValue = calculateCellValue(row, 4);
    const cashValue = calculateCellValue(row, 5);
    const deductionValue = calculateCellValue(row, 6);
    
    // Add values
    govTotal += govValue;         // Government gets
    charityTotal += charityValue; // Charity gets
    cashTotal += cashValue;       // You get in cash
    deductionTotal += deductionValue; // You get via tax deduction
  }
  
  // Display the totals - blank if zero
  totalGov.innerHTML = formatTotalValue(govTotal);
  totalCharity.innerHTML = formatTotalValue(charityTotal);
  totalCash.innerHTML = formatTotalValue(cashTotal);
  
  // Add [3] to the tax deduction total if there's a value
  if (deductionTotal > 0) {
    totalDeduction.innerHTML = `<div class="value">${formatCurrency(deductionTotal)} <a href="#notes" style="color: inherit; text-decoration: none;">[3]</a></div>`;
  } else {
    totalDeduction.innerHTML = '';
  }
  
  // Total shares is always displayed, even if zero
  totalShares.innerHTML = sharesTotal > 0 ? 
    `<div class="shares-total-container"><div class="shares-total-value">${sharesTotal}</div></div>` : '';
    
  // Check if total charity element exists
  if (!totalToCharityElement || !totalToYouElement) {
    throw new Error('Summary total elements not found in the DOM');
  }
  
  // Calculate and display totals for charity and for the user
  // Total to charity is the charity column (rounded down to nearest dollar)
  const roundedCharityTotal = Math.floor(charityTotal);
  totalToCharityElement.textContent = roundedCharityTotal > 0 ? `$${roundedCharityTotal.toLocaleString()}` : '$0';
  
  // Total to you is the cash + tax deduction 
  const totalToYou = cashTotal + deductionTotal;
  
  // Display the total to you rounded down to the nearest dollar
  const roundedTotalToYou = Math.floor(totalToYou);
  totalToYouElement.textContent = roundedTotalToYou > 0 ? `$${roundedTotalToYou.toLocaleString()}` : '$0';
}

// Function to calculate taxes and display results
function calculateTaxes() {
  // Validate required elements exist
  if (!resultsElement || !priceWarningElement) {
    throw new Error('Required DOM elements not found');
  }
  
  // Get input values
  const incomeTaxRate = parseInputAsNumber(incomeTaxRateInput) / 100;
  const ltcgRate = parseInputAsNumber(ltcgRateInput) / 100;
  const strikePrice = parseInputAsNumber(strikePriceInput);
  const exercisePrice = parseInputAsNumber(exercisePriceInput);
  const salePrice = parseInputAsNumber(salePriceInput);
  
  // Validate inputs
  if (isNaN(incomeTaxRate) || isNaN(ltcgRate) || isNaN(strikePrice) || 
      isNaN(exercisePrice) || isNaN(salePrice)) {
    throw new Error('Invalid numeric inputs');
  }
  
  // Calculate basic values
  const spread = exercisePrice - strikePrice;
  const gain = salePrice - exercisePrice;
  const sprain = salePrice - strikePrice;
  
  // Create results HTML - simplified to one line with definitions
  let resultsHTML = `
    <div style="display: flex; gap: 30px; flex-wrap: wrap;">
      <div>
        <div style="font-weight: 500;">Spread: ${formatCurrency(spread)}</div>
        <div class="description">
          exercise price - strike price
        </div>
      </div>
      <div>
        <div style="font-weight: 500;">Gain: ${formatCurrency(gain)}</div>
        <div class="description">
          sale price - exercise price
        </div>
      </div>
      <div>
        <div style="font-weight: 500;">Sprain: ${formatCurrency(sprain)}</div>
        <div class="description">
          sale price - strike price<br>
          (or spread + gain)
        </div>
      </div>
    </div>
  `;
  
  // Add warning if sale price is less than exercise price
  if (salePrice < exercisePrice) {
    priceWarningElement.innerHTML = `
      <div style="margin-bottom: 15px; margin-top: 15px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404;">
        <strong>Warning:</strong> There are a number of material considerations when Sale Price &lt; Exercise Price that haven't been incorporated below; consider this unsupported.
      </div>
    `;
  } else {
    priceWarningElement.innerHTML = ''; // Clear warning if not applicable
  }
  
  // Update results
  resultsElement.innerHTML = resultsHTML;
  
  // Update table cells
  updateTableCells();
}

// Initialize the table by storing formulas as data attributes
function initializeTable() {
  // Get all formula cells - these are all grid cells after the header row
  const cells = document.querySelectorAll('.grid-cell');
  const columnCount = 8; // Number of columns in the table
  
  // Process all cells using their row and column position
  cells.forEach((cell, index) => {
    const row = Math.floor(index / columnCount);
    const col = index % columnCount;
    
    // Process columns 4-7 (indices 3-6) which have formulas
    if (col >= 3 && col < 7) {
      // Store original formula text as a data attribute
      const formula = cell.textContent.trim();
      if (formula) {
        cell.setAttribute('data-formula', formula);
      } else {
        // For empty cells, set formula to empty string
        cell.setAttribute('data-formula', '');
      }
    }
    
    // Process column 8 (index 7) for share inputs
    if (col === 7) {
      // Find the input element within this cell
      const input = cell.querySelector('input.shares-input');
      if (input) {
        // Calculate the data row
        // Header row is first columnCount cells (0-7)
        // First data row is cells 8-15, which is row 1
        const dataRow = Math.floor((index - columnCount) / columnCount) + 1;
        
        // Set a unique ID based on the row
        input.id = `shares-row-${dataRow}`;
        
        // Add event listener to handle input changes 
        input.addEventListener('input', function() {
          // Recalculate totals when shares change
          updateTotals();
        });
      }
    }
  });
  
  // Initial update of cells
  updateTableCells();
}

// Function to handle number input
function handleNumberInput(event) {
  calculateTaxes();
}

// Add event listeners
incomeTaxRateInput.addEventListener('input', handleNumberInput);
ltcgRateInput.addEventListener('input', handleNumberInput);
strikePriceInput.addEventListener('input', handleNumberInput);
exercisePriceInput.addEventListener('input', handleNumberInput);
salePriceInput.addEventListener('input', handleNumberInput);

// Add event listeners for match radio buttons
matchRadios.forEach(radio => {
  radio.addEventListener('change', calculateTaxes);
});

// Function to directly attach event listeners to all shares inputs
function attachSharesInputListeners() {
  // First, get all share inputs directly to ensure we find all of them
  const allInputs = document.querySelectorAll('input.shares-input');

  
  // Clear existing IDs and data attributes
  allInputs.forEach(input => {
    if (input.id) input.removeAttribute('id');
    if (input.hasAttribute('data-row')) input.removeAttribute('data-row');
  });
  
  // If we found the expected rowCount inputs, directly assign them in document order
  if (allInputs.length === rowCount) {
    // Process each input directly instead of through grid cells
    allInputs.forEach((input, index) => {
      const rowNum = index + 1; // 1-based row number
      
      // Set ID and data attribute
      input.id = `shares-row-${rowNum}`;
      input.setAttribute('data-row', rowNum.toString());
      
      // Clear existing listeners and add new one
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      // Add event listener
      newInput.addEventListener('input', function() {
        // Recalculate totals when shares change
        updateTotals();
      });
    });
  } 
}

// Initialize table and calculate on page load
window.addEventListener('DOMContentLoaded', function() {
  initializeTable();
  attachSharesInputListeners(); // Directly attach listeners
  calculateTaxes();
});