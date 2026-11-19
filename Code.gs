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
        return createJsonResponse(getTransactions(params.mode));
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
      case "markGoalFunded":
          return markGoalFunded(params);
      case "graduateGoal":
          return graduateGoal(params);
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
      case "updateCategory":
          return updateCategory({
              mode: params.mode,
              categoryId: params.categoryId,
              budgetType: params.budgetType,
              group: params.group,
              categoryName: params.categoryName,
              preferredFundingSource: params.preferredFundingSource
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
                  billName: params.billName,
                  commitmentType: params.commitmentType,
                  budgetType: params.budgetType,
                  budgetPosition: params.budgetPosition,
                  amountType: params.amountType,
                  amount: params.amount,
                  dueDay: params.dueDay,
                  account: params.account
              })
          );
      case "generateBills":
        return createJsonResponse(
            generateBills(params.mode)
        );
      case "generateSingleBill":
          return createJsonResponse(
              generateSingleBill(params)
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

      target:
          target,

      current:
          current,

      monthlyContribution:
          Number(
              row["Monthly Contribution"] || 0
          ),

      goalMode:
          row["Goal Mode"] || "VIRTUAL",

      protectionRole:
          row["Protection Role"] || "OPTIONAL",

      goalAccountId:
          row["Goal Account ID"] || "",

      status:
          row["Status"] || "ACTIVE",

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

  if (cols["Goal Mode"])
      row[cols["Goal Mode"] - 1] =
          data.goalMode || "VIRTUAL";

  if (cols["Protection Role"])
      row[cols["Protection Role"] - 1] =
          data.protectionRole || "OPTIONAL";

  if (cols["Goal Account ID"])
      row[cols["Goal Account ID"] - 1] =
          data.goalAccountId || "";

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

  if (cols["Goal Mode"]) {
      sheet.getRange(
          rowIndex,
          cols["Goal Mode"]
      ).setValue(
          data.goalMode || "VIRTUAL"
      );
  }

  if (cols["Protection Role"]) {
      sheet.getRange(
          rowIndex,
          cols["Protection Role"]
      ).setValue(
          data.protectionRole || "OPTIONAL"
      );
  }

  if (cols["Goal Account ID"]) {
      sheet.getRange(
          rowIndex,
          cols["Goal Account ID"]
      ).setValue(
          data.goalAccountId || ""
      );
  }

  const calculatedStatus =
      getGoalStatus({
          current: data.current || 0,
          target: data.target || 0,
          status: data.status || "ACTIVE"
      });

  if (cols["Status"]) {
      sheet.getRange(
          rowIndex,
          cols["Status"]
      ).setValue(
          calculatedStatus
      );
  }

  return createJsonResponse({
      success: true
  });
}

