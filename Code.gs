/* ===================================================
    1. CONFIGURATION & CONSTANTS
=================================================== */
const SHEET_TRANSACTIONS = "Transactions";
const SHEET_ACCOUNTS = "Accounts";
const SHEET_CATEGORIES = "Categories";
const SHEET_BUDGET = "BudgetPlan";
const SHEET_GOALS = "Goals";
const SHEET_RECURRING = "RecurringBills";

/* ===================================================
    2. WEB APP HANDLERS (ROUTERS)
=================================================== */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action;

    switch (action) {
      case "getAllData":
        return getAllData();
      case "getTransactions":
        return createJsonResponse(getTransactions());
      case "addTransaction":
        return addTransaction(params);
      case "updateTransaction":
        return updateTransaction(params);
      case "deleteTransaction":
        return deleteTransaction(params);
      case "getAccounts":
        return createJsonResponse(getAccounts());
      case "getCategories":
        return createJsonResponse(getCategories());
      case "getBudgetPlan":
        return createJsonResponse(getBudgetPlan());
      case "getGoals":
        return createJsonResponse(getGoals());
      case "copyJanuaryToWholeYear":
        return copyJanuaryToWholeYear();
      case "copyCurrentYearToNextYear":
        return copyCurrentYearToNextYear({ year: params.year });
      case "saveBudget":
        return saveBudget({
          year: params.year,
          month: params.month,
          category: params.category,
          amount: params.amount
        });
      case "addCategory":
        return addCategory({
          budgetType: params.budgetType,
          group: params.group,
          categoryName: params.categoryName,
          preferredFundingSource: params.preferredFundingSource
        });
      case "deleteCategory":
        return deleteCategory({categoryId: params.categoryId});
      case "addBudgetItem":
        return addBudgetItem({
          year: params.year,
          month: params.month,
          category: params.category,
          amount: params.amount
        });
      case "deleteBudgetItem":
        return deleteBudgetItem({
          year: params.year,
          category: params.category
        });
      case "addRecurringBill":
        return createJsonResponse(addRecurringBill(params));
      case "deleteRecurringBill":
        return createJsonResponse(deleteRecurringBill({ billId: params.billId }));
      case "updateRecurringBill":
        return createJsonResponse(updateRecurringBill({ billId: params.billId, amount: params.amount }));
      case "generateBills":
        return createJsonResponse(
            generateBills()
        );
      default:
        return createJsonResponse({ error: "Invalid Action: " + action });
    }
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;

    if (action === "saveAllBudgets") {
      return saveAllBudgets(contents.budgetItems);
    }

    if (action === "deleteCategory") {
      return deleteCategory({
        categoryId: contents.categoryId
      });
    }

    return createJsonResponse({
      success: false,
      error: "Invalid POST Action: " + action
    });

  } catch (err) {
    return createJsonResponse({
      success: false,
      error: err.toString()
    });
  }
}

/* ===================================================
    3. READ OPERATIONS
=================================================== */
function getAllData() {
  return createJsonResponse({
    accounts: getAccounts(),
    budget: getBudgetPlan(),
    categories: getCategories(),
    goals: getGoals(),
    transactions: getTransactions(),
    recurringBills: getRecurringBills()
  });
}

function getTransactions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data.shift();

  return data.map((row, index) => {
    const obj = {
      rowNumber: index + 2
    };

    headers.forEach((header, colIndex) => {
      obj[String(header).trim()] = row[colIndex];
    });

    obj.transactionId = obj["Transaction ID"] || "";
    obj.Date = obj["Date"] || obj.date || "";
    obj.Amount = Number(obj["Amount"] || obj.amount || 0);
    obj.Details = obj["Details"] || obj.details || "";
    obj.Account = obj["Account"] || obj.account || "";
    obj.budgetType = obj["Budget Type"] || obj.budgetType || "";
    obj.budgetPosition = obj["Budget Position"] || obj.budgetPosition || obj.Category || "";
    obj.transferToAccount = obj["Transfer To Account"] || obj.transferToAccount || "";
    obj.recurringBillId = obj["Recurring Bill ID"] || "";
    obj.accountId = obj["Account ID"] || "";
    obj.transferToAccountId = obj["Transfer To Account ID"] || "";

    return obj;
  });
}

