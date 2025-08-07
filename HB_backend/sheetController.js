const { google } = require("googleapis");

async function main() {
  // Load your service account key file
  const auth = new google.auth.GoogleAuth({
    keyFile: "healthboard-468113-21b330e524cc.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  // Get client to authorize requests
  const client = await auth.getClient();

  // Create Google Sheets API instance
  const sheets = google.sheets({ version: "v4", auth: client });

  // The ID of your Google Sheet
  const spreadsheetId = "19KOBwL1Oix323yJjFRVls8mf__w6dLjbfdXpcp3CO_A"; // replace with your sheet ID

  // The range to fetch
  const range = "ชีต1!D3:D9";

  // Fetch values
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  console.log("Sheet data:", res.data.values);
}

main().catch(console.error);
//รันด้วย node sheetController.js
