/src
  ├── /apps-script          # Backend (Google Apps Script)
  │   ├── Code.js           # API Entry point & doGet/doPost routes
  │   ├── Transactions.js   # Transaction CRUD operations
  │   └── Budgets.js        # Budget & Goals logic
  └── /frontend             # SPA Frontend
      ├── index.html        # Clean UI scaffold (no inline styles/scripts)
      ├── /css
      │   └── styles.css    # Modular CSS rules
      └── /js
          ├── api.js        # google.script.run wrappers & fetch calls
          ├── state.js      # Global state management & local updates
          └── ui.js         # DOM manipulation & event handlers