function markGoalFunded(data) {

    const sheet =
        getModeSheet(
            SHEET_GOALS,
            data.mode
        );

    const cols =
        getColumnIndexMap(
            SHEET_GOALS,
            data.mode
        );

    const values =
        sheet.getDataRange().getValues();

    const idCol =
        cols["Goal ID"] - 1;

    for (let i = 1; i < values.length; i++) {

        if (
            String(values[i][idCol]).trim() ===
            String(data.goalId).trim()
        ) {

            sheet.getRange(
                i + 1,
                cols["Status"]
            ).setValue("FUNDED");

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

function graduateGoal(data) {

    const sheet =
        getModeSheet(
            SHEET_GOALS,
            data.mode
        );

    const cols =
        getColumnIndexMap(
            SHEET_GOALS,
            data.mode
        );

    const values =
        sheet.getDataRange().getValues();

    const idCol =
        cols["Goal ID"] - 1;

    for (let i = 1; i < values.length; i++) {

        if (
            String(values[i][idCol]).trim() ===
            String(data.goalId).trim()
        ) {

            sheet.getRange(
                i + 1,
                cols["Status"]
            ).setValue("GRADUATED");

            if (cols["Graduated Date"]) {
                sheet.getRange(
                    i + 1,
                    cols["Graduated Date"]
                ).setValue(new Date());
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

/**
 * UPDATE: Edits account details or balance with environment mode support
 */
function updateAccount(data) {
  const mode = data.mode;
  const sheet = getModeSheet(SHEET_ACCOUNTS, mode);
  if (!sheet) return createJsonResponse({ success: false, error: "Accounts sheet not found" });

  const accountId = String(data.accountId || data.id || "").trim();
  if (!accountId) return createJsonResponse({ success: false, error: "Missing Account ID" });

  const cols = getColumnIndexMap(SHEET_ACCOUNTS, mode);
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

  const accountName = data.name !== undefined ? data.name : data.accountName;
  if (cols["Account Name"] && accountName !== undefined) {
    sheet.getRange(rowIndex, cols["Account Name"]).setValue(accountName);
  }
  if (cols["Net Worth Type"] && data.netWorthType !== undefined) {
    sheet.getRange(rowIndex, cols["Net Worth Type"]).setValue(data.netWorthType);
  }
  if (cols["Type"] && data.type !== undefined) {
    sheet.getRange(rowIndex, cols["Type"]).setValue(data.type);
  }
  if (cols["Asset Class"] && data.assetClass !== undefined) {
    sheet.getRange(rowIndex, cols["Asset Class"]).setValue(data.assetClass);
  }
  if (cols["Opening Balance"] && data.openingBalance !== undefined) {
    sheet.getRange(rowIndex, cols["Opening Balance"]).setValue(Number(data.openingBalance));
  }
  if (cols["Current Balance"] && data.currentBalance !== undefined) {
    sheet.getRange(rowIndex, cols["Current Balance"]).setValue(Number(data.currentBalance));
  }
  if (cols["Protected"] && data.protected !== undefined) {
    sheet.getRange(
      rowIndex,
      cols["Protected"]
    ).setValue(
      String(data.protected) === "true" ||
      data.protected === true
    );
  }

  if (cols["Minimum Balance"] && data.minimumBalance !== undefined) {
    sheet.getRange(
      rowIndex,
      cols["Minimum Balance"]
    ).setValue(
      Number(data.minimumBalance)
    );
  }

  return createJsonResponse({ success: true, accountId: accountId });
}

/**
 * DELETE: Soft delete with cascade safety check for linked Goals & Recurring Bills
 */
function deleteAccount(data) {
  const mode = data.mode;
  const sheet = getModeSheet(SHEET_ACCOUNTS, mode);
  if (!sheet) return createJsonResponse({ success: false, error: "Accounts sheet not found" });

  const accountId = String(data.accountId || data.id || "").trim();
  if (!accountId) return createJsonResponse({ success: false, error: "Missing Account ID" });

  // 1. Dependency / Cascade Check (Recurring Bills & Goals)
  const linkedDependencies = checkAccountDependencies(accountId, mode);
  if (linkedDependencies.hasDependencies && !data.forceDelete) {
    return createJsonResponse({
      success: false,
      requiresConfirmation: true,
      message: `Account is linked to ${linkedDependencies.summary}. Please confirm deletion or reassign.`,
      dependencies: linkedDependencies
    });
  }

  // 2. Locate and Soft Delete Account
  const cols = getColumnIndexMap(SHEET_ACCOUNTS, mode);
  const idColIndex = cols["Account ID"] - 1;
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idColIndex]).trim() === accountId) {
      if (cols["Active"]) {
        sheet.getRange(i + 1, cols["Active"]).setValue("No"); // Soft delete
      } else {
        sheet.deleteRow(i + 1); // Hard delete fallback
      }
      return createJsonResponse({ success: true, deletedAccountId: accountId });
    }
  }

  return createJsonResponse({ success: false, error: "Account ID not found" });
}

/**
 * HELPER: Checks for active dependencies before deletion
 */
function checkAccountDependencies(accountId, mode) {
  let linkedBillsCount = 0;
  let linkedGoalsCount = 0;

  // Check Recurring Bills using SHEET_RECURRING constant
  const billsSheet = getModeSheet(SHEET_RECURRING, mode);
  if (billsSheet) {
    const cols = getColumnIndexMap(SHEET_RECURRING, mode);
    if (cols["Account ID"]) {
      const values = billsSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][cols["Account ID"] - 1]).trim() === String(accountId).trim()) {
          linkedBillsCount++;
        }
      }
    }
  }

  // Check Goals
  const goalsSheet = getModeSheet(SHEET_GOALS, mode);
  if (goalsSheet) {
    const cols = getColumnIndexMap(SHEET_GOALS, mode);
    const idCol = cols["Goal Account ID"] || cols["Account ID"] || cols["Preferred Funding Source ID"];
    if (idCol) {
      const values = goalsSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idCol - 1]).trim() === String(accountId).trim()) {
          linkedGoalsCount++;
        }
      }
    }
  }

  const parts = [];
  if (linkedBillsCount > 0) parts.push(`${linkedBillsCount} recurring bill(s)`);
  if (linkedGoalsCount > 0) parts.push(`${linkedGoalsCount} goal(s)`);

  return {
    hasDependencies: parts.length > 0,
    linkedBillsCount,
    linkedGoalsCount,
    summary: parts.join(" and ")
  };
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



