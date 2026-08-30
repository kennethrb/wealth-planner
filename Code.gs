// ===== SHEET NAMES =====
const SHEET_TRANSACTIONS = "Transactions";
const SHEET_ACCOUNTS = "Accounts";
const SHEET_CATEGORIES = "Categories";
const SHEET_BUDGET = "BudgetPlan";
const SHEET_GOALS = "Goals";
const SHEET_RECURRING = "RecurringBills";

/* ===================================================
    HELPERS
=================================================== */

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

/* ===================================================
    READ OPERATIONS
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
      rowNumber: index + 2 // Preserve 1-based row index for deletions/updates
    };

    headers.forEach((header, colIndex) => {
      obj[String(header).trim()] = row[colIndex];
    });

    // Explicit standardized mappings for frontend compatibility
    obj.transactionId = obj["Transaction ID"] || "";
    obj.Date = obj["Date"] || obj.date || "";
    obj.Amount = Number(obj["Amount"] || obj.amount || 0);
    obj.Details = obj["Details"] || obj.details || "";
    obj.Account = obj["Account"] || obj.account || "";
    obj.budgetType = obj["Budget Type"] || obj.budgetType || "";
    obj.budgetPosition = obj["Budget Position"] || obj.budgetPosition || obj.Category || "";
    obj.transferToAccount = obj["Transfer To Account"] || obj.transferToAccount || "";

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
    active: row["Active"]
  }));
}

/* ===================================================
    WRITE & UPDATE OPERATIONS
=================================================== */

function addTransaction(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) {
    return createJsonResponse({
      success: false,
      error: "Transactions sheet missing"
    });
  }

  const cols = getColumnIndexMap(SHEET_TRANSACTIONS);
  const row = new Array(sheet.getLastColumn()).fill("");
  const transactionId = "TX" + Date.now();

  row[cols["Transaction ID"] - 1] = transactionId;
  row[cols["Date"] - 1] = request.date;
  row[cols["Amount"] - 1] = Number(request.amount);
  row[cols["Details"] - 1] = request.details || "";
  row[cols["Account"] - 1] = request.account;
  row[cols["Budget Type"] - 1] = request.budgetType || "";
  row[cols["Budget Position"] - 1] = request.budgetPosition || "";
  row[cols["Transfer To Account"] - 1] = request.transferToAccount || "";

  sheet.appendRow(row);

  return createJsonResponse({
    success: true,
    transactionId: transactionId
  });
}

function updateTransaction(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return createJsonResponse({ success: false, error: "Transactions sheet missing" });

  const row = Number(request.rowNumber);
  const cols = getColumnIndexMap(SHEET_TRANSACTIONS);

  if (cols["Date"]) sheet.getRange(row, cols["Date"]).setValue(request.date);
  if (cols["Amount"]) sheet.getRange(row, cols["Amount"]).setValue(Number(request.amount));
  if (cols["Details"]) sheet.getRange(row, cols["Details"]).setValue(request.details || "");
  if (cols["Account"]) sheet.getRange(row, cols["Account"]).setValue(request.account);
  if (cols["Budget Type"]) sheet.getRange(row, cols["Budget Type"]).setValue(request.budgetType || "");
  if (cols["Budget Position"]) sheet.getRange(row, cols["Budget Position"]).setValue(request.budgetPosition || "");
  if (cols["Transfer To Account"]) sheet.getRange(row, cols["Transfer To Account"]).setValue(request.transferToAccount || "");

  return createJsonResponse({ success: true });
}

function deleteTransaction(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);
  if (!sheet) return createJsonResponse({ success: false, error: "Transactions sheet missing" });

  const rowNumber = Number(request.rowNumber);
  if (rowNumber > 1 && rowNumber <= sheet.getLastRow()) {
    sheet.deleteRow(rowNumber);
    return createJsonResponse({ success: true });
  }

  return createJsonResponse({ success: false, error: "Invalid row number" });
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
  const categorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CATEGORIES);
  const budgetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUDGET);

  if (categorySheet) {
    const cols = getColumnIndexMap(SHEET_CATEGORIES);
    const catData = categorySheet.getDataRange().getValues();

    if (catData.length > 0) {
      const header = catData[0];
      const categoryNameCol = cols["Category Name"] - 1;
      const filtered = catData.slice(1).filter(row => row[categoryNameCol] !== request.categoryName);
      const updated = [header, ...filtered];

      categorySheet.clearContents();
      categorySheet.getRange(1, 1, updated.length, updated[0].length).setValues(updated);
    }
  }

  if (budgetSheet) {
    const cols = getColumnIndexMap(SHEET_BUDGET);
    const budgetData = budgetSheet.getDataRange().getValues();

    if (budgetData.length > 0) {
      const header = budgetData[0];
      const categoryCol = cols["Category"] - 1;
      const filtered = budgetData.slice(1).filter(row => row[categoryCol] !== request.categoryName);
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
  row[cols["Account"] - 1] = params.account;
  row[cols["Active"] - 1] = true;

  sheet.appendRow(row);
  return { success: true };
}

function updateRecurringBill(request) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RECURRING);
  const cols = getColumnIndexMap(SHEET_RECURRING);
  const data = sheet.getDataRange().getValues();

  const billIdCol = cols["Bill ID"] - 1;

  for (let i = 1; i < data.length; i++) {
    if (data[i][billIdCol] === request.billId) {
      sheet.getRange(i + 1, cols["Default Amount"]).setValue(Number(request.amount));
      return { success: true };
    }
  }

  return { success: false };
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
  const transactionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSACTIONS);

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

    const alreadyExists = transactions.some(tx => {
      const txDate = new Date(tx.Date);
      return (
        tx.Details === billName &&
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    if (alreadyExists) return;

    addTransaction({
      date: Utilities.formatDate(today, Session.getScriptTimeZone(), "yyyy-MM-dd"),
      amount: bill.defaultAmount,
      details: billName,
      account: bill.account,
      budgetType: bill.budgetType,
      budgetPosition: bill.budgetPosition,
      transferToAccount: ""
    });

    count++;
  });

  return { success: true, count: count };
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

/* ===================================================
    ROUTERS & UTILS
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
        return addTransaction({
          date: params.date,
          amount: params.amount,
          details: params.details,
          account: params.account,
          budgetType: params.budgetType,
          budgetPosition: params.budgetPosition,
          transferToAccount: params.transferToAccount
        });
      case "updateTransaction":
        return updateTransaction({
          rowNumber: params.rowNumber,
          date: params.date,
          amount: params.amount,
          details: params.details,
          account: params.account,
          budgetType: params.budgetType,
          budgetPosition: params.budgetPosition,
          transferToAccount: params.transferToAccount
        });
      case "deleteTransaction":
        return deleteTransaction({ rowNumber: params.rowNumber });
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
        return deleteCategory({ categoryName: params.categoryName });
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
        return createJsonResponse(generateBills());
      default:
        return createJsonResponse({ error: "Invalid Action: " + action });
    }
  } catch (err) {
    return createJsonResponse({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const request = JSON.parse(e.postData.contents);

    if (request.action === "saveAllBudgets") {
      return saveAllBudgets(request.budgetItems);
    }

    return createJsonResponse({ success: false, error: "Invalid action" });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.message });
  }
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