function getCategories() {
  return getSheetObjects(SHEET_CATEGORIES).map(row => ({
    categoryId: row["Category ID"] || "",
    budgetType: row["Budget Type"] || "Expense",
    group: row["Group"] || "Other",
    categoryName: row["Category Name"] || "",
    preferredFundingSource: row["Preferred Funding Source"] || ""
  }));
}

function getGoals() {
  return getSheetObjects(SHEET_GOALS).map(row => ({
    goal: row["Goal"] || "",
    target: Number(row["Target"] || 0),
    current: Number(row["Current"] || 0),
    monthlyContribution: Number(row["Monthly Contribution"] || 0)
  }));
}

function getAccounts() {
  return getSheetObjects(SHEET_ACCOUNTS)
    .map(row => {
      const activeRaw = String(row["Active"] || "").trim().toLowerCase();
      const isActive = activeRaw === "yes" || activeRaw === "true" || row["Active"] === true;
      const currentBalance = Number(row["Current Balance"] || 0);
      const reconciledBalance = Number(row["Last Reconciled Balance"] || 0);

      return {
        accountId: row["Account ID"] || "",
        accountName: row["Account Name"] || "",
        name: row["Account Name"] || "",
        type: row["Type"] || "",
        openingBalance: Number(row["Opening Balance"] || 0),
        currentBalance: currentBalance,
        balance: currentBalance,
        active: isActive,
        netWorthType: row["Net Worth Type"] || "Asset",
        lastReconciledDate: row["Last Reconciled Date"] || "",
        lastReconciledBalance: reconciledBalance,
        reconciled: currentBalance === reconciledBalance
      };
    })
    .filter(acc => acc.accountName !== "" && acc.active === true);
}

function getBudgetPlan() {
  return getSheetObjects(SHEET_BUDGET).map(row => ({
    year: Number(row["Year"] || new Date().getFullYear()),
    month: row["Month"] || "",
    category: row["Category"] || "",
    plannedAmount: Number(row["Planned Amount"] || 0)
  }));
}

function getRecurringBills() {
  return getSheetObjects(SHEET_RECURRING).map(row => ({
    billId: row["Bill ID"] || "",
    billName: row["Bill Name"] || "",
    budgetType: row["Budget Type"] || "",
    budgetPosition: row["Budget Position"] || "",
    amountType: row["Amount Type"] || "",
    defaultAmount: Number(row["Default Amount"] || 0),
    dueDay: Number(row["Due Day"] || 0),
    account: row["Account"] || "",
    accountId: row["Account ID"] || "",
    active: row["Active"]
  }));
}

/* ===================================================
    4. WRITE & UPDATE OPERATIONS
=================================================== */
function addTransaction(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet not found" });

  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return createJsonResponse({ success: false, error: "Sheet is empty or missing headers." });
  }

  const id = generateUUID();
  const cols = getColumnIndexMap(SHEET_TRANSACTIONS);
  
  const newRow = new Array(lastCol).fill("");

  const txDate = data.date || data.Date || new Date();
  const txAmount = data.amount !== undefined ? data.amount : (data.Amount !== undefined ? data.Amount : 0);
  const txDetails = data.details || data.Details || "";
  const txBudgetType = data.budgetType || data["Budget Type"] || "";
  const txBudgetPosition = data.budgetPosition || data["Budget Position"] || "";
  const txRecurringBillId = data.recurringBillId || data["Recurring Bill ID"] || "";
  const txAccountId =
      data.account || data.Account || "";

  const txAccountName =
      getAccountNameById(txAccountId);

  const txTransferToId =
      data.transferToAccount ||
      data["Transfer To Account"] ||
      "";

  const txTransferToName =
      getAccountNameById(txTransferToId);

  if (cols["Transaction ID"]) newRow[cols["Transaction ID"] - 1] = id;
  if (cols["Date"]) newRow[cols["Date"] - 1] = txDate;
  if (cols["Amount"]) newRow[cols["Amount"] - 1] = txAmount;
  if (cols["Details"]) newRow[cols["Details"] - 1] = txDetails;
  if (cols["Budget Type"]) newRow[cols["Budget Type"] - 1] = txBudgetType;
  if (cols["Budget Position"]) newRow[cols["Budget Position"] - 1] = txBudgetPosition;
  if (cols["Recurring Bill ID"]) newRow[cols["Recurring Bill ID"] - 1] = txRecurringBillId;
  if (cols["Account"])
      newRow[cols["Account"] - 1] = txAccountName;

  if (cols["Account ID"])
      newRow[cols["Account ID"] - 1] = txAccountId;

  if (cols["Transfer To Account"])
      newRow[cols["Transfer To Account"] - 1] = txTransferToName;

  if (cols["Transfer To Account ID"])
      newRow[cols["Transfer To Account ID"] - 1] = txTransferToId;

  sheet.appendRow(newRow);
  return createJsonResponse({ success: true, id: id });
}

