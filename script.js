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

const rowCount = 9; // Number of rows in the table

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
  
  // Get the input by its ID
  const input = document.getElementById(`shares-row-${rowIndex}`);
  
  // If not found, throw an error
  if (!input) {
    throw new Error(`Shares input not found for row ${rowIndex}`);
  }
  
  // Get the value and convert to number
  const value = parseFloat(input.value);
  
  // Return 0 if not a valid number
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
  } else if (formula.startsWith('amt * spread')) {
    // Assume AMT is some percentage (includes state tax) 
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
  } else if (formula === 'income tax * sale price') {
    // RSU taxation - income tax on the full sale price
    result = incomeTaxRate * salePrice;
  } else if (formula === '(1 - income tax) * sale price') {
    // RSU after-tax amount
    result = (1 - incomeTaxRate) * salePrice;
  }
  
  return formatNumber(result);
}

// Create HTML for a table cell with both formula and calculated value
function createTableCell(formula, cell) {
  if (!formula || formula.trim() === '') {
    return '';
  }
  
  // Special case for AMT * spread - display in brackets
  if (formula.startsWith('amt * spread')) {
    return `
      <div class="formula">${formula}</div>
      <div class="value">[${formatCurrency(calculateFormulaValue(formula))}]</div>
    `;
  } 
  
  // Standard formula - use the value from calculateFormulaValue
  return `
    <div class="formula">${formula}</div>
    <div class="value">${formatCurrency(calculateFormulaValue(formula))}</div>
  `;
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
  
  // If no formula, return 0 instead of throwing an error
  // This allows empty cells or cells without formulas to be calculated as 0
  if (!formula) {
    return 0;
  }
  
  // Special case for amt * spread - don't include in totals
  if (formula.startsWith('amt * spread')) {
    return 0; // This is an intentional exclusion from totals
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

// Function to update exercise cost notes
function updateExerciseCostNotes() {
  const strikePrice = parseInputAsNumber(strikePriceInput);
  const exercisePrice = parseInputAsNumber(exercisePriceInput);
  const incomeTaxRate = parseInputAsNumber(incomeTaxRateInput) / 100;
  
  const spread = exercisePrice - strikePrice;
  const nsoExerciseCost = strikePrice + (incomeTaxRate * spread);
  
  // Update NSO note
  const nsoNote = document.getElementById('nso-exercise-cost');
  if (nsoNote) {
    nsoNote.textContent = ` (${formatCurrency(nsoExerciseCost)}/share)`;
  }
  
  // Update ISO note
  const isoNote = document.getElementById('iso-exercise-cost');
  if (isoNote) {
    isoNote.textContent = ` (${formatCurrency(strikePrice)}/share)`;
  }
  
  // Update payment-when-exercised
  const paymentNote = document.getElementById('payment-when-exercised');
  if (paymentNote) {
    paymentNote.textContent = `${formatCurrency(nsoExerciseCost)}/share or ${formatCurrency(strikePrice)}/share + AMT for NSO/ISO respectively`;
  }
}

// Function to calculate taxes and display results
function calculateTaxes() {
  // Validate required elements exist
  if (!resultsElement || !priceWarningElement) {
    throw new Error('Required DOM elements not found');
  }
  
  // Update exercise costs in notes
  updateExerciseCostNotes();
  
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
      <div style="margin-bottom: 15px; margin-top: 15px; padding: 10px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404; display: flex;">
        <div style="font-weight: bold; margin-right: 6px;">Warning:</div>
        <div>There are a number of material considerations when Sale Price &lt; Exercise Price that haven't been incorporated into the table below. 
        See "Cashflow and risk considerations" for some related discussion.</div>
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
  
  // First, let's find all share inputs directly for debugging
  const allShareInputs = document.querySelectorAll('input.shares-input');
  
  // Set IDs directly on share inputs based on their index
  allShareInputs.forEach((input, idx) => {
    const rowNum = idx + 1;
    input.id = `shares-row-${rowNum}`;
  });
  
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
    
    // Process column 8 (index 7) for share inputs - but we don't need to set IDs here anymore
    // We're now setting IDs directly on the inputs at the beginning of initializeTable
    if (col === 7) {
      // Find the input element within this cell
      const input = cell.querySelector('input.shares-input');
      if (input) {
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
  updateComputationTable();
}

// Add event listeners
incomeTaxRateInput.addEventListener('input', handleNumberInput);
ltcgRateInput.addEventListener('input', handleNumberInput);
strikePriceInput.addEventListener('input', handleNumberInput);
exercisePriceInput.addEventListener('input', handleNumberInput);
salePriceInput.addEventListener('input', handleNumberInput);

// Make sure exercise costs update when price inputs change
strikePriceInput.addEventListener('input', updateExerciseCostNotes);
exercisePriceInput.addEventListener('input', updateExerciseCostNotes);
incomeTaxRateInput.addEventListener('input', updateExerciseCostNotes);

// Add event listeners for match radio buttons
matchRadios.forEach(radio => {
  radio.addEventListener('change', calculateTaxes);
});

// Function to extract share counts from the table
function getSharesForCategory() {
  const shares = {};
  const inputs = document.querySelectorAll('.grid-table input.shares-input');
  
  // Grid has 8 columns per row, share inputs are in column 8 (index 7)
  // Row 0: Header, Row 1-8: Data rows (1-based in visual table, 0-based in code)
  
  // Cashless exercise (row 1-2) - Visual rows 1-2
  const cashlessSell = parseFloat(inputs[0].value || 0);  // Row 1
  const cashlessDonate = parseFloat(inputs[1].value || 0); // Row 2
  
  // Short dispose (row 3-4) - Visual rows 3-4
  const shortSell = parseFloat(inputs[2].value || 0);      // Row 3
  const shortDonate = parseFloat(inputs[3].value || 0);    // Row 4
  
  // ISO Long dispose (row 5-6) - Visual rows 5-6
  const isoLongSell = parseFloat(inputs[4].value || 0);    // Row 5
  const isoLongDonate = parseFloat(inputs[5].value || 0);  // Row 6
  
  // NSO Long dispose (row 7-8) - Visual rows 7-8  
  const nsoLongSell = parseFloat(inputs[6].value || 0);    // Row 7
  const nsoLongDonate = parseFloat(inputs[7].value || 0);  // Row 8
  
  // RSU (row 9) - Visual row 9
  const rsuSell = parseFloat(inputs[8].value || 0);        // Row 9
  
  // Return all the relevant counts
  shares.longD = parseFloat(isoLongDonate || 0) + parseFloat(nsoLongDonate || 0); 
  shares.longS = parseFloat(isoLongSell || 0) + parseFloat(nsoLongSell || 0);
  shares.shortD = parseFloat(shortDonate || 0);
  shares.shortS = parseFloat(shortSell || 0);
  shares.cashlessD = parseFloat(cashlessDonate || 0);
  shares.cashlessS = parseFloat(cashlessSell || 0);
  shares.nsoD = parseFloat(nsoLongDonate || 0);
  shares.isoD = parseFloat(isoLongDonate || 0); // Added for the new graph calculation
  shares.rsu = parseFloat(rsuSell || 0);
  
  // Calculate DS values (donated + sold)
  shares.longDS = shares.longD + shares.longS;
  shares.shortDS = shares.shortD + shares.shortS;
  shares.cashlessDS = shares.cashlessD + shares.cashlessS;
  
  return shares;
}

// Function to update computation table
function updateComputationTable() {
  // Get all the share inputs
  const shares = getSharesForCategory();
  
  // Get the price inputs
  const incomeTaxRate = parseInputAsNumber(incomeTaxRateInput) / 100;
  const strikePrice = parseInputAsNumber(strikePriceInput);
  const exercisePrice = parseInputAsNumber(exercisePriceInput);
  const salePrice = parseInputAsNumber(salePriceInput);
  
  // Calculate spread, gain, sprain
  const spread = exercisePrice - strikePrice; 
  const sprain = salePrice - strikePrice;
  
  // Calculate row 1: Deductions subject to 30% max 
  const row1Value = Math.round(shares.longD * salePrice);
  document.getElementById('calc-row1').textContent = '$' + row1Value.toLocaleString();
  
  // Calculate row 2: Deductions subject to 50% max
  const row2Value = Math.round(shares.cashlessD * (1 - incomeTaxRate) * sprain + shares.shortD * exercisePrice);
  document.getElementById('calc-row2').textContent = '$' + row2Value.toLocaleString();
  
  // Calculate row 3: Income generated from exercise and sale
  const row3Value = Math.round((shares.cashlessDS + shares.shortDS + shares.longS) * sprain + 
                    shares.nsoD * spread + shares.rsu * salePrice);
  document.getElementById('calc-row3').textContent = '$' + row3Value.toLocaleString();
    
  // Calculate row 4: Additional income needed
  const row4Value = Math.round(Math.max((100/30) * row1Value, 2 * (row1Value + row2Value)) - row3Value);
  document.getElementById('calc-row4').textContent = '$' + row4Value.toLocaleString();
  
  // Update graph with the new values and component values for calculations
  updateDeductionGraph(row1Value, row2Value, row3Value, row4Value, shares.nsoD, shares.isoD, exercisePrice, strikePrice, salePrice, incomeTaxRate);
}

// Function to draw the deduction graph
function updateDeductionGraph(row1, row2, row3, row4, nsoD, isoD, exercisePrice, strikePrice, salePrice, incomeTaxRate) {  
  const canvas = document.getElementById('deduction-graph');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // Clear previous graph
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set graph dimensions
  const padding = 40;
  const graphWidth = canvas.width - padding * 2;
  const graphHeight = canvas.height - padding * 2;
  
  // Calculate the maximum Y value for scaling
  const maxY = incomeTaxRate * (row1 + row2) * 1.15;

  // Calculate max X as 30% more than Row4 value for drawing graph
  const maxX = Math.max(row4 > 0 ? row4 * 1.3 : maxY * 1.5, 100000);
  
  
  // Ensure we have a reasonable minimum scale for Y
  const yScale = Math.max(maxY, 10000);
  
  // Draw axes
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Draw x-axis label
  ctx.font = 'bold 11px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText('Household income (excl. shares), next 10 years', canvas.width / 2, canvas.height - 10);
  
  // Draw y-axis label
  ctx.save();
  ctx.translate(15, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Max deduction', 0, 0);
  ctx.restore();
  
  // Create a clipping region that prevents drawing when X < 0
  ctx.save();
  ctx.beginPath();
  ctx.rect(padding, padding, graphWidth, graphHeight);
  ctx.clip();
  
  // New piecewise linear graph drawing
  ctx.beginPath();
  
  function lineTo(x, y) {
    ctx.lineTo(padding + (x / maxX) * graphWidth, canvas.height - padding - (y / yScale) * graphHeight);
  }

  // Start point
  const startX = -row3;
  ctx.moveTo(padding + (startX / maxX) * graphWidth, canvas.height - padding);
  
  // First segment endpoint
  const deductibleElectBoth = row2 + nsoD * exercisePrice + isoD * strikePrice;
  const firstX = deductibleElectBoth / 0.5 - row3;
  const firstY = deductibleElectBoth * incomeTaxRate;
  lineTo(firstX, firstY);
  
  // Second segment endpoint
  const secondX = (row2 + nsoD * exercisePrice) / 0.5 + (isoD * salePrice) / 0.3 - row3;
  const secondY = (row2 + nsoD * exercisePrice + isoD * salePrice) * incomeTaxRate;
  lineTo(secondX, secondY);

  // Third segment endpoint
  const thirdX = row2 / 0.5 + (nsoD * salePrice + isoD * salePrice) / 0.3 - row3;
  const thirdY = (row2 + nsoD * salePrice + isoD * salePrice) * incomeTaxRate;
  lineTo(thirdX, thirdY);

  if (Math.abs(thirdX - row4) > 0.01) {
    console.error(`thirdX (${thirdX}) does not equal row4 (${row4})`);
  }
  // assert thirdY = (row1 + row2) * incomeTaxRate
  if (Math.abs(thirdY - (row1 + row2) * incomeTaxRate) > 0.01) {
    console.error(`thirdY (${thirdY}) does not equal (row1 + row2) * incomeTaxRate (${(row1 + row2) * incomeTaxRate})`);
  }
  
  // Last segment, till the end
  const lastX = maxX;
  const lastY = thirdY
  lineTo(lastX, lastY);

  // Style and stroke the path
  ctx.strokeStyle = '#0066cc';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Fill the area under the curve
  ctx.lineTo(padding + graphWidth, canvas.height - padding);
  ctx.lineTo(padding + (startX / maxX) * graphWidth, canvas.height - padding);
  ctx.fillStyle = 'rgba(0, 102, 204, 0.1)';
  ctx.fill();
  
  // Restore the canvas state to remove clipping region
  ctx.restore();
  
  // function to format axis values. Should be in millions if >= 1M (with 1 after the decimal), otherwise in thousands
  function formatAxisValue(value) {
    if (value >= 1000000) {
      return '$' + (value / 1000000).toFixed(1) + 'M';
    } else {
      return '$' + (value / 1000).toFixed(0) + 'K';
    }
  }

  // Draw tick marks on axes
  // X-axis ticks
  ctx.font = '10px Arial';
  ctx.fillStyle = '#333';
  for (let i = 0; i <= 5; i++) {
    const x = padding + (i / 5) * graphWidth;
    const value = (i / 5) * maxX;
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - padding);
    ctx.lineTo(x, canvas.height - padding + 5);
    ctx.stroke();
    ctx.fillText(formatAxisValue(value), x, canvas.height - padding + 15);
  }
  
  // Y-axis ticks
  for (let i = 0; i <= 4; i++) {
    const y = canvas.height - padding - (i / 4) * graphHeight;
    const value = (i / 4) * yScale;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding - 5, y);
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(formatAxisValue(value), padding - 8, y + 4);
  }
  
  // Remove any previous event listeners to prevent duplicates
  canvas.removeEventListener('mousemove', handleGraphHover);
  canvas.removeEventListener('mouseleave', handleGraphLeave);
  
  // Add hover functionality
  canvas.addEventListener('mousemove', handleGraphHover);
  canvas.addEventListener('mouseleave', handleGraphLeave);
  
  function linearInterpolation(x, x1, y1, x2, y2) {
    return y1 + ((y2 - y1) / (x2 - x1)) * (x - x1);
  }

  // Hover handler function to show tooltip
  function handleGraphHover(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Only activate when within graph bounds
    if (mouseX >= padding && mouseX <= canvas.width - padding &&
        mouseY >= padding && mouseY <= canvas.height - padding) {
      
      // Convert mouse position to graph coordinates
      const graphX = ((mouseX - padding) / graphWidth) * maxX;
      
      // Calculate Y value based on piecewise function
      let graphY;
      if (graphX <= firstX) {
        graphY = linearInterpolation(graphX, startX, 0, firstX, firstY);
      } else if (graphX <= secondX) {
        graphY = linearInterpolation(graphX, firstX, firstY, secondX, secondY);
      } else if (graphX <= thirdX) {
        graphY = linearInterpolation(graphX, secondX, secondY, thirdX, thirdY);      
      } else {
        graphY = endY;
      }
      
      // Draw tooltip
      ctx.clearRect(0, 0, canvas.width, padding-5); // Clear top area for tooltip
      ctx.fillStyle = '#333';
      ctx.textAlign = 'left';
      ctx.font = 'bold 11px Arial';
      ctx.fillText(`Income: ${formatCurrency(Math.round(graphX/1000))}K, Max deduction: ${formatCurrency(Math.round(graphY/1000))}K`, padding + 5, 15);
      
      // // Draw a point on the graph to show exact position, but don't show it for negative X values
      // if (graphX >= 0) {
      //   ctx.beginPath();
      //   ctx.arc(mouseX, mouseY, 4, 0, Math.PI * 2);
      //   ctx.fillStyle = '#e74c3c';
      //   ctx.fill();
      // }
    }
  }
  
  // Clear tooltip when mouse leaves
  function handleGraphLeave() {
    ctx.clearRect(0, 0, canvas.width, padding-5);
  }
}

// Function to toggle collapsible sections
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  const toggle = document.getElementById(sectionId.replace('section', 'toggle'));
  if (section.style.display === 'none') {
    section.style.display = 'block';
    toggle.innerHTML = '&#9660;'; // Down arrow
  } else {
    section.style.display = 'none';
    toggle.innerHTML = '&#9654;'; // Right arrow
  }
}

// Initialize table and calculate on page load
window.addEventListener('DOMContentLoaded', function() {
  initializeTable();
  
  // Add input event listeners directly to share inputs
  const allShareInputs = document.querySelectorAll('input.shares-input');
  allShareInputs.forEach(input => {
    input.addEventListener('input', function() {
      updateTotals();
      updateComputationTable();
    });
  });
  
  calculateTaxes();
  updateComputationTable();
});