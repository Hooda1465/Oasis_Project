const express = require('express');
const axios = require('axios');
const unzipper = require('unzipper');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { pipeline } = require('stream/promises');
const { Readable, Writable } = require('stream');

const app = express();
const port = 3000;

const fileUrl = 'https://echo.epa.gov/files/echodownloads/SDWA_latest_downloads.zip';
const downloadDir = path.join(__dirname, 'downloads');
const zipcodeFilePath = path.join(downloadDir, 'zipcodes.csv');

// Serve the style.css file
app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'), {
        headers: {
            'Content-Type': 'text/css'
        }
    });
});

app.use(express.static(path.join(__dirname)));

let processRunning = false;
let processAbortController = null;

// Utility function to clear the downloads directory except the zipcode file
async function clearDownloadsDirectory() {
  try {
    const files = await fs.promises.readdir(downloadDir);
    await Promise.all(
      files
        .filter(file => file !== 'zipcodes.csv')
        .map(file => fs.promises.rm(path.join(downloadDir, file), { recursive: true, force: true }))
    );
  } catch (error) {
    console.error('Error clearing the downloads directory:', error);
  }
}
// Function to load zipcode data into memory and create a map
async function loadZipcodeData() {
  const zipcodeMap = new Map();
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipcodeFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const zipCity = row['CityName'] ? row['CityName'].toLowerCase() : '';
        const zipState = row['StateAbbr'] || '';
        const zipCode = row['ZIPCode'] || '';  
        const key = `${zipState}-${zipCity}`;
        zipcodeMap.set(key, zipCode);
      })
      .on('end', () => resolve(zipcodeMap))
      .on('error', (err) => reject(err));
  });
}

// Function to find a matching zipcode from the map
function findMatchingZipcode(zipcodeMap, stateServed, cityServed) {
  if (stateServed && cityServed) {
    const key = `${stateServed}-${cityServed.toLowerCase()}`;
    return zipcodeMap.get(key);
  }
  return undefined;
}

async function processCSV(entry, fileName, selectedFields, addZipcode = false, pwsidZipcodeMap = null, zipcodeMap = null) {
  const outputFilePath = path.join(downloadDir, fileName); //.replace('.csv', '_filtered.csv')
  const outputStream = fs.createWriteStream(outputFilePath);

  console.log('Processing file : ', fileName)

  // Write header to the output stream
  outputStream.write(selectedFields.join(',') + ',ZIPCODE' + '\n');

  const transformStream = new Writable({
    objectMode: true,
    write(row, encoding, callback) {
      let outputRow = selectedFields.map(field => row[field] || '');
      if (addZipcode) {
        const stateServed = row['STATE_SERVED'];
        const pwsid = row['PWSID'];
        const cityServed = row['CITY_SERVED'];
        if (stateServed && cityServed) {
          const matchingZip = findMatchingZipcode(zipcodeMap, stateServed, cityServed);
          if (matchingZip) {
            outputRow.push(matchingZip);
            pwsidZipcodeMap.set(pwsid, matchingZip);
          } else {
            return callback(); // Skip row if no matching zipcode
          }
        } else {
          return callback(); // Skip row if STATE_SERVED or CITY_SERVED is blank
        }
      }
      if ( (fileName === 'SDWA_LCR_SAMPLES.csv' || fileName === 'SDWA_VIOLATIONS_ENFORCEMENT.csv' ) && pwsidZipcodeMap) {
        const pwsid = row['PWSID'];
        const zipcode = pwsidZipcodeMap.get(pwsid) || '';
        if (zipcode) {
          outputRow.push(zipcode);
          outputStream.write(outputRow.join(',') + '\n');
        }
      } else if (!addZipcode || fileName !== 'SDWA_LCR_SAMPLES.csv') {
        if (addZipcode && !outputRow[outputRow.length - 1]) {
          return callback(); // Skip row if ZIPCODE field is blank
        }
        outputStream.write(outputRow.join(',') + '\n');
      }
      callback();
    }
  });

  try {
    await pipeline(
      entry,
      csv(),
      transformStream
    );
    outputStream.end();
    console.log(`Processed CSV file: ${fileName}`);
    return outputFilePath;
  } catch (err) {
    console.error('Error processing CSV file:', err);
    throw err;
  }
}