function updateTransaction(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  const txAccountId =
      data.account || "";

  const txAccountName =
      getAccountNameById(txAccountId);

  const txTransferToId =
      data.transferToAccount || "";

  const txTransferToName =
      getAccountNameById(txTransferToId);
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet not found" });

  if (!data.id) {
    return createJsonResponse({ success: false, error: "Missing Transaction ID" });
  }

  const cols = getColumnIndexMap(SHEET_TRANSACTIONS);
  const idColIndex = cols["Transaction ID"] - 1;

  if (idColIndex === undefined || idColIndex < 0) {
    return createJsonResponse({ success: false, error: "'Transaction ID' column not found in sheet" });
  }

  const values = sheet.getDataRange().getValues();
  const searchId = String(data.id).trim();

  let rowIndexToUpdate = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]).trim() === searchId) {
      rowIndexToUpdate = i + 1;
      break;
    }
  }

  if (rowIndexToUpdate === -1) {
    return createJsonResponse({ success: false, error: "Transaction ID not found: " + searchId });
  }

  if (cols["Date"]) sheet.getRange(rowIndexToUpdate, cols["Date"]).setValue(data.date);
  if (cols["Amount"]) sheet.getRange(rowIndexToUpdate, cols["Amount"]).setValue(data.amount);
  if (cols["Details"]) sheet.getRange(rowIndexToUpdate, cols["Details"]).setValue(data.details);
  if (cols["Budget Type"]) sheet.getRange(rowIndexToUpdate, cols["Budget Type"]).setValue(data.budgetType);
  if (cols["Budget Position"]) sheet.getRange(rowIndexToUpdate, cols["Budget Position"]).setValue(data.budgetPosition);
  if (cols["Account"])
      sheet.getRange(
          rowIndexToUpdate,
          cols["Account"]
      ).setValue(txAccountName);

  if (cols["Account ID"])
      sheet.getRange(
          rowIndexToUpdate,
          cols["Account ID"]
      ).setValue(txAccountId);

  if (cols["Transfer To Account"])
      sheet.getRange(
          rowIndexToUpdate,
          cols["Transfer To Account"]
      ).setValue(txTransferToName);

  if (cols["Transfer To Account ID"])
      sheet.getRange(
          rowIndexToUpdate,
          cols["Transfer To Account ID"]
      ).setValue(txTransferToId);

  return createJsonResponse({ success: true });
}

function deleteTransaction(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet not found" });

  if (!data.id) {
    return createJsonResponse({ success: false, error: "Missing Transaction ID" });
  }

  const cols = getColumnIndexMap(SHEET_TRANSACTIONS);
  const idColIndex = cols["Transaction ID"] - 1;

  if (idColIndex === undefined || idColIndex < 0) {
    return createJsonResponse({ success: false, error: "'Transaction ID' column not found in sheet" });
  }

  const values = sheet.getDataRange().getValues();
  const searchId = String(data.id).trim();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]).trim() === searchId) {
      sheet.deleteRow(i + 1);
      return createJsonResponse({ success: true });
    }
  }

  return createJsonResponse({ success: false, error: "Transaction ID not found: " + searchId });
}

function copyJanuaryToWholeYear() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (!sheet) return createJsonResponse({ success: false });

  const cols = getColumnIndexMap(SHEET_BUDGET);
  const range = sheet.getDataRange();
  const data = range.getValues();
  if (data.length <= 1) return createJsonResponse({ success: true });

  const yearCol = cols["Year"] - 1;
  const monthCol = cols["Month"] - 1;
  const categoryCol = cols["Category"] - 1;
  const amountCol = cols["Planned Amount"] - 1;

  const januaryValues = {};
  for (let i = 1; i < data.length; i++) {
    const year = data[i][yearCol];
    const month = data[i][monthCol];
    const category = data[i][categoryCol];
    const amount = data[i][amountCol];

    if (month === "Jan") {
      januaryValues[`${year}|${category}`] = amount;
    }
  }

  for (let i = 1; i < data.length; i++) {
    const year = data[i][yearCol];
    const month = data[i][monthCol];
    const category = data[i][categoryCol];

    if (month === "Jan") continue;

    const key = `${year}|${category}`;
    if (januaryValues[key] !== undefined) {
      data[i][amountCol] = januaryValues[key];
    }
  }

  range.setValues(data);
  return createJsonResponse({ success: true });
}

