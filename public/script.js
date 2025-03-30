// Get DOM elements
const incomeTaxRateInput = document.getElementById('incomeTaxRate');
const ltcgRateInput = document.getElementById('ltcgRate');
const strikePriceInput = document.getElementById('strikePrice');
const exercisePriceInput = document.getElementById('exercisePrice');
const salePriceInput = document.getElementById('salePrice');
const matchRadios = document.querySelectorAll('input[name="match"]');
const resultsElement = document.getElementById('results');

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
  console.log(`Getting shares for row ${rowIndex}`);
  
  // Safety check
  if (rowIndex < 1 || rowIndex > 8) {
    console.log(`  Invalid row index: ${rowIndex}`);
    return 0;
  }
  
  let input = null;
  
  // Method 1: Get by direct ID
  input = document.querySelector(`#shares-row-${rowIndex}`);
  if (input) {
    console.log(`  Found input by ID for row ${rowIndex}`);
  }
  
  // Method 2: Try by data-row attribute if ID doesn't work
  if (!input) {
    console.log(`  No input found with ID shares-row-${rowIndex}, trying data-row attribute`);
    input = document.querySelector(`input.shares-input[data-row="${rowIndex}"]`);
    
    if (input) {
      console.log(`  Found input by data-row attribute for row ${rowIndex}`);
    }
  }
  
  // Method 3: Try by position in document
  if (!input) {
    console.log(`  No input found with ID or data-row, trying by document position`);
    const allInputs = document.querySelectorAll('input.shares-input');
    
    // For row 1, we want input at index 0, and so on
    const inputIndex = rowIndex - 1;
    if (inputIndex >= 0 && inputIndex < allInputs.length) {
      input = allInputs[inputIndex];
      console.log(`  Found input by position in document, input index ${inputIndex}`);
    }
  }
  
  // Method 4: Try by grid cell index
  if (!input) {
    console.log(`  No input found by previous methods, trying by grid cell index`);
    
    // These are the expected indices for share inputs in the grid:
    const cellIndices = [15, 23, 31, 39, 47, 55, 63, 71];
    const cellIndex = cellIndices[rowIndex - 1];
    
    if (cellIndex !== undefined) {
      const cells = document.querySelectorAll('.grid-cell');
      
      if (cellIndex < cells.length) {
        const cell = cells[cellIndex];
        input = cell.querySelector('input.shares-input');
        
        if (input) {
          console.log(`  Found input through grid cell lookup at index ${cellIndex}`);
        }
      }
    }
  }
  
  // If still not found after all attempts
  if (!input) {
    console.log(`  No input found for row ${rowIndex} after all methods`);
    return 0;
  }
  
  // Get the value
  const value = parseFloat(input.value);
  console.log(`  Share value for row ${rowIndex}: ${value}`);
  return isNaN(value) ? 0 : value;
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
  } else if (formula === 'amt * spread') {
    // Assume AMT is some percentage (using income tax for simplicity)
    result = incomeTaxRate * spread;
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
  console.log(`Calculating cell value for row=${row}, col=${col}`);
  
  // Validate inputs
  if (row < 1 || row > 8 || col < 0 || col > 7) {
    throw new Error(`Invalid row or column: row=${row}, col=${col}`);
  }
  
  // Hardcoded mapping of row/col to cell indices
  const rowOffset = (row - 1) * 8; 
  const cellIndex = rowOffset + col;
  
  console.log(`  Using hardcoded mapping: row=${row}, col=${col} → cellIndex=${cellIndex}`);
  
  // Find the cell
  const cells = document.querySelectorAll('.grid-cell');
  if (cellIndex >= cells.length) {
    console.log(`  Cell index ${cellIndex} out of bounds (${cells.length} cells total)`);
    return 0;
  }
  
  const cell = cells[cellIndex];
  const formula = cell.getAttribute('data-formula');
  
  if (!formula) {
    console.log(`  No formula found for cell at index ${cellIndex}`);
    return 0;
  }
  
  console.log(`  Formula: "${formula}"`);
  
  // Get base value from formula
  const value = calculateFormulaValue(formula);
  
  // Get shares for this specific row
  const shares = getRowShares(row);
  console.log(`  Row ${row} has ${shares} shares`);
  
  // If no shares, return 0
  if (shares === 0) return 0;
  
  // Calculate final value
  return value * shares;
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
  console.log("----------- UPDATING TOTALS -----------");
  
  // Calculate totals for columns 4-7 (indices 3-6)
  const totalGov = document.getElementById('total-gov');
  const totalCharity = document.getElementById('total-charity');
  const totalCash = document.getElementById('total-cash');
  const totalDeduction = document.getElementById('total-deduction');
  const totalShares = document.getElementById('total-shares');
  
  // Find number of rows (excluding header and totals rows)
  const numRows = 8; // We know there are 8 rows of data
  
  // Initialize totals
  let govTotal = 0;
  let charityTotal = 0;
  let cashTotal = 0;
  let deductionTotal = 0;
  let sharesTotal = 0;
  
  // Debug: log all share inputs to verify
  const allInputs = document.querySelectorAll('input.shares-input');
  console.log(`Found ${allInputs.length} share inputs total`);
  allInputs.forEach((input, i) => {
    console.log(`Input ${i+1}: id=${input.id}, value=${input.value}, dataRow=${input.getAttribute('data-row')}`);
  });
  
  // Sum up each column (multiply by shares)
  for (let row = 1; row <= numRows; row++) { // Start at 1 to include the first data row
    console.log(`\nProcessing row ${row}:`);
    
    // Get shares for this row
    const shares = getRowShares(row);
    console.log(`Row ${row}: Shares = ${shares}`);
    sharesTotal += shares;
    
    // Debug for each cell calculation
    const govValue = calculateCellValue(row, 3);
    const charityValue = calculateCellValue(row, 4);
    const cashValue = calculateCellValue(row, 5);
    const deductionValue = calculateCellValue(row, 6);
    
    console.log(`Row ${row} values: Gov = ${govValue}, Charity = ${charityValue}, Cash = ${cashValue}, Deduction = ${deductionValue}`);
    
    // Add values
    govTotal += govValue;         // Government gets
    charityTotal += charityValue; // Charity gets
    cashTotal += cashValue;       // You get in cash
    deductionTotal += deductionValue; // You get in tax deduction
  }
  
  console.log(`\nFinal totals: Gov = ${govTotal}, Charity = ${charityTotal}, Cash = ${cashTotal}, Deduction = ${deductionTotal}, Shares = ${sharesTotal}`);
  
  // Display the totals - blank if zero
  totalGov.innerHTML = formatTotalValue(govTotal);
  totalCharity.innerHTML = formatTotalValue(charityTotal);
  totalCash.innerHTML = formatTotalValue(cashTotal);
  totalDeduction.innerHTML = formatTotalValue(deductionTotal);
  
  // Total shares is always displayed, even if zero
  totalShares.innerHTML = sharesTotal > 0 ? 
    `<div class="shares-total-container"><div class="shares-total-value">${sharesTotal}</div></div>` : '';
    
  console.log("----------- TOTALS UPDATED -----------");
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
  console.log(`Total cells found: ${cells.length}`);
  
  cells.forEach((cell, index) => {
    const row = Math.floor(index / rowSize);
    const col = index % rowSize;
    
    // Debug first few rows
    if (index < 32) {
      console.log(`Cell ${index}: row=${row}, col=${col}, content="${cell.textContent.trim()}", hasInput=${!!cell.querySelector('input.shares-input')}`);
    }
    
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
        // Debug for share input detection
        console.log(`Found shares input at index ${index}, row=${row}, col=${col}`);
      
        // Calculate the data row - use a better formula
        // Header row is first 8 cells (0-7)
        // First data row is cells 8-15, which is row 1
        // If index is 15, that's the first row's share input
        // (index - 8) / 8 + 1
        const dataRow = Math.floor((index - 8) / 8) + 1;
        
        console.log(`  Calculated dataRow=${dataRow} for index=${index}`);
        
        // Set a unique ID based on the row
        input.id = `shares-row-${dataRow}`;
        console.log(`  Setting input ID for dataRow ${dataRow}:`, input);
        
        // Add event listener to handle input changes 
        input.addEventListener('input', function() {
          console.log(`Input changed for row ${dataRow}, value: ${this.value}`);
          // Remove leading zeros if value is not just "0"
          if (this.value !== "0" && this.value.startsWith("0")) {
            this.value = this.value.replace(/^0+/, '');
            console.log(`  Removed leading zeros, new value: ${this.value}`);
          }
          // Recalculate totals when shares change
          console.log(`  Calling updateTotals()`);
          updateTotals();
        });
      }
    }
  });
  
  // Initial update of cells
  updateTableCells();
}