async function downloadAndProcessCSVs(url) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 1200000,
      signal: processAbortController.signal // handle abort
    });

    const zipcodeMap = await loadZipcodeData();
    const pwsidZipcodeMap = new Map();
    
    const filePaths = {};
    const processFiles = [
      { name: 'SDWA_GEOGRAPHIC_AREAS.csv', fields: ['PWSID', 'STATE_SERVED', 'CITY_SERVED'], addZipcode: true },
      { name: 'SDWA_LCR_SAMPLES.csv', fields: ['PWSID', 'SAMPLE_LAST_REPORTED_DATE', 'CONTAMINANT_CODE', 'RESULT_SIGN_CODE', 'SAMPLE_MEASURE', 'UNIT_OF_MEASURE'] },
      // { name: 'SDWA_VIOLATIONS_ENFORCEMENT.csv', fields: ['PWSID', 'VIOLATION_CATEGORY_CODE', 'CONTAMINANT_CODE', 'VIOLATION_STATUS','VIOL_LAST_REPORTED_DATE'] }
    ];

    let processedCount = 0;

    return new Promise((resolve, reject) => {
      const parseStream = response.data.pipe(unzipper.Parse());

      parseStream.on('entry', async (entry) => {
        const fileName = entry.path;
        const file = processFiles.find(f => f.name === fileName);

        if (file) {
          try {
            //file.name.replace('.csv', '_filtered.csv')
            filePaths[file.name] = await processCSV(entry, file.name, file.fields, file.addZipcode, pwsidZipcodeMap, zipcodeMap);
            processedCount++;
            if (processedCount === processFiles.length) {
              parseStream.emit('end'); // Manually emit 'end' event
            }
          } catch (err) {
            parseStream.emit('error', err); // Propagate error to the main stream
          }
        } else {
          entry.autodrain(); // Skip files not in the processFiles list
        }
      });

      parseStream.on('end', () => {
        resolve(filePaths);
      });

      parseStream.on('error', (err) => {
        console.error('Error with unzipper stream:', err);
        reject(err);
      });
    });
  } catch (err) {
    console.error('Error downloading and processing CSVs:', err);
    throw err;
  }
}

app.get('/process-data', async (req, res) => {
  if (processRunning) {
    return res.status(400).json({ message: 'Process is already running' });
  }

  processRunning = true;
  processAbortController = new AbortController();

  const startTime = new Date();

  try {

    await clearDownloadsDirectory();
    const filePaths = await downloadAndProcessCSVs(fileUrl);

    //Don't need to store 'SDWA_GEOGRAPHIC_AREAS.csv', so delete it from 
    if (filePaths['SDWA_GEOGRAPHIC_AREAS.csv']) {
      delete filePaths['SDWA_GEOGRAPHIC_AREAS.csv'];
    }

    // delete file, which don't need
    const files = await fs.promises.readdir(downloadDir);
    const fileToDelete = 'SDWA_GEOGRAPHIC_AREAS.csv';
    if (files.includes(fileToDelete)) {
      await fs.promises.rm(path.join(downloadDir, fileToDelete), { recursive: true, force: true });
    }
    
    console.log(filePaths)

    //Upload files to Google Cloud Storage
    // const bucketName = process.env.BUCKET_NAME;
    // const uploadPromises = Object.entries(filePaths).map(async ([key, filePath]) => {
    //   const mediaLink = await uploadFile(bucketName, filePath, key);
    //   return { [key]: mediaLink };
    // });

    // const uploadedFiles = await Promise.all(uploadPromises);

    const endTime = new Date();
    const timeTaken = endTime - startTime;
    console.log(`CSV processing completed in ${timeTaken} ms`);

    res.json({ downloadLinks : filePaths}); //uploadedFiles
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    processRunning = false;
    processAbortController = null;
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
