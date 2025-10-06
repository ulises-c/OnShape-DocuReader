You are tasked with implementing a CSV exporter feature for the OnShape DocuReader web application. The application already has a backend server using Express.js and a frontend built with JavaScript. The goal is to create a mass exporter that retrieves all OnShape documents, extracts relevant parts, and generates CSV files based on specific criteria.

Requirements:
Directory Structure:

Use the directory public/js/utils/ to hold the exporter logic.
Inside this directory, create two files:
massExporter.js
getCSV.js
Ensure that the exported data is saved in a new directory exports/, with each document having its own subdirectory containing a thumbnail and a CSV file.
Functionality:

massExporter.js:
Implement a function exportAllDocuments() that:
Fetches all documents using the OnShape API.
For each document, fetches its parts.
Calls a function to generate a CSV from the parts data.
Saves the CSV file in the corresponding document's folder within exports/.
getCSV.js:
Implement a function getCSV(parts) that:
Filters the parts to include only those with a "Part number" field containing "ASM-XXXXXX" or "PRT-XXXXXX".
Converts the filtered parts into a CSV format string.
Integration:

Ensure that the API client can handle requests to fetch all necessary data from the OnShape API.
Add a button or UI element in the frontend to trigger the mass export process, calling the exportAllDocuments() function when clicked.
Example Code Structure:
Deliverables:
Implement the above functionality in the specified files.
Ensure that the exported data is structured correctly in the exports/ directory.
Provide comments and documentation for clarity.
