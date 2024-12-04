import * as SQLite from "expo-sqlite/legacy";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
//Connection is initialised globally
const db = SQLite.openDatabase("DatabaseName.db");


export function initDatabase(db: SQLite.Database) {
  console.log("started");
  db.transaction((tx) => {
    tx.executeSql(
      "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT);",
      [],
        (_txObj: SQLite.SQLTransaction, _resultSet: SQLite.SQLResultSet) => {
          console.log("Succuessinit");
        },
        (_txObj: SQLite.SQLTransaction, error: SQLite.SQLError) => {
          console.log(error);
          return false;
        }
      );
  });
};


export function dropTable(db:SQLite.Database){
  db.transaction((tx) => {
    tx.executeSql(
      "DROP TABLE IF EXISTS DEBUG;",
      [],
        (_txObj: SQLite.SQLTransaction, _resultSet: SQLite.SQLResultSet) => {
          console.log("Succully Dropped table");
        },
        (_txObj: SQLite.SQLTransaction, error: SQLite.SQLError) => {
          console.log(error);
          return false;
        }
      );
  });
};


export function insertData(db: SQLite.Database, data: any){
  console.log("started");
  db.transaction((tx) => {
    console.log("transaction started");
    tx.executeSql(
      "INSERT INTO todos (title) VALUES (?)",
      [data],
        (txObj: SQLite.SQLTransaction, resultSet: SQLite.SQLResultSet) => {
          console.log(resultSet);
          console.log("SuccuessInsert");
        },
        (txObj: SQLite.SQLTransaction, error: SQLite.SQLError) => {
          console.log(error);
          return false;
        }
      );
  });
};


export function selectAllDataInTable(db: SQLite.Database): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM todos;",
        [],
        (txObj: SQLite.SQLTransaction, resultSet: SQLite.SQLResultSet) => {
          console.log("Success: Query executed");
          resolve(resultSet); // Resolve the promise with the result set
        },
        (txObj: SQLite.SQLTransaction, error: SQLite.SQLError) => {
          console.log("Error: ", error);
          reject(error); // Reject the promise with the error
          return false;
        }
      );
    });
  });
}



export const convertToCSV = (sqlResult: SQLite.SQLResultSet) => {
  const data: any[] = [];

  sqlResult.rows._array.forEach(row => {
    console.log(row);
    data.push(row); 
  });

  // Get headers for the CSV
  const headers = Object.keys(data[0]);
  const headerString = headers.join(",");

  // Map each object to a CSV row by joining its values
  const rows = data.map(obj => Object.values(obj).join(","));

  // Combine headers and rows into a single CSV string
  const csvString = [headerString, ...rows].join("\n");

  return csvString;
};

export const saveCSVFile = async (csvData: any) => {
  const fileUri = FileSystem.documentDirectory + 'table_data.csv';
  console.log(fileUri);
  await FileSystem.writeAsStringAsync(fileUri, csvData);
  return fileUri;
};

export const shareFile = async (fileUri: any) => {
  await Sharing.shareAsync(fileUri);
};


export const exportTableToCSV = async (db: SQLite.SQLiteDatabase) => {
  try {
    const tableData = await selectAllDataInTable(db);
    const csvData = convertToCSV(tableData);
    const fileUri = await saveCSVFile(csvData);
    await shareFile(fileUri);
  } catch (error) {
    console.error('Error exporting table to CSV: ', error);
  }
};

export default db;