function getRecurringBills(mode)
{
    return getSheetObjects(SHEET_RECURRING, mode)
        .map(row => ({
            billId: row["Bill ID"] || "",
            billName: row["Bill Name"] || "",
            commitmentType:
                row["Commitment Type"] || "BILL",
            budgetType:
                row["Budget Type"] || "",
            budgetPosition:
                row["Budget Position"] || "",
            amountType:
                row["Amount Type"] || "",
            defaultAmount:
                Number(row["Default Amount"] || 0),
            dueDay:
                Number(row["Due Day"] || 0),

            account:
                row["Account"] || "",

            accountId:
                row["Account ID"] || "",

            transferToAccount:
                row["Transfer To Account"] || "",

            transferToAccountId:
                row["Transfer To Account ID"] || "",

            active:
                row["Active"]
        }));
}

function generateSingleBill(params)
{
    const mode = params.mode;
    const billId = params.billId;

    const bill = getRecurringBills(mode)
        .find(b => b.billId === billId);

    if (!bill)
    {
        throw new Error(
            "Bill not found: " + billId
        );
    }

    let transferToAccount = "";
    let transferToAccountId = "";

    // Debt commitments should reduce a liability account
    if (bill.commitmentType === "DEBT")
    {
        const liabilityAccount =
            getAccounts(mode)
                .find(a =>
                    a.assetClass === bill.budgetPosition
                );

        if (liabilityAccount)
        {
            transferToAccount =
                liabilityAccount.accountName || "";

            transferToAccountId =
                liabilityAccount.accountId || "";
        }
    }

    const today = new Date();

    addTransaction({
        mode: mode,
        date: Utilities.formatDate(
            today,
            Session.getScriptTimeZone(),
            "yyyy-MM-dd"
        ),
        amount: bill.defaultAmount,
        details: bill.billName,
        account: bill.accountId,
        budgetType: bill.budgetType,
        budgetPosition: bill.budgetPosition,
        transferToAccount: transferToAccount,
        transferToAccountId: transferToAccountId,
        recurringBillId: bill.billId
    });

    return {
        success: true
    };
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
    data.transferToAccountId ||
    data.transferToAccount ||
    data["Transfer To Account ID"] ||
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

function updateCategory(request) {

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

    const values =
        sheet.getDataRange().getValues();

    const idCol =
        cols["Category ID"] - 1;

    for (let i = 1; i < values.length; i++) {

        if (
            String(values[i][idCol]).trim() ===
            String(request.categoryId).trim()
        ) {

            sheet.getRange(
                i + 1,
                cols["Budget Type"]
            ).setValue(request.budgetType);

            sheet.getRange(
                i + 1,
                cols["Group"]
            ).setValue(request.group);

            sheet.getRange(
                i + 1,
                cols["Category Name"]
            ).setValue(request.categoryName);

            const fundingSourceId =
                request.preferredFundingSource || "";

            const fundingSourceName =
                getAccountNameById(
                    fundingSourceId,
                    request.mode
                );

            if (cols["Preferred Funding Source"]) {
                sheet.getRange(
                    i + 1,
                    cols["Preferred Funding Source"]
                ).setValue(
                    fundingSourceName
                );
            }

            if (cols["Preferred Funding Source ID"]) {
                sheet.getRange(
                    i + 1,
                    cols["Preferred Funding Source ID"]
                ).setValue(
                    fundingSourceId
                );
            }

            return createJsonResponse({
                success: true
            });
        }
    }

    return createJsonResponse({
        success: false,
        error: "Category not found"
    });
}

function checkCategoryDependencies(
    categoryName,
    mode
) {

    let transactionCount = 0;
    let recurringBillCount = 0;

    const transactions =
        getTransactions(mode);

    transactionCount =
        transactions.filter(tx =>
            String(
                tx["Budget Position"] ||
                tx.budgetPosition ||
                ""
            ).trim() ===
            String(categoryName).trim()
        ).length;

    const bills =
        getRecurringBills(mode);

    recurringBillCount =
        bills.filter(bill =>
            String(
                bill.budgetPosition || ""
            ).trim() ===
            String(categoryName).trim()
        ).length;

    return {
        hasDependencies:
            transactionCount > 0 ||
            recurringBillCount > 0,
        transactionCount,
        recurringBillCount
    };
}

function deleteCategory(request) {

    const categoryId =
        request.categoryId;

    if (!categoryId) {
        return createJsonResponse({
            success: false,
            message:
                "Category ID required"
        });
    }

    const categorySheet =
        getModeSheet(
            SHEET_CATEGORIES,
            request.mode
        );

    if (!categorySheet) {
        return createJsonResponse({
            success: false,
            message:
                "Categories sheet not found"
        });
    }

    const cols =
        getColumnIndexMap(
            SHEET_CATEGORIES,
            request.mode
        );

    const catData =
        categorySheet
            .getDataRange()
            .getValues();

    const idCol =
        cols["Category ID"] - 1;

    const nameCol =
        cols["Category Name"] - 1;

    let categoryName = "";

    for (
        let i = 1;
        i < catData.length;
        i++
    ) {

        if (
            String(
                catData[i][idCol]
            ).trim() ===
            String(categoryId).trim()
        ) {

            categoryName =
                catData[i][nameCol];

            break;
        }
    }

    if (!categoryName) {

        return createJsonResponse({
            success: false,
            message:
                "Category not found"
        });

    }

    const dependencies =
        checkCategoryDependencies(
            categoryName,
            request.mode
        );

    if (
        dependencies.hasDependencies
    ) {

        return createJsonResponse({
            success: false,
            requiresConfirmation: true,
            message:
                `Category is used by ${
                    dependencies.transactionCount
                } transaction(s) and ${
                    dependencies.recurringBillCount
                } recurring bill(s).`,
            dependencies
        });

    }

    const header =
        catData[0];

    const filtered =
        catData
            .slice(1)
            .filter(row =>
                row[idCol] !==
                categoryId
            );

    const updated = [
        header,
        ...filtered
    ];

    categorySheet.clearContents();

    categorySheet
        .getRange(
            1,
            1,
            updated.length,
            updated[0].length
        )
        .setValues(updated);

    return createJsonResponse({
        success: true
    });
}

function generateRecurringBillId(mode) {

    const bills =
        getRecurringBills(mode);

    let highest = 0;

    bills.forEach(bill => {

        const match =
            String(bill.billId || "")
                .match(/^RB(\d+)$/);

        if (match) {

            highest = Math.max(
                highest,
                Number(match[1])
            );
        }
    });

    return `RB${String(
        highest + 1
    ).padStart(3, "0")}`;
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
  const billId =
    generateRecurringBillId(
        params.mode
    );

  row[cols["Bill ID"] - 1] = billId;
  row[cols["Bill Name"] - 1] = params.billName;
    if (cols["Commitment Type"]) {
        row[cols["Commitment Type"] - 1] =
            params.commitmentType || "BILL";
    }
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
    return {
      success: false,
      message: "Missing Bill ID"
    };
  }

  const sheet =
      getModeSheet(
          SHEET_RECURRING,
          request.mode
      );

  if (!sheet) {
    return {
      success: false,
      message: "Sheet not found"
    };
  }

  const cols =
      getColumnIndexMap(
          SHEET_RECURRING,
          request.mode
      );

  const values =
      sheet.getDataRange().getValues();

  const billIdCol =
      cols["Bill ID"] - 1;

  for (let i = 1; i < values.length; i++) {

    if (
      String(values[i][billIdCol]).trim() ===
      String(request.billId).trim()
    ) {

      const row = i + 1;

      if (cols["Bill Name"]) {
        sheet.getRange(
          row,
          cols["Bill Name"]
        ).setValue(
          request.billName || ""
        );
      }

      if (cols["Commitment Type"]) {
        sheet.getRange(
          row,
          cols["Commitment Type"]
        ).setValue(
          request.commitmentType || "BILL"
        );
      }

      if (cols["Budget Type"]) {
        sheet.getRange(
          row,
          cols["Budget Type"]
        ).setValue(
          request.budgetType || ""
        );
      }

      if (cols["Budget Position"]) {
        sheet.getRange(
          row,
          cols["Budget Position"]
        ).setValue(
          request.budgetPosition || ""
        );
      }

      if (cols["Amount Type"]) {
        sheet.getRange(
          row,
          cols["Amount Type"]
        ).setValue(
          request.amountType || ""
        );
      }

      if (cols["Default Amount"]) {
        sheet.getRange(
          row,
          cols["Default Amount"]
        ).setValue(
          Number(request.amount || 0)
        );
      }

      if (cols["Due Day"]) {
        sheet.getRange(
          row,
          cols["Due Day"]
        ).setValue(
          Number(request.dueDay || 0)
        );
      }

      const accountId =
          request.account || "";

      const accountName =
          getAccountNameById(
              accountId,
              request.mode
          );

      if (cols["Account"]) {
        sheet.getRange(
          row,
          cols["Account"]
        ).setValue(
          accountName
        );
      }

      if (cols["Account ID"]) {
        sheet.getRange(
          row,
          cols["Account ID"]
        ).setValue(
          accountId
        );
      }

      return {
        success: true
      };
    }
  }

  return {
    success: false,
    message: "Bill not found"
  };
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

  const current =
      Number(goal.current || 0);

  const target =
      Number(goal.target || 0);

  const status =
      String(
          goal.status || ""
      ).toUpperCase();

  if (status === "ARCHIVED") {

      return "ARCHIVED";

  }

  if (status === "GRADUATED") {

      return "GRADUATED";

  }

  if (
      target > 0 &&
      current >= target
  ) {

      return "FUNDED";

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
