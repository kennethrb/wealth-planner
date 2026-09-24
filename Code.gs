/*
TODO:
Refactor spreadsheet access to support
TEST and PERSONAL mode for WRITE operations.

Current status:
- Reads support mode switching
- Writes use ActiveSpreadsheet

Future:
- Implement getModeSheet()
- Pass mode from frontend
- Update CRUD functions
*/

/* ===================================================
    1. CONFIGURATION & CONSTANTS
=================================================== */
const TEST_SPREADSHEET_ID =
    "1pztW52iVx1h6VuP-sXEDFmF2dIpt3tJDw2Q1MrZl-r4";

const PERSONAL_SPREADSHEET_ID =
    "1Sddj-gfNj06zPdOqW_WGPEtNWb13hiQa-3WG2TzLiL4";

const SPREADSHEET_CACHE = {};

function getSpreadsheet(mode) {

  const cacheKey =
    mode === "PERSONAL"
      ? "PERSONAL"
      : "TEST";

  if (SPREADSHEET_CACHE[cacheKey]) {
    return SPREADSHEET_CACHE[cacheKey];
  }

  const id =
    mode === "PERSONAL"
      ? PERSONAL_SPREADSHEET_ID
      : TEST_SPREADSHEET_ID;

  SPREADSHEET_CACHE[cacheKey] =
    SpreadsheetApp.openById(id);

  return SPREADSHEET_CACHE[cacheKey];
}

const SHEET_TRANSACTIONS = "Transactions";
const SHEET_ACCOUNTS = "Accounts";
const SHEET_CATEGORIES = "Categories";
const SHEET_GOALS = "Goals";
const SHEET_RECURRING = "RecurringBills";
const SHEET_ADVISOR_MEMORY = "AdvisorMemory";

