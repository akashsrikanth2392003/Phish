console.log("Phisherman Content Script Loaded");

// Set to track scanned emails and prevent duplicate scans
const scannedEmails = new Set();

// Listener to receive messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "scan_email") {
        scanEmails();
        const emailText = document.body.innerText;
        sendResponse({ emailText });
    }
});

// Function to flag suspicious emails
function flagEmail(emailElement) {
    emailElement.style.border = '2px solid red';

    const warning = document.createElement('div');
    warning.innerText = '⚠️ Suspicious Email Detected';
    warning.style.color = 'red';
    warning.style.fontWeight = 'bold';
    warning.style.marginBottom = '5px';
    emailElement.prepend(warning);
}

// Function to scan emails
function scanEmails() {
    console.log("Scanning emails...");

    const emailRowSelector = '.zA'; // Updated selector for Gmail
    const subjectSelector = '.bog';
    const senderSelector = '.yX';

    console.log("Using emailRowSelector:", emailRowSelector);

    const emailElements = document.querySelectorAll(emailRowSelector);
    console.log("Email elements found:", emailElements.length);

    if (emailElements.length === 0) {
        console.warn("No email elements found. Skipping scan.");
        return;
    }
    
    emailElements.forEach(emailElement => {
        if (!scannedEmails.has(emailElement)) {
            scannedEmails.add(emailElement);
            console.log("Scanning email element:", emailElement);

            const subjectElement = emailElement.querySelector(subjectSelector);
            const senderElement = emailElement.querySelector(senderSelector);
            const bodyElement = document.body;

            if (subjectElement && senderElement && bodyElement) {
                const emailData = {
                    subject: subjectElement.innerText || '',
                    sender: senderElement.innerText || '',
                    body: bodyElement.innerText || ''
                };
                console.log("Extracted Email Data:", emailData);

                fetch('http://127.0.0.1:5000/predict', {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emailData)
                })
                .then(response => response.json())
                .then(result => {
                    console.log("Server response:", result);
                    if (result.is_phishing) {
                        flagEmail(emailElement);
                    }
                })
                .catch(error => console.error('Error connecting to server:', error));
            } else {
                console.warn('Could not extract data for an email element.');
            }
        }
    });
}

// Function to wait for Gmail's email elements before scanning
function waitForEmailsAndScan(retries = 10) {
    console.log("Waiting for email elements...");

    let emailElements = document.querySelectorAll('.zA'); // Updated selector

    if (emailElements.length === 0 && retries > 0) {
        console.warn(`No emails found. Retrying in 1s (${retries} left)...`);
        setTimeout(() => waitForEmailsAndScan(retries - 1), 1000);
    } else if (emailElements.length > 0) {
        console.log(`Found ${emailElements.length} emails. Starting scan.`);
        scanEmails();
    } else {
        console.error("No emails found after multiple retries.");
    }
}

// Observe changes in Gmail's inbox for dynamic content
const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
        scanEmails(); // Re-scan for new emails
    });
});

// Start observing Gmail's inbox
observer.observe(document.body, { childList: true, subtree: true });

// Run scan after Gmail loads (with retries)
setTimeout(() => waitForEmailsAndScan(), 5000); // Increased delay to 5s