function copyCurrentYearToNextYear(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (!sheet) return createJsonResponse({ success: false });

  const cols = getColumnIndexMap(SHEET_BUDGET);
  const data = sheet.getDataRange().getValues();

  const currentYear = Number(request.year);
  const nextYear = currentYear + 1;

  const yearCol = cols["Year"] - 1;
  const monthCol = cols["Month"] - 1;
  const categoryCol = cols["Category"] - 1;
  const amountCol = cols["Planned Amount"] - 1;

  const exists = data.some((row, i) => i > 0 && Number(row[yearCol]) === nextYear);
  if (exists) {
    return createJsonResponse({ success: false, message: `Year ${nextYear} already exists` });
  }

  const currentYearRows = data.filter((row, i) => i > 0 && Number(row[yearCol]) === currentYear);
  const newRows = currentYearRows.map(row => {
    const newRow = new Array(sheet.getLastColumn()).fill("");
    newRow[yearCol] = nextYear;
    newRow[monthCol] = row[monthCol];
    newRow[categoryCol] = row[categoryCol];
    newRow[amountCol] = row[amountCol];
    return newRow;
  });

  if (newRows.length > 0) {
    sheet.getRange(data.length + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return createJsonResponse({ success: true, nextYear: nextYear });
}

function saveAllBudgets(budgetItems) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (!sheet) return createJsonResponse({ success: false });

  const cols = getColumnIndexMap(SHEET_BUDGET);
  const range = sheet.getDataRange();
  const data = range.getValues();

  const yearCol = cols["Year"] - 1;
  const monthCol = cols["Month"] - 1;
  const categoryCol = cols["Category"] - 1;
  const amountCol = cols["Planned Amount"] - 1;

  const updateMap = {};
  budgetItems.forEach(item => {
    const key = `${item.year}|${item.month}|${item.category}`;
    updateMap[key] = Number(item.amount);
  });

  for (let i = 1; i < data.length; i++) {
    const rowKey = `${data[i][yearCol]}|${data[i][monthCol]}|${data[i][categoryCol]}`;
    if (updateMap[rowKey] !== undefined) {
      data[i][amountCol] = updateMap[rowKey];
    }
  }

  range.setValues(data);
  return createJsonResponse({ success: true });
}

function saveBudget(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (!sheet) return createJsonResponse({ success: false });

  const cols = getColumnIndexMap(SHEET_BUDGET);
  const data = sheet.getDataRange().getValues();

  const yearCol = cols["Year"] - 1;
  const monthCol = cols["Month"] - 1;
  const categoryCol = cols["Category"] - 1;

  for (let i = 1; i < data.length; i++) {
    if (
      data[i][yearCol] == request.year &&
      data[i][monthCol] == request.month &&
      data[i][categoryCol] == request.category
    ) {
      sheet.getRange(i + 1, cols["Planned Amount"]).setValue(Number(request.amount));
      return createJsonResponse({ success: true });
    }
  }

  return createJsonResponse({ success: false, message: "Item not found" });
}

function addCategory(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATEGORIES);
  const cols = getColumnIndexMap(SHEET_CATEGORIES);

  const row = new Array(sheet.getLastColumn()).fill("");
  const categoryId = "CAT" + Date.now();

  row[cols["Category ID"] - 1] = categoryId;
  row[cols["Budget Type"] - 1] = request.budgetType;
  row[cols["Group"] - 1] = request.group;
  row[cols["Category Name"] - 1] = request.categoryName;
  row[cols["Preferred Funding Source"] - 1] = request.preferredFundingSource;

  sheet.appendRow(row);
  return createJsonResponse({ success: true });
}