/* ===================================================
    2. WEB APP HANDLERS (ROUTERS)
=================================================== */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action;

    switch (action) {
      case "getAllData":
        return getAllData(params.mode);
      case "getTransactions":
        return createJsonResponse(getTransactions());
      case "addTransaction":
        return addTransaction(params);
      case "updateTransaction":
        return updateTransaction(params);
      case "deleteTransaction":
        return deleteTransaction(params);
      // Add these cases to doGet(e) switch statement:
      case "addAccount":
        return addAccount(params);

      case "updateAccount":
        return updateAccount(params);

      case "archiveAccount":
        return archiveAccount(params);

      case "deleteAccount":
        return deleteAccount(params);
      case "getCategories":
        return createJsonResponse(getCategories(params.mode));
      case "getGoals":
        return createJsonResponse(getGoals(params.mode));
      case "addGoal":
          return addGoal(params);
      case "updateGoal":
          return updateGoal(params);
      case "archiveGoal":
          return archiveGoal(params);
      case "deleteGoal":
          return deleteGoal(params);
      case "addAdvisorMemory":
          return addAdvisorMemory(params);
      case "updateAdvisorMemory":
          return updateAdvisorMemory(params);
      case "addCategory":
      return addCategory({
          mode: params.mode,
          budgetType: params.budgetType,
          group: params.group,
          categoryName: params.categoryName,
          preferredFundingSource: params.preferredFundingSource
      });
      case "deleteCategory":
          return deleteCategory({
              mode: params.mode,
              categoryId: params.categoryId
          });
      case "addRecurringBill":
        return createJsonResponse(addRecurringBill(params));
      case "deleteRecurringBill":
        return createJsonResponse(
            deleteRecurringBill({
                mode: params.mode,
                billId: params.billId
            })
        );
      case "updateRecurringBill":
        return createJsonResponse(
            updateRecurringBill({
                mode: params.mode,
                billId: params.billId,
                amount: params.amount
            })
        );
      case "generateBills":
        return createJsonResponse(
            generateBills(params.mode)
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

    if (action === "deleteCategory") {
      return deleteCategory({
          mode: contents.mode,
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
function getAllData(mode) {
  return createJsonResponse({
    accounts: getAccounts(mode),
    categories: getCategories(mode),
    goals: getGoals(mode),
    transactions: getTransactions(mode),
    recurringBills: getRecurringBills(mode),
    advisorMemory: getAdvisorMemory(mode)
  });
}

function getTransactions(mode) {
  const sheet = getSpreadsheet(mode).getSheetByName(SHEET_TRANSACTIONS);
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

function getCategories(mode) {
  return getSheetObjects(SHEET_CATEGORIES,mode).map(row => ({
    categoryId: row["Category ID"] || "",
    budgetType: row["Budget Type"] || "Expense",
    group: row["Group"] || "Other",
    categoryName: row["Category Name"] || "",
    preferredFundingSource: row["Preferred Funding Source"] || "",
    preferredFundingSourceId: row["Preferred Funding Source ID"] || ""
  }));
}

function getGoals(mode) {

  return getSheetObjects(
      SHEET_GOALS,
      mode
  ).map(row => {

    const current =
      Number(row["Current"] || 0);

    const target =
      Number(row["Target"] || 0);

  return {
      goalId:
          row["Goal ID"] || "",

      goal:
          row["Goal"] || "",

      target: target,

      current: current,

      monthlyContribution:
        Number(
          row["Monthly Contribution"] || 0
        ),

      status:
        row["Status"] ||
        (
          current >= target
            ? "GRADUATED"
            : "ACTIVE"
        ),

      graduatedDate:
        row["Graduated Date"] || "",

      archivedDate:
        row["Archived Date"] || ""
    };
  });

}

function addGoal(data) {

  const sheet =
      getModeSheet(
          SHEET_GOALS,
          data.mode
      );

  if (!sheet) {
      return createJsonResponse({
          success: false,
          error: "Goals sheet not found"
      });
  }

  const cols =
      getColumnIndexMap(
          SHEET_GOALS,
          data.mode
      );

  const goalId =
      "GOAL" + Date.now();

  const row =
      new Array(
          sheet.getLastColumn()
      ).fill("");

  if (cols["Goal ID"])
      row[cols["Goal ID"] - 1] =
          goalId;

  if (cols["Goal"])
      row[cols["Goal"] - 1] =
          data.goal || "";

  if (cols["Target"])
      row[cols["Target"] - 1] =
          Number(data.target || 0);

  if (cols["Current"])
      row[cols["Current"] - 1] =
          Number(data.current || 0);

  if (cols["Monthly Contribution"])
      row[
          cols["Monthly Contribution"] - 1
      ] =
          Number(
              data.monthlyContribution || 0
          );

  if (cols["Status"])
      row[
          cols["Status"] - 1
      ] =
          data.status || "ACTIVE";

  sheet.appendRow(row);

  return createJsonResponse({
      success: true,
      goalId: goalId
  });
}

function updateGoal(data) {

  const sheet =
      getModeSheet(
          SHEET_GOALS,
          data.mode
      );

  if (!sheet) {
      return createJsonResponse({
          success: false,
          error: "Goals sheet not found"
      });
  }

  const goalId =
      String(
          data.goalId || ""
      ).trim();

  if (!goalId) {
      return createJsonResponse({
          success: false,
          error: "Missing Goal ID"
      });
  }

  const cols =
      getColumnIndexMap(
          SHEET_GOALS,
          data.mode
      );

  const values =
      sheet
        .getDataRange()
        .getValues();

  const idCol =
      cols["Goal ID"] - 1;

  let rowIndex = -1;

  for (
      let i = 1;
      i < values.length;
      i++
  ) {
      if (
          String(
              values[i][idCol]
          ).trim() === goalId
      ) {
          rowIndex = i + 1;
          break;
      }
  }

  if (rowIndex === -1) {
      return createJsonResponse({
          success: false,
          error: "Goal not found"
      });
  }

  if (cols["Goal"] && data.goal)
      sheet.getRange(
          rowIndex,
          cols["Goal"]
      ).setValue(data.goal);

  if (cols["Target"])
      sheet.getRange(
          rowIndex,
          cols["Target"]
      ).setValue(
          Number(data.target || 0)
      );

  if (cols["Current"])
      sheet.getRange(
          rowIndex,
          cols["Current"]
      ).setValue(
          Number(data.current || 0)
      );

  if (
      cols["Monthly Contribution"]
  )
      sheet.getRange(
          rowIndex,
          cols[
            "Monthly Contribution"
          ]
      ).setValue(
          Number(
             data.monthlyContribution || 0
          )
      );

  if (
      cols["Status"] &&
      data.status
  )
      sheet.getRange(
          rowIndex,
          cols["Status"]
      ).setValue(
          data.status
      );

  return createJsonResponse({
      success: true
  });
}

function archiveGoal(data) {

  const sheet =
      getModeSheet(
          SHEET_GOALS,
          data.mode
      );

  if (!sheet) {
      return createJsonResponse({
          success: false,
          error: "Goals sheet not found"
      });
  }

  const goalId =
      String(
          data.goalId || ""
      ).trim();

  const cols =
      getColumnIndexMap(
          SHEET_GOALS,
          data.mode
      );

  const values =
      sheet
        .getDataRange()
        .getValues();

  const idCol =
      cols["Goal ID"] - 1;

  for (
      let i = 1;
      i < values.length;
      i++
  ) {

      if (
          String(
              values[i][idCol]
          ).trim() === goalId
      ) {

          if (cols["Status"]) {
              sheet.getRange(
                  i + 1,
                  cols["Status"]
              ).setValue(
                  "ARCHIVED"
              );
          }

          if (
              cols["Archived Date"]
          ) {
              sheet.getRange(
                  i + 1,
                  cols["Archived Date"]
              ).setValue(
                  new Date()
              );
          }

          return createJsonResponse({
              success: true
          });
      }
  }

  return createJsonResponse({
      success: false,
      error: "Goal not found"
  });
}

function deleteGoal(data) {

  const sheet =
      getModeSheet(
          SHEET_GOALS,
          data.mode
      );

  if (!sheet) {
      return createJsonResponse({
          success: false,
          error: "Goals sheet not found"
      });
  }

  const goalId =
      String(
          data.goalId || ""
      ).trim();

  const cols =
      getColumnIndexMap(
          SHEET_GOALS,
          data.mode
      );

  const dataRange =
      sheet
        .getDataRange()
        .getValues();

  const idCol =
      cols["Goal ID"] - 1;

  for (
      let i = 1;
      i < dataRange.length;
      i++
  ) {

      if (
          String(
              dataRange[i][idCol]
          ).trim() === goalId
      ) {

          sheet.deleteRow(
              i + 1
          );

          return createJsonResponse({
              success: true
          });
      }
  }

  return createJsonResponse({
      success: false,
      error: "Goal not found"
  });
}

/* ===================================================
    ACCOUNT CRUD OPERATIONS
=================================================== */

function getAccounts(mode) {
  return getSheetObjects(SHEET_ACCOUNTS,mode)
    .map(row => {
      const activeRaw = String(row["Active"] || "").trim().toLowerCase();
      const isActive = activeRaw === "yes" || activeRaw === "true" || row["Active"] === true;
      const reconciledBalance =
          Number(
              row["Last Reconciled Balance"] || 0
          );


      return {
        accountId: row["Account ID"] || "",
        accountName: row["Account Name"] || "",
        name: row["Account Name"] || "",
        type: row["Type"] || "",
        assetClass: row["Asset Class"] || "",
        openingBalance: Number(row["Opening Balance"] || 0),
        currentBalance: 0,
        balance: 0,
        active: isActive,
        netWorthType: row["Net Worth Type"] || "Asset",
        lastReconciledDate: row["Last Reconciled Date"] || "",
        lastReconciledBalance: reconciledBalance,
        protected:
            String(
                row["Protected"] || ""
            ).toLowerCase() === "true",

        minimumBalance:
            Number(
                row["Minimum Balance"] || 0
            ),
        reconciled: false
      };
    })
    .filter(acc =>
        acc.accountName !== "" &&
        acc.active === true
    );
}

/** CREATE: Add new account */
function addAccount(data) {
  const sheet =
      getModeSheet(
          SHEET_ACCOUNTS,
          data.mode
      );
  if (!sheet) return createJsonResponse({ success: false, error: "Accounts sheet not found" });

  const cols =
      getColumnIndexMap(
          SHEET_ACCOUNTS,
          data.mode
      );

  const accountId = "ACC" + Date.now();
  const row = new Array(sheet.getLastColumn()).fill("");

  if (cols["Account ID"]) row[cols["Account ID"] - 1] = accountId;
  if (cols["Account Name"]) row[cols["Account Name"] - 1] = data.name || data.accountName || "";
  if (cols["Net Worth Type"]) row[cols["Net Worth Type"] - 1] = data.netWorthType || "Asset";
  if (cols["Type"]) row[cols["Type"] - 1] = data.type || data.assetClass || "Cash";
  if (cols["Asset Class"]) row[cols["Asset Class"] - 1] = data.assetClass || "Cash";
  if (cols["Opening Balance"]) row[cols["Opening Balance"] - 1] = Number(data.currentBalance || data.openingBalance || 0);
  if (cols["Active"]) row[cols["Active"] - 1] = "Yes";
  if (cols["Protected"])
      row[cols["Protected"] - 1] =
          String(data.protected) === "true";

  if (cols["Minimum Balance"])
      row[cols["Minimum Balance"] - 1] =
          Number(data.minimumBalance || 0);

  sheet.appendRow(row);
  return createJsonResponse({ success: true, accountId: accountId });
}

/** UPDATE: Edit account details or balance */
function updateAccount(data) {
  const sheet =
      getModeSheet(
          SHEET_ACCOUNTS,
          data.mode
      );
  if (!sheet) return createJsonResponse({ success: false, error: "Accounts sheet not found" });

  const accountId = String(data.accountId || data.id).trim();
  if (!accountId) return createJsonResponse({ success: false, error: "Missing Account ID" });

  const cols =
      getColumnIndexMap(
          SHEET_ACCOUNTS,
          data.mode
      );

  const idColIndex = cols["Account ID"] - 1;
  const values = sheet.getDataRange().getValues();

  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]).trim() === accountId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) return createJsonResponse({ success: false, error: "Account not found" });

  if (cols["Account Name"] && data.name) sheet.getRange(rowIndex, cols["Account Name"]).setValue(data.name);
  if (cols["Net Worth Type"] && data.netWorthType) sheet.getRange(rowIndex, cols["Net Worth Type"]).setValue(data.netWorthType);
  if (cols["Type"] && data.type) sheet.getRange(rowIndex, cols["Type"]).setValue(data.type);
  if (cols["Asset Class"] && data.assetClass) sheet.getRange(rowIndex, cols["Asset Class"]).setValue(data.assetClass);
  if (cols["Protected"])
  {
      sheet.getRange(
          rowIndex,
          cols["Protected"]
      ).setValue(
          String(data.protected) === "true"
      );
  }

  if (cols["Minimum Balance"])
  {
      sheet.getRange(
          rowIndex,
          cols["Minimum Balance"]
      ).setValue(
          Number(
              data.minimumBalance || 0
          )
      );
  }



  return createJsonResponse({ success: true });
}

/** DELETE: Soft delete (set Active = No) or delete row */
function deleteAccount(data) {
  const sheet =
      getModeSheet(
          SHEET_ACCOUNTS,
          data.mode
      );
  if (!sheet) return createJsonResponse({ success: false, error: "Accounts sheet not found" });

  const accountId = String(data.accountId || data.id).trim();
  if (!accountId) return createJsonResponse({ success: false, error: "Missing Account ID" });
  const cols =
      getColumnIndexMap(
          SHEET_ACCOUNTS,
          data.mode
      );

  const idColIndex = cols["Account ID"] - 1;
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]).trim() === accountId) {
      if (cols["Active"]) {
        sheet.getRange(i + 1, cols["Active"]).setValue("No"); // Soft delete
      } else {
        sheet.deleteRow(i + 1); // Hard delete fallback
      }
      return createJsonResponse({ success: true });
    }
  }

  return createJsonResponse({ success: false, error: "Account ID not found" });
}

