const extract = require("extract-zip");
const fs = require("fs");
const path = require("path");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const OUTPUT_DIR = process.argv[3] || process.cwd() + "/output";
const CSV_FILE = process.cwd() + "/file.csv";

const csvWriter = createCsvWriter({
  path: CSV_FILE,
  header: [
    { id: "folder", title: "FOLDER" },
    { id: "xml1", title: "XML1" },
    { id: "xml2", title: "XML2" },
    { id: "xml3", title: "XML3" },
    { id: "xml4", title: "XML4" },
    { id: "xml5", title: "XML5" },
    { id: "xml6", title: "XML6" },
  ],
});

async function main() {
  const source = process.argv[2];
  const target = OUTPUT_DIR;

  await extractZip(source, target);
  await unzipFiles(OUTPUT_DIR);
  console.log("----------UNZIP SUCCESSFULL-----------");
  const xmlZipFiles = getAllFiles(OUTPUT_DIR, []);
  const records = createDataSet(xmlZipFiles);
  writeToCSV(records);
}

async function extractZip(source, target) {
  try {
    await extract(source, { dir: target });
    console.log("Extraction complete");
  } catch (err) {
    console.log("Oops: extractZip failed", err);
  }
}

const zippedFiles = [];

const unzipFiles = async function (dirPath) {
  const files = fs.readdirSync(dirPath);

  await Promise.all(
    files.map(async (file) => {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        await unzipFiles(dirPath + "/" + file);
      } else {
        const fullFilePath = path.join(dirPath, "/", file);
        const folderName = file.replace(".zip", "");
        if (file.endsWith(".zip")) {
          zippedFiles.push(folderName);
          await extractZip(fullFilePath, path.join(dirPath, "/", folderName));
          await unzipFiles(path.join(dirPath, "/", folderName));
        }
      }
    })
  );
};

const getAllFiles = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      const fullFilePath = path.join(dirPath, "/", file);
      if (file.endsWith(".xml")) {
        arrayOfFiles.push(fullFilePath);
        fullFilePath;
      }
      if (file.endsWith(".zip")) {
        arrayOfFiles.push(file);
      }
    }
  });
  return arrayOfFiles;
};

function createDataSet(filesArray) {
  const records = [];
  filesArray.forEach((file, index) => {
    if (file.endsWith(".zip")) {
      if (filesArray[index - 1] && filesArray[index - 1].endsWith(".xml")) {
        let i = 1;
        const xmls = [];
        while (i <= 4) {
          if (filesArray[index - i].endsWith(".xml")) {
            xmls.push(filesArray[index - i]);
          }
          i++;
        }
        records.push({ folder: file, xmls });
      }
    }
  });
  return records;
}

async function writeToCSV(rawRecords) {
  const records = [];

  await rawRecords.map(async (r) => {
    const xmlObj = {};
    await Promise.all(
      r.xmls.map(async (xml, index) => {
        const data = await fs.promises.readFile(xml, "utf8");
        xmlObj["xml" + (index + 1)] = data;
      })
    );

    records.push({ folder: r.folder.replace(".zip", "").split("_")[1], ...xmlObj });
    await csvWriter.writeRecords(records);
  });
}

main();
