let cachedDb = null; // Store the cached database instance
let cachedResults = {}; // Cache query results to avoid repeated queries
// Function to modify Google search URLs by adding the tbs=qdr:h6 query parameter
function modifyGoogleSearchUrl(selection, searchTerm, platform) {
  let currentUrl;

  // Select the job platform (MyWorkday or Greenhouse)
  if (platform === "myworkday") {
    currentUrl = `https://www.google.com/search?q=site%3Ahttps%3A%2F%2F*.wd1.myworkdayjobs.com%2F*+${searchTerm}&as_occt=any`;
  } else if (platform === "greenhouse") {
    currentUrl = `https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fboards.greenhouse.io%2F*%2Fjobs%2F*+${searchTerm}&as_occt=any`;
  } else if (platform = "ashby") {
    currentUrl = `https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fjobs.ashbyhq.com%2F*+${searchTerm}&as_occt=any`
  }
  else {
    return; // If no platform is selected, do nothing
  }

  currentUrl = currentUrl.replace(/([&?])tbs=[^&]+/, "");

  // Check if the current URL is a Google search URL (not including other Google services)
  if (currentUrl.includes("google.com/search")) {
    // If the query string doesn't already include the selected value, append it
    if (selection && !currentUrl.includes(selection)) {
      const newUrl =
        currentUrl + (currentUrl.includes("?") ? "&" : "?") + selection;
      window.location.href = newUrl; // Redirect to the modified URL
    }
  }
}

/////////////////////////////////
// Create the controls window
let controlsWindow = document.createElement("div");
controlsWindow.id = "controls";
controlsWindow.style.zIndex = "999";
controlsWindow.style.display = "block";
controlsWindow.style.position = "absolute";
controlsWindow.style.top = "5px";
controlsWindow.style.left = "15px";

controlsWindow.innerHTML = `<div style="background: blue; color: white; padding: 5px;">H-1B Employer Checker Options</div>`;

let checker = window.location.href; // Get the current URL
// Append the div to the job listing item
if (checker.includes("https://www.google.com/")) {
  document.querySelector("body").appendChild(controlsWindow);
}

// Event listener for click on controls window
controlsWindow.addEventListener("click", function () {
  // Create the modal window
  let modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
  modal.style.zIndex = "1000";
  modal.style.borderRadius = "10px";
  modal.style.width = "400px";

  // Add dropdown list for selecting platform, time filter, and search field
  modal.innerHTML = `
    <h3>Options</h3>
    <label for="platform">Select platform:</label>
    <select id="platform">
        <option value="">Select platform</option>
        <option value="myworkday">MyWorkDay Jobs</option>
        <option value="greenhouse">GreenHouse Jobs</option>
        <option value="ashby">Ashby Jobs</option>
    </select><br><br>

    <label for="options">Job posted time:</label>
    <select id="options">
        <option value="">Select time</option>
        <option value="tbs=qdr:h3">Past 3 hours</option>
        <option value="tbs=qdr:h6">Past 6 hours</option>
        <option value="tbs=qdr:h12">Past 12 hours</option>
        <option value="tbs=qdr:d">Past 24 hours</option>
        <option value="tbs=qdr:d2">Past 2 days</option>
    </select><br><br>

    <!-- Add a search field below the dropdown -->
    <label for="searchTerm">Search term:</label>
    <input type="text" id="searchTerm" placeholder="Enter search term" style="width: 90%; padding: 5px; margin-top: 5px;"><br><br>
    
    <!-- Submit Button -->
    <button id="submitBtn" style="padding: 10px 20px; background-color: blue; color: white; border: none; cursor: pointer; border-radius: 5px;">Submit</button>
  `;

  // Create and style the "X" button in the top-left corner
  let closeBtn = document.createElement("span");
  closeBtn.innerHTML = "&#10006;"; // Unicode for "X" symbol
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "10px";
  closeBtn.style.right = "10px";
  closeBtn.style.fontSize = "24px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.color = "black";
  closeBtn.style.fontWeight = "bold";

  // Append the close button to the modal
  modal.appendChild(closeBtn);

  // Append the modal to the body
  document.body.appendChild(modal);

  // Event listener for Submit button
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.addEventListener("click", function () {
    const searchTerm = document.getElementById("searchTerm").value; // Get search term from the input field
    const selectedValue = document.getElementById("options").value; // Get selected time value
    const platform = document.getElementById("platform").value; // Get selected platform value

    // Only modify the URL if both search term and selected value are provided
    if (searchTerm == "" || (searchTerm != "" && selectedValue && platform)) {
      modifyGoogleSearchUrl(selectedValue, searchTerm, platform); // Modify the URL based on the selected option, search term, and platform
    } else {
      alert(
        "Please enter both a search term, select a time range, and select a platform."
      );
    }
  });

  // Close the modal when the "X" is clicked
  closeBtn.addEventListener("click", function () {
    modal.remove();
  });
});

