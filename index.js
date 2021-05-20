const extract = require("extract-zip");

async function main() {
  const source = process.argv[2];
  const target = process.argv[3];

  await extractZip(source, target);
}

async function extractZip(source, target) {
  try {
    await extract(source, { dir: target });
    console.log("Extraction complete");
  } catch (err) {
    console.log("Oops: extractZip failed", err);
    // handle any errors
  }
}

main();