function deleteCategory(request) {
  const categoryId = request.categoryId;
  if (!categoryId) return createJsonResponse({ success: false, message: "Category ID required" });

  let categoryName = "";

  // 1. Find and remove category from Categories sheet, and capture categoryName for BudgetPlan cleanup
  const categorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATEGORIES);
  if (categorySheet) {
    const cols = getColumnIndexMap(SHEET_CATEGORIES);
    const catData = categorySheet.getDataRange().getValues();

    if (catData.length > 1) {
      const header = catData[0];
      const idCol = cols["Category ID"] - 1;
      const nameCol = cols["Category Name"] - 1;

      // Locate target row to get its name before deleting
      const targetRow = catData.slice(1).find(row => row[idCol] === categoryId);
      if (targetRow) categoryName = targetRow[nameCol];

      const filtered = catData.slice(1).filter(row => row[idCol] !== categoryId);
      const updated = [header, ...filtered];

      categorySheet.clearContents();
      categorySheet.getRange(1, 1, updated.length, updated[0].length).setValues(updated);
    }
  }

  // 2. Remove matching rows from BudgetPlan sheet using the retrieved categoryName
  const budgetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (budgetSheet && categoryName) {
    const cols = getColumnIndexMap(SHEET_BUDGET);
    const budgetData = budgetSheet.getDataRange().getValues();

    if (budgetData.length > 1) {
      const header = budgetData[0];
      const categoryCol = cols["Category"] - 1;
      const filtered = budgetData.slice(1).filter(row => row[categoryCol] !== categoryName);
      const updated = [header, ...filtered];

      budgetSheet.clearContents();
      budgetSheet.getRange(1, 1, updated.length, updated[0].length).setValues(updated);
    }
  }

  return createJsonResponse({ success: true });
}

function addBudgetItem(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (!sheet) return createJsonResponse({ success: false, message: "Budget sheet not found" });

  const cols = getColumnIndexMap(SHEET_BUDGET);
  const data = sheet.getDataRange().getValues();

  const yearCol = cols["Year"] - 1;
  const monthCol = cols["Month"] - 1;
  const categoryCol = cols["Category"] - 1;
  const amountCol = cols["Planned Amount"] - 1;

  const exists = data.some((row, index) => {
    if (index === 0) return false;
    return Number(row[yearCol]) === Number(request.year) && row[categoryCol] === request.category;
  });

  if (exists) {
    return createJsonResponse({
      success: false,
      message: `${request.category} already exists for ${request.year}`
    });
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const newRows = months.map(month => {
    const row = new Array(sheet.getLastColumn()).fill("");
    row[yearCol] = Number(request.year);
    row[monthCol] = month;
    row[categoryCol] = request.category;
    row[amountCol] = month === request.month ? Number(request.amount) : 0;
    return row;
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);

  return createJsonResponse({ success: true, message: "Budget item added successfully" });
}

function deleteBudgetItem(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);
  if (!sheet) return createJsonResponse({ success: false });

  const cols = getColumnIndexMap(SHEET_BUDGET);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return createJsonResponse({ success: true });

  const yearCol = cols["Year"] - 1;
  const categoryCol = cols["Category"] - 1;

  const header = data[0];
  const filtered = data.slice(1).filter(row => !(
    Number(row[yearCol]) === Number(request.year) &&
    row[categoryCol] === request.category
  ));

  const updated = [header, ...filtered];

  sheet.clearContents();
  sheet.getRange(1, 1, updated.length, updated[0].length).setValues(updated);

  return createJsonResponse({ success: true });
}

function addRecurringBill(params) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECURRING);
  const cols = getColumnIndexMap(SHEET_RECURRING);

  const row = new Array(sheet.getLastColumn()).fill("");
  const billId = `RB${String(sheet.getLastRow()).padStart(3, "0")}`;

  row[cols["Bill ID"] - 1] = billId;
  row[cols["Bill Name"] - 1] = params.billName;
  row[cols["Budget Type"] - 1] = params.budgetType;
  row[cols["Budget Position"] - 1] = params.budgetPosition;
  row[cols["Amount Type"] - 1] = params.amountType;
  row[cols["Default Amount"] - 1] = Number(params.amount);
  row[cols["Due Day"] - 1] = Number(params.dueDay);
  const accountId = params.account || "";
  const accountName = getAccountNameById(accountId);

  if (cols["Account"])
      row[cols["Account"] - 1] = accountName;

  if (cols["Account ID"])
      row[cols["Account ID"] - 1] = accountId;
  row[cols["Active"] - 1] = true;

  sheet.appendRow(row);
  return { success: true };
}