// Function to handle number input with leading zero removal
function handleNumberInput(event) {
  // Remove leading zeros if value is not just "0"
  if (this.value !== "0" && this.value.startsWith("0")) {
    this.value = this.value.replace(/^0+/, '');
  }
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
  console.log('Attaching event listeners to all shares inputs');
  
  // First, get all share inputs directly to ensure we find all of them
  const allInputs = document.querySelectorAll('input.shares-input');
  console.log(`Found ${allInputs.length} share inputs total`);
  
  // Clear existing IDs and data attributes
  allInputs.forEach(input => {
    if (input.id) input.removeAttribute('id');
    if (input.hasAttribute('data-row')) input.removeAttribute('data-row');
  });

  // Initialize counter for each input
  let inputCounter = 1;
  
  // If we found the expected 8 inputs, directly assign them in document order
  if (allInputs.length === 8) {
    console.log('Processing inputs by direct index (found 8 inputs)');
    
    // Process each input directly instead of through grid cells
    allInputs.forEach((input, index) => {
      const rowNum = index + 1; // 1-based row number
      
      // Set ID and data attribute
      input.id = `shares-row-${rowNum}`;
      input.setAttribute('data-row', rowNum.toString());
      
      console.log(`Direct assignment: input ${index+1} → row ${rowNum}`);
      
      // Clear existing listeners and add new one
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      // Add event listener
      newInput.addEventListener('input', function() {
        console.log(`Input changed for row ${rowNum}, value: ${this.value}`);
        
        // Remove leading zeros if value is not just "0"
        if (this.value !== "0" && this.value.startsWith("0")) {
          this.value = this.value.replace(/^0+/, '');
        }
        
        // Recalculate totals when shares change
        updateTotals();
      });
    });
  } 
  // Fallback to cell-by-cell assignment if we don't have exactly 8 inputs
  else {
    console.log('Fallback: processing inputs by grid cell indices');
    
    // These are the expected indices for the 8 data rows
    const expectedCellIndices = [15, 23, 31, 39, 47, 55, 63, 71];
    
    // Get all grid cells
    const cells = document.querySelectorAll('.grid-cell');
    
    // Process each expected cell index
    expectedCellIndices.forEach((cellIndex, index) => {
      // Calculate row number (1-based)
      const rowNum = index + 1;
      
      if (cellIndex >= cells.length) {
        console.error(`Cell index ${cellIndex} out of bounds`);
        return;
      }
      
      const cell = cells[cellIndex];
      const input = cell.querySelector('input.shares-input');
      
      if (!input) {
        console.error(`No input found at cell index ${cellIndex}`);
        return;
      }
      
      // Set ID and data attribute
      input.id = `shares-row-${rowNum}`;
      input.setAttribute('data-row', rowNum.toString());
      
      console.log(`Cell index assignment: cell ${cellIndex} → row ${rowNum}`);
      
      // Clear existing listeners and add new one
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      // Add event listener
      newInput.addEventListener('input', function() {
        console.log(`Input changed for row ${rowNum}, value: ${this.value}`);
        
        // Remove leading zeros if value is not just "0"
        if (this.value !== "0" && this.value.startsWith("0")) {
          this.value = this.value.replace(/^0+/, '');
        }
        
        // Recalculate totals when shares change
        updateTotals();
      });
    });
  }
  
  // Verify all inputs were set up correctly
  console.log("Verification of share inputs after setup:");
  document.querySelectorAll('input.shares-input').forEach((input, i) => {
    console.log(`Input ${i+1}: id=${input.id}, data-row=${input.getAttribute('data-row')}, value=${input.value}`);
  });
}

// Initialize table and calculate on page load
window.addEventListener('DOMContentLoaded', function() {
  initializeTable();
  attachSharesInputListeners(); // Directly attach listeners
  calculateTaxes();
});