function archiveAccount(params) {
  if (!params.accountId) return { success: false, message: "Missing Account ID" };

  const sheet =
      getModeSheet(
          SHEET_ACCOUNTS,
          params.mode
      );
  const cols =
      getColumnIndexMap(
          SHEET_ACCOUNTS,
          params.mode
      );
  const data = sheet.getDataRange().getValues();
  const idCol = cols["Account ID"] - 1;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]).trim() === String(params.accountId).trim()) {
      sheet.getRange(i + 1, cols["Active"]).setValue(false);
      return createJsonResponse({
        success: true, message: "Account archived successfully"
        });
    }
  }

  return { success: false, message: "Account ID not found" };
}



function getRecurringBills(mode) {
  return getSheetObjects(SHEET_RECURRING,mode).map(row => ({
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

function getAdvisorMemory(mode) {

    return getSheetObjects(
        SHEET_ADVISOR_MEMORY,
        mode
    ).map(row => ({

        recommendationId:
            row["Recommendation ID"] || "",

        createdDate:
            row["Created Date"] || "",

        recommendation:
            row["Recommendation"] || "",

        confidence:
            Number(
                row["Confidence"] || 0
            ),

        status:
            row["Status"] || "PENDING",

        outcome:
            row["Outcome"] || ""

    }));
}

function addAdvisorMemory(data) {

    const sheet =
        getModeSheet(
            SHEET_ADVISOR_MEMORY,
            data.mode
        );

    const cols =
        getColumnIndexMap(
            SHEET_ADVISOR_MEMORY,
            data.mode
        );

    const row =
        new Array(
            sheet.getLastColumn()
        ).fill("");

    const id =
        "ADV" + Date.now();

    row[
        cols["Recommendation ID"] - 1
    ] = id;

    row[
        cols["Created Date"] - 1
    ] = new Date();

    row[
        cols["Recommendation"] - 1
    ] = data.recommendation;

    row[
        cols["Confidence"] - 1
    ] = Number(
        data.confidence || 0
    );

    row[
        cols["Status"] - 1
    ] = "PENDING";

    row[
        cols["Outcome"] - 1
    ] = "";

    sheet.appendRow(row);

    return createJsonResponse({
        success: true
    });
}

function updateAdvisorMemory(data) {

    const sheet =
        getModeSheet(
            SHEET_ADVISOR_MEMORY,
            data.mode
        );

    const cols =
        getColumnIndexMap(
            SHEET_ADVISOR_MEMORY,
            data.mode
        );

    const values =
        sheet.getDataRange().getValues();

    const idCol =
        cols["Recommendation ID"] - 1;

    for (let i = 1; i < values.length; i++) {

        if (
            String(values[i][idCol]).trim() ===
            String(data.recommendationId).trim()
        ) {

            if (cols["Status"]) {

                sheet.getRange(
                    i + 1,
                    cols["Status"]
                ).setValue(
                    data.status
                );
            }

            if (
                cols["Outcome"] &&
                data.outcome
            ) {

                sheet.getRange(
                    i + 1,
                    cols["Outcome"]
                ).setValue(
                    data.outcome
                );
            }

            return createJsonResponse({
                success: true
            });
        }
    }

    return createJsonResponse({
        success: false,
        error: "Recommendation not found"
    });
}

/* ===================================================
    4. WRITE & UPDATE OPERATIONS
=================================================== */
function addTransaction(data) {

  const sheet =
      getModeSheet(
          SHEET_TRANSACTIONS,
          data.mode
      );
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet not found" });

  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return createJsonResponse({ success: false, error: "Sheet is empty or missing headers." });
  }

  const id = generateUUID();
  const cols =
      getColumnIndexMap(
          SHEET_TRANSACTIONS,
          data.mode
      );
  
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
      getAccountNameById(
          txAccountId,
          data.mode
      );

  const txTransferToId =
      data.transferToAccount ||
      data["Transfer To Account"] ||
      "";

  const txTransferToName =
      getAccountNameById(
          txTransferToId,
          data.mode
      );

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

  const sheet =
      getModeSheet(
          SHEET_TRANSACTIONS,
          data.mode
      );
  const txAccountId =
      data.account || "";

  const txAccountName =
      getAccountNameById(
          txAccountId,
          data.mode
      );

  const txTransferToId =
      data.transferToAccount || "";

  const txTransferToName =
      getAccountNameById(
          txTransferToId,
          data.mode
      );
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet not found" });

  if (!data.id) {
    return createJsonResponse({ success: false, error: "Missing Transaction ID" });
  }

  const cols =
      getColumnIndexMap(
          SHEET_TRANSACTIONS,
          data.mode
      );
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

  const sheet =
      getModeSheet(
          SHEET_TRANSACTIONS,
          data.mode
      );
  if (!sheet) return createJsonResponse({ success: false, error: "Sheet not found" });

  if (!data.id) {
    return createJsonResponse({ success: false, error: "Missing Transaction ID" });
  }

  const cols =
      getColumnIndexMap(
          SHEET_TRANSACTIONS,
          data.mode
      );
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


function addCategory(request) {
  const sheet =
      getModeSheet(
          SHEET_CATEGORIES,
          request.mode
      );

  const cols =
      getColumnIndexMap(
          SHEET_CATEGORIES,
          request.mode
      );

  const row = new Array(sheet.getLastColumn()).fill("");
  const categoryId = "CAT" + Date.now();

  row[cols["Category ID"] - 1] = categoryId;
  row[cols["Budget Type"] - 1] = request.budgetType;
  row[cols["Group"] - 1] = request.group;
  row[cols["Category Name"] - 1] = request.categoryName;
  const fundingSourceId =
      request.preferredFundingSource || "";

  const fundingSourceName =
      getAccountNameById(
          fundingSourceId,
          request.mode
      );

  if (cols["Preferred Funding Source"]) {
      row[cols["Preferred Funding Source"] - 1] =
          fundingSourceName;
  }

  if (cols["Preferred Funding Source ID"]) {
      row[cols["Preferred Funding Source ID"] - 1] =
          fundingSourceId;
  }

  sheet.appendRow(row);
  return createJsonResponse({ success: true });
}

function deleteCategory(request) {
  const categoryId = request.categoryId;
  if (!categoryId) return createJsonResponse({ success: false, message: "Category ID required" });

  let categoryName = "";

  // Remove category from Categories sheet
  const categorySheet =
    getModeSheet(
        SHEET_CATEGORIES,
        request.mode
    );
  if (categorySheet) {
    const cols =
    getColumnIndexMap(
        SHEET_CATEGORIES,
        request.mode
    );
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

  return createJsonResponse({ success: true });
}

function addRecurringBill(params) {
  const sheet =
      getModeSheet(
          SHEET_RECURRING,
          params.mode
      );

  const cols =
      getColumnIndexMap(
          SHEET_RECURRING,
          params.mode
      );

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
  const accountName =
      getAccountNameById(
          accountId,
          params.mode
      );

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

  const sheet =
      getModeSheet(
          SHEET_RECURRING,
          request.mode
      );

  if (!sheet) return { success: false, message: "Sheet not found" };

  const cols =
      getColumnIndexMap(
          SHEET_RECURRING,
          request.mode
      );
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
  const sheet =
      getModeSheet(
          SHEET_RECURRING,
          request.mode
      );

  const cols =
      getColumnIndexMap(
          SHEET_RECURRING,
          request.mode
      );
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

function generateBills(mode) {

  const recurringBills =
      getRecurringBills(mode);

  const transactions =
      getTransactions(mode);

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
        mode: mode,
        date: Utilities.formatDate(
            today,
            Session.getScriptTimeZone(),
            "yyyy-MM-dd"
        ),
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

function getColumnIndexMap(
    sheetName,
    mode
) {

  const sheet =
      getModeSheet(
          sheetName,
          mode
      );

  if (!sheet) return {};

  const headers =
      sheet
          .getRange(
              1,
              1,
              1,
              sheet.getLastColumn()
          )
          .getValues()[0];

  const map = {};

  headers.forEach(
      (header, index) => {

          map[
              String(header).trim()
          ] = index + 1;

      }
  );

  return map;
}

function getSheetObjects(
    sheetName,
    mode
) {

  const sheet =
      getModeSheet(
          sheetName,
          mode
      );

  if (!sheet) return [];

  const data =
      sheet
          .getDataRange()
          .getValues();

  if (data.length <= 1)
      return [];

  const headers =
      data.shift();

  return data.map(row => {

      const obj = {};

      headers.forEach(
          (header, index) => {

              obj[
                  String(header).trim()
              ] = row[index];

          }
      );

      return obj;

  });
}

function getAccountById(
      accountId,
      mode
  ) {

  const accounts =
      getAccounts(mode);

  return accounts.find(acc =>
    String(acc.accountId).trim() ===
    String(accountId).trim()
  );
}

function getAccountNameById(accountId,mode) {
  const account = getAccountById(accountId,mode);

  return account
    ? account.accountName
    : "";
}

function getModeSheet(
    sheetName,
    mode
) {

    return getSpreadsheet(
        mode
    ).getSheetByName(
        sheetName
    );
}

function getGoalStatus(goal) {

  if (
      goal.status === "ARCHIVED"
  ) {
      return "ARCHIVED";
  }

  if (
      Number(goal.current) >=
      Number(goal.target)
  ) {
      return "GRADUATED";
  }

  return "ACTIVE";
}


// Global entry points exposed to Apps Script UI & Execution Menu
function resetAndSeedGoldenDataset() {
  GoldenDatasetSeederModule.resetAndSeed();
}

function seedGoldenData() {
  GoldenDatasetSeederModule.seed();
}
