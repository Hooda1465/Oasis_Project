
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
        const data =  [['PB90',
            'LEAD SUMMARY',
            'Lead is a toxic heavy metal that can be found in drinking water, primarily due to the corrosion of old plumbing systems, such as lead pipes, fixtures, and solder.',
            'Lead exposure is highly dangerous, especially for children, as it can cause developmental delays, learning difficulties, and behavioral issues. In adults, lead can result in hypertension, kidney damage, and reproductive problems. Even low levels of lead in drinking water can have serious health effects, making it one of the most concerning contaminants.',
            'LEAD & VOC Pack'],
           
           ['CU90',
            'COPPER SUMMARY',
            'Copper is a metal that can leach into drinking water primarily from the corrosion of copper pipes and plumbing fixtures.',
            'While copper is an essential nutrient in small amounts, excessive exposure can cause gastrointestinal distress, including nausea, vomiting, and diarrhea. Long-term exposure to high levels of copper in drinking water can lead to liver and kidney damage and may cause complications for individuals with Wilson’s disease, a genetic disorder that causes copper accumulation in the body.',
            'Anti-Scale & Heavy Metals Pack'],
           ['2V08',
            '8 Regulated Phase I VOCs',
            '\t1.\tBenzene\n\t2.\tCarbon Tetrachloride\n\t3.\t1,2-Dichloroethane\n\t4.\t1,1-Dichloroethylene\n\t5.\tTrichloroethylene\n\t6.\t1,1,1-Trichloroethane\n\t7.\tVinyl Chloride\n\t8.\tTetrachloroethylene (also known as Perchloroethylene)',
            'This group of contaminants, which includes chemicals like Benzene and Vinyl Chloride, poses serious health risks including cancer, liver and kidney damage, and nervous system effects. Long-term exposure to these VOCs can lead to chronic health issues such as organ damage and increased cancer risk. Many of these chemicals are known carcinogens, making them particularly hazardous in drinking water.',
            'Chloramine & VOC Pack'],
           ['2V07',
            '7 Regulated Phase I VOCs',
            '\t1.\tBenzene\n\t2.\tCarbon Tetrachloride\n\t3.\t1,2-Dichloroethane\n\t4.\t1,1-Dichloroethylene\n\t5.\tTrichloroethylene\n\t6.\t1,1,1-Trichloroethane\n\t7.\tVinyl Chloride\n\t8.\tTetrachloroethylene (also known as Perchloroethylene)',
            'This group of contaminants, which includes chemicals like Benzene and Vinyl Chloride, poses serious health risks including cancer, liver and kidney damage, and nervous system effects. Long-term exposure to these VOCs can lead to chronic health issues such as organ damage and increased cancer risk. Many of these chemicals are known carcinogens, making them particularly hazardous in drinking water.',
            'Chloramine & VOC Pack']];

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
