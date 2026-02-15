// ===== RECOVERY DASHBOARD — GOOGLE SHEETS BACKEND =====
// Paste this into Google Apps Script (Extensions → Apps Script)
// Then Deploy → New Deployment → Web App → Execute as: Me, Access: Anyone

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var type = payload.type;
    var data = payload.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Get or create the sheet tab
    var sheet = ss.getSheetByName(type);
    if (!sheet) {
      sheet = ss.insertSheet(type);
      // Add headers based on type
      var headers = getHeaders(type);
      if (headers.length > 0) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
    }

    // Append the row
    var row = buildRow(type, data);
    if (row.length > 0) {
      sheet.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getHeaders(type) {
  switch (type) {
    case 'Medications':
      return ['Date', 'Time', 'Medication', 'Generic', 'Dose #'];
    case 'Temperature':
      return ['Date', 'Time', 'Reading (°F)', 'Status'];
    case 'Drain Output':
      return ['Date', 'Time', 'Left Bottom (mL)', 'Left Top (mL)', 'Right Side (mL)'];
    case 'Wound Care':
      return ['Date', 'Time', 'Item', 'Status'];
    case 'Breathing Exercises':
      return ['Date', 'Time', 'Count'];
    case 'Notes':
      return ['Date', 'Time', 'Note'];
    case 'Questions':
      return ['Date', 'Time', 'Question', 'Action'];
    default:
      return ['Date', 'Time', 'Data'];
  }
}

function buildRow(type, data) {
  var now = new Date();
  var date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'MM/dd/yyyy');
  var time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'h:mm a');

  // If the data includes its own timestamp, use that instead
  if (data.timestamp) {
    var ts = new Date(data.timestamp);
    date = Utilities.formatDate(ts, Session.getScriptTimeZone(), 'MM/dd/yyyy');
    time = Utilities.formatDate(ts, Session.getScriptTimeZone(), 'h:mm a');
  }

  switch (type) {
    case 'Medications':
      return [date, time, data.medication || '', data.generic || '', data.doseNumber || ''];
    case 'Temperature':
      return [date, time, data.reading || '', data.status || ''];
    case 'Drain Output':
      return [date, time, data.leftBottom || '0', data.leftTop || '0', data.right || '0'];
    case 'Wound Care':
      return [date, time, data.item || '', data.status || ''];
    case 'Breathing Exercises':
      return [date, time, data.count || 0];
    case 'Notes':
      return [date, time, data.note || ''];
    case 'Questions':
      return [date, time, data.question || '', data.action || 'added'];
    default:
      return [date, time, JSON.stringify(data)];
  }
}

// ===== RUN THIS ONCE TO CLEAN UP =====
// Go to the function dropdown at top, select "cleanupAllSheets", click Run
function cleanupAllSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  for (var i = 0; i < sheets.length; i++) {
    var sheetName = sheets[i].getName();
    // Skip the default Sheet1
    if (sheetName === 'Sheet1') continue;

    // Delete the tab — it'll be recreated fresh when new data comes in
    ss.deleteSheet(sheets[i]);
  }

  Logger.log('All data tabs cleared. They will be recreated automatically when new entries are logged.');
}