// Ensure SQL.js is loaded and the database is cached
async function loadDatabase(companyName) {
  const url = window.location.href; // Get the current URL
  if (url.includes("https://www.google.com/")) {
    if (cachedResults[companyName] !== undefined) {
      return cachedResults[companyName];
    }
    // Run the function when the content script loads

    // SQL query to concatenate all parts of employer's name into one string
    const query = `SELECT REPLACE(employer, ' ', '') AS employer_name, initial_approval, continuing_approval 
                 FROM h1b WHERE employer LIKE "%${companyName}%";`;

    // Load the database only once and cache it
    if (!cachedDb) {
      const sqlPromise = initSqlJs({
        locateFile: (file) => chrome.runtime.getURL(file),
      });
      const dataPromise = fetch(chrome.runtime.getURL("dataset.db")).then(
        (res) => res.arrayBuffer()
      );

      const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
      cachedDb = new SQL.Database(new Uint8Array(buf)); // Store the database in the global variable
    }

    const db = cachedDb;
    const stmt = db.prepare(query);

    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free(); // Free the statement when done

    const matchFound = result ? true : false;
    const approvalCounts = result
      ? {
        initialApprovalCount: result.initial_approval,
        continuingApprovalCount: result.continuing_approval,
      }
      : { initialApprovalCount: 0, continuingApprovalCount: 0 };

    // Cache the result with the approval counts for future use
    cachedResults[companyName] = { matchFound, approvalCounts };
    return { matchFound, approvalCounts };
  } else if (url.includes("https://www.glassdoor.com/")) {
    // Check the cache first to avoid querying the database again
    if (cachedResults[companyName] !== undefined) {
      return cachedResults[companyName];
    }

    // Clean and prepare the company name
    const words = companyName
      .replace(/[.,]/g, "")
      .replace("The", "")
      .split(" ")
      .filter((word) => word);
    let queryCondition = "";
    if (words.length === 1) {
      if (words[0].length <= 3) {
        queryCondition = `employer LIKE "${words[0]}"`; // Match employer exactly
      } else {
        queryCondition = `employer LIKE "${words[0]}%"`; // Match employer starting with this word
      }
    }
    // Handle case for more than one word
    else if (words.length == 2) {
      queryCondition = `employer LIKE "${words[0]}%" AND employer LIKE "%${words[1]}%"`; // Match each word anywhere in the employer name
    } else if (words.length == 3) {
      queryCondition = `employer LIKE "${words[0]}%" AND employer LIKE "%${words[1]}%" AND employer LIKE "%${words[2]}%"`; // Match each word anywhere in the employer name
    } else if (words.length >= 4) {
      queryCondition = `employer LIKE "${words[0]}%" AND employer LIKE "%${words[1]}%" AND employer LIKE "%${words[2]}%" AND employer LIKE "%${words[3]}%"`; // Match each word anywhere in the employer name
    }

    // Updated query to also select `initial_approval` and `continuing_approval`
    const query = `SELECT employer, initial_approval, continuing_approval FROM h1b WHERE ${queryCondition};`;

    // Load the database only once and cache it
    if (!cachedDb) {
      const sqlPromise = initSqlJs({
        locateFile: (file) => chrome.runtime.getURL(file),
      });
      const dataPromise = fetch(chrome.runtime.getURL("dataset.db")).then(
        (res) => res.arrayBuffer()
      );

      const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]);
      cachedDb = new SQL.Database(new Uint8Array(buf)); // Store the database in the global variable
    }

    const db = cachedDb;
    const stmt = db.prepare(query);

    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free(); // Free the statement when done

    const matchFound = result ? true : false;
    const approvalCounts = result
      ? {
        initialApprovalCount: result.initial_approval,
        continuingApprovalCount: result.continuing_approval,
      }
      : { initialApprovalCount: 0, continuingApprovalCount: 0 };

    // Cache the result with the approval counts for future use
    cachedResults[companyName] = { matchFound, approvalCounts };
    return { matchFound, approvalCounts };
  }
}

// Inject custom content

