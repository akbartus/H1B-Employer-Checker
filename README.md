# H1B Employer Checker  
<img src="img/screen-recording" width="500">
## Description / Rationale  
This repository contains the source code for a **Google Chrome extension** that simplifies the process of checking H1B employer data. It demonstrates how to integrate and interact with databases within a Chrome extension.  

The extension currently supports searching using **Google Search** and **Glassdoor Jobs**:  
- In **Google Search**, it checks for job postings from **MyWorkday**, **Greenhouse**, and **Ashby**.  
- In **Glassdoor Jobs**, it helps users find relevant employer information efficiently.  
- It determines whether a job post is from a **company that supports H1B visas**, assisting job seekers in making informed decisions.  

Additionally, this project covers **most of the essential scenarios involved in creating a Chrome extension**, serving as a valuable reference for developers.  

## Tech Stack  
- **SQL.js (Portable SQLite)** – Enables client-side database functionality.  
- **Data Source:** The database was created based on the data from the [H1B Employer Data Hub](https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub).
