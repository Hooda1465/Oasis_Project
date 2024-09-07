
// Element references
const processingMessage = document.getElementById('processingMessage');
const doneMessage = document.getElementById('doneMessage');
const inputAdmin = document.getElementById("inputAdmin");
const btnAdmin = document.getElementById("btnAdmin");
const adminAccessBtn = document.getElementById("adminAccessBtn");
const pTag = document.getElementById("pTag");
const uploadBox = document.getElementById("uploadBox");
const uploadData = document.getElementById("uploadData");
const downloadData = document.getElementById("downloadData");
const flexCheckDefault = document.getElementById("flexCheckDefault");
const imgDiv = document.getElementById("imgDiv");
const zipCode = document.getElementById("zipVal");
const searchBtn = document.getElementById("searchZip");
const table1 = document.getElementById("table1");
const table2 = document.getElementById("table2");
const hrTag = document.getElementById("hrTag");
const table1Con = document.getElementById("table1Con");
const table2Vio = document.getElementById("table2Vio");
const errorMsg = document.getElementById("errorMsg");
const downloadTemplate=document.getElementById("downloadTemplate");

// Event listeners
searchBtn.addEventListener("click", printVal);

document.getElementById('processDataBtn').addEventListener('click', function() {
    processingMessage.style.display = 'block';
    processingMessage.textContent = 'Processing. Please Wait...'; // Ensure this text appears initially

    fetch('/process-data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.downloadLinks && Object.keys(data.downloadLinks).length > 0) {
                let linksHTML = '<p>Data processed successfully! Here are your file links to download or access:</p>';                    
                // Base path to remove
                const basePathToRemove = 'root/Centrix-Engine-/';
            
                // Iterate over the keys and values of the downloadLinks object
                Object.entries(data.downloadLinks).forEach(([fileName, filePath], index) => {
                    // Remove the base path from the URL
                    const cleanedUrl = filePath.replace(basePathToRemove, '');
            
                    linksHTML += `
                        <div class="mb-3">
                            <a href="${cleanedUrl}" target="_blank">Download ${fileName}</a>
                            <br>
                            <small>URL: http://82.180.137.104:3000${cleanedUrl}</small>
                        </div>
                    `;
                });
            
                doneMessage.innerHTML = linksHTML;
            } else {
                doneMessage.textContent = 'Processing completed, but no download links were provided.';
            }

        })
        .catch(error => {
            processingMessage.style.display = 'block';
            processingMessage.textContent = `Error: ${error.message}`;
        })
        .finally(() => {
            processingMessage.style.display = 'none';
            doneMessage.style.display = 'block';
        });
});


// Functions
function printVal() {
    const zipCodeVal = zipCode.value;

    if (zipCodeVal === "123") {
        const data = [
            ['PB90', 'LEAD SUMMARY', 'Lead is a toxic heavy metal...', 'Lead exposure is highly dangerous...', 'LEAD & VOC Pack'],
            ['CU90', 'COPPER SUMMARY', 'Copper is a metal...', 'Excessive exposure can cause...', 'Anti-Scale & Heavy Metals Pack'],
            ['2V08', '8 Regulated Phase I VOCs', '1. Benzene\n2. Carbon Tetrachloride\n...', 'This group of contaminants...', 'Chloramine & VOC Pack'],
            ['2V07', '7 Regulated Phase I VOCs', '1. Benzene\n2. Carbon Tetrachloride\n...', 'This group of contaminants...', 'Chloramine & VOC Pack']
        ];

        if (data.length > 0) {
            table1Con.classList.remove("d-none");
            hrTag.classList.remove("d-none");

            table1.innerHTML = generateTable(data, ["Code", "Description", "Contaminant Description", "Health Hazard", "Filter Pack Match"]);

            const imgDataArray = data.map(item => item[4]);
            const uniqueImgArr = [...new Set(imgDataArray)];
            const images = {
                'LEAD & VOC Pack': 'Images/Lead&VOC.png',
                'Chloramine & VOC Pack': 'Images/Chloramine.png',
                'Anti-Scale & Heavy Metals Pack': 'Images/AntiScale.png'
            };

            imgDiv.innerHTML = uniqueImgArr.map(code => `<img src="${images[code]}" class="img-fluid mx-2" style="height: 80px;">`).join('');

            if (flexCheckDefault.checked) {
                const data1 = [
                    ["MR", "1045","Archived"," 04/22/1994"],
                    ["MR", "1045","Archived","04/22/1994"]
                ];
                table2Vio.classList.remove("d-none");
                table2.innerHTML = generateTable(data1, ["VIOLATION_CATEGORY", "CONTAMINANT_CODE","VIOLATION_STATUS","VIOL_LAST_REPORTED"]);
            }
        }

    } else {
        clearTables();
        showError("Enter a valid Zip Code");
    }
}

function generateTable(data, headers) {
    const headerRow = headers.map(header => `<th>${header}</th>`).join('');
    const rows = data.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('');
    return `<thead><tr>${headerRow}</tr></thead><tbody>${rows}</tbody>`;
}

function clearTables() {
    imgDiv.innerHTML = "";
    table1.innerHTML = "";
    table2.innerHTML = "";
    table1Con.classList.add("d-none");
    table2Vio.classList.add("d-none");
    hrTag.classList.add("d-none");
}

function showError(message) {
    errorMsg.innerText = message;
    setTimeout(() => { errorMsg.innerText = ""; }, 3000);
}

function adminAccess() {
    inputAdmin.classList.remove("d-none");
    btnAdmin.classList.remove("d-none");
    adminAccessBtn.disabled = true;
}

function submitPassword() {
    const originalPass = "12345";
    const enteredPass = inputAdmin.value;

    if (originalPass === enteredPass) {
        inputAdmin.classList.add("d-none");
        btnAdmin.classList.add("d-none");
        uploadBox.classList.remove("d-none");
        uploadData.classList.remove("d-none");
        downloadData.classList.remove("d-none");
        downloadTemplate.classList.remove("d-none");
    } else {
        pTag.innerText = "You have entered the wrong Password!";
        setTimeout(() => { pTag.innerText = ""; }, 3000);
    }
}