async function addCustomCode() {
  const url = window.location.href; // Get the current URL

  // If it is google search

  if (url.includes("https://www.google.com/")) {
    let allUrls = document.querySelectorAll("span[jscontroller] > a[jsname]");
    let items = document.querySelectorAll("div[data-ved] > div[data-snc]");
    let companyNames = []; // Array to store company names

    allUrls.forEach((link) => {


      // Split the URL by 'com/' and focus on the path after it
      if (url.includes("https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fboards.greenhouse.io"))
      {
        let word = link.href.toLowerCase().split("io/")[1]?.split("/");
        companyNames.push(word[0]);


      } else if (url.includes("https://www.google.com/search?q=site%3Ahttps%3A%2F%2Fjobs.ashbyhq.com"))
      {
        let word1 = link.href.toLowerCase().split("com/")[1]?.split("/");
        companyNames.push(word1[0]);
      }
      
      else if (url.includes("https://www.google.com/search?q=site%3Ahttps%3A%2F%2F*.wd1.myworkdayjobs.com"))
      {
        const word2 = link.href.toLowerCase().split("com/")[1]?.split("/");

        if (word2) {
          if (
            word2[0] === "en-us" ||
            word2[0] === "es" ||
            word2[0] === "fr-ca" ||
            word2[0] === "fr-fr" ||
            word2[0] === "pt-br" ||
            word2[0] === "de-de" ||
            (word2[0] === "it-it" && !word2[0].includes("global"))
          ) {
            // Remove "EXTERNAL_" or "_CAREER" from the second segment
            word2[1] = word2[1]?.replace(
              /external_|_careers|_|careers|jobs|career_portal/g,
              ""
            );
            companyNames.push(word2[1]); // Add the cleaned segment to companyNames
          } else {
            // Remove "EXTERNAL_" or "_CAREER" from the first segment
            word2[0] = word2[0]?.replace(/external_|\_careers|_/g, "");
            companyNames.push(word2[0]); // Add the cleaned segment to companyNames
          }
        }
      }
    });

    // Log the final company names array

    const results = await Promise.all(
      companyNames.map((companyName) => loadDatabase(companyName))
    );

    for (let index = 0; index < companyNames.length; index++) {
      const companyNameElement = companyNames[index];
      const companyName = companyNameElement;
      const { matchFound, approvalCounts } = results[index]; // Destructure to get match and approval counts

      // Check if the div is already added
      if (!items[index].querySelector(".custom-company-div")) {
        const companyDiv = document.createElement("div");
        companyDiv.className = "custom-company-div";
        // <b>Company:</b> ${companyName}
        companyDiv.innerHTML = `<b>H-1B sponsor (2024)?</b> ${matchFound
            ? `<span style="color: green; font-weight:bold;">Yes</span>`
            : `<span style="color: red">No</span>`
          }, <b>Initial:</b> ${approvalCounts.initialApprovalCount
          }, <b>Continuing:</b> ${approvalCounts.continuingApprovalCount}`;
        companyDiv.style.backgroundColor = "#ebebeb";
        companyDiv.style.padding = "5px";
        companyDiv.style.color = "#000";
        companyDiv.style.fontSize = "12px";
        companyDiv.style.cursor = "pointer";
        companyDiv.style.zIndex = "999";

        // Append the div to the job listing item
        items[index].appendChild(companyDiv);
      }
    }

    // Perform your specific action here
  } else if (url.includes("https://www.glassdoor.com/")) {
    const companyNames = Array.from(
      document.querySelectorAll(".EmployerProfile_compactEmployerName__9MGcV")
    );
    const items = Array.from(
      document.querySelectorAll("li[data-test='jobListing']")
    );

    // Fetch results for each company
    const results = await Promise.all(
      companyNames.map((companyName) =>
        loadDatabase(companyName.textContent.trim())
      )
    );

    for (let index = 0; index < companyNames.length; index++) {
      const companyNameElement = companyNames[index];
      const companyName = companyNameElement.textContent.trim();
      const { matchFound, approvalCounts } = results[index]; // Destructure to get match and approval counts

      // Check if the div is already added
      if (!items[index].querySelector(".custom-company-div")) {
        const companyDiv = document.createElement("div");
        companyDiv.className = "custom-company-div";
        // <b>Company:</b> ${companyName}
        companyDiv.innerHTML = `<b>H-1B sponsor (2024)?</b> ${matchFound
            ? `<span style="color: green; font-weight:bold;">Yes</span>`
            : `<span style="color: red">No</span>`
          }, <b>Initial:</b> ${approvalCounts.initialApprovalCount
          }, <b>Continuing:</b> ${approvalCounts.continuingApprovalCount}`;
        companyDiv.style.backgroundColor = "#ebebeb";
        companyDiv.style.padding = "5px";
        companyDiv.style.color = "#000";
        companyDiv.style.fontSize = "12px";
        companyDiv.style.cursor = "pointer";
        companyDiv.style.zIndex = "999";

        // Append the div to the job listing item
        items[index].appendChild(companyDiv);
      }
    }
  }
}

function observeJobListings() {
  const targetNode = document.querySelector("#left-column");
  const config = { childList: true, subtree: true };

  const callback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        addCustomCode(); // Re-inject for newly added job listings
      }
    }
  };

  const observer = new MutationObserver(callback);
  if (targetNode) {
    observer.observe(targetNode, config);
  }
}

addCustomCode(); // Initial call
observeJobListings(); // Observe for new job listings