function updateRecurringBill(request) {
  if (!request.billId) {
    return { success: false, message: "Missing Bill ID" };
  }
  
  const amount = Number(request.amount);
  if (isNaN(amount) || amount < 0) {
    return { success: false, message: "Invalid amount value" };
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECURRING);
  if (!sheet) return { success: false, message: "Sheet not found" };

  const cols = getColumnIndexMap(SHEET_RECURRING);
  const data = sheet.getDataRange().getValues();
  const billIdCol = cols["Bill ID"] - 1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][billIdCol]).trim() === String(request.billId).trim()) {
      sheet.getRange(i + 1, cols["Default Amount"]).setValue(amount);
      return { success: true };
    }
  }

  return { success: false, message: "Bill ID not found" };
}

function deleteRecurringBill(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECURRING);
  const cols = getColumnIndexMap(SHEET_RECURRING);
  const data = sheet.getDataRange().getValues();

  const billIdCol = cols["Bill ID"] - 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][billIdCol] === request.billId) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { success: false };
}

function generateBills() {
  const recurringBills = getRecurringBills();
  const transactions = getTransactions();

  if (!recurringBills.length) {
    return { success: true, count: 0 };
  }

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  let count = 0;

  recurringBills.forEach(bill => {
    if (!bill.active) return;

    const billName = bill.billName;

    const alreadyExists =
        transactions.some(tx => {

        const txDate =
            new Date(tx.Date);

        return (
            tx.recurringBillId === bill.billId &&
            txDate.getMonth() === currentMonth &&
            txDate.getFullYear() === currentYear
        );
    });

    if (alreadyExists) return;

    addTransaction({
      date: Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd"),
      amount: bill.defaultAmount,
      details: billName,
      account: bill.accountId,
      budgetType: bill.budgetType,
      budgetPosition: bill.budgetPosition,
      transferToAccount: "",
      recurringBillId: bill.billId
      });

    count++;
  });

  return { success: true, count: count };
}

function testUUIDGeneration() {
  var testId = generateUUID();
  Logger.log("Generated UUID: " + testId);
  
  // Verify it returns a non-empty string format
  if (testId && testId.length > 20) {
    Logger.log("SUCCESS: UUID generated correctly.");
  } else {
    Logger.log("FAILED: UUID issue detected.");
  }
}

/* ===================================================
    5. CORE HELPERS & UTILITIES
=================================================== */
function generateUUID() {
  return Utilities.getUuid();
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getColumnIndexMap(sheetName) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);

  if (!sheet) return {};

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];

  const map = {};
  headers.forEach((header, index) => {
    map[String(header).trim()] = index + 1;
  });

  return map;
}

function getSheetObjects(sheetName) {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName);

  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data.shift();

  return data.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[String(header).trim()] = row[index];
    });
    return obj;
  });
}

function showInputDialog(title, message, value = "") {
  return new Promise(resolve => {
    const modal = document.getElementById("inputModal");
    const titleEl = document.getElementById("inputTitle");
    const messageEl = document.getElementById("inputMessage");
    const inputEl = document.getElementById("inputValue");
    const saveBtn = document.getElementById("inputSave");
    const cancelBtn = document.getElementById("inputCancel");

    titleEl.textContent = title;
    messageEl.textContent = message;
    inputEl.value = value;

    modal.classList.add("show");

    const cleanup = () => {
      modal.classList.remove("show");
      inputEl.removeEventListener("keydown", handleKeyDown);
    };

    const handleSave = () => {
      cleanup();
      resolve(inputEl.value);
    };

    const handleCancel = () => {
      cleanup();
      resolve(null);
    };

    const handleKeyDown = (e) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") handleCancel();
    };

    saveBtn.onclick = handleSave;
    cancelBtn.onclick = handleCancel;
    inputEl.addEventListener("keydown", handleKeyDown);

    inputEl.focus();
    inputEl.select();
  });
}

function getAccountById(accountId) {
  const accounts = getAccounts();

  return accounts.find(acc =>
    String(acc.accountId).trim() ===
    String(accountId).trim()
  );
}

function getAccountNameById(accountId) {
  const account = getAccountById(accountId);

  return account
    ? account.accountName
    : "";
}
