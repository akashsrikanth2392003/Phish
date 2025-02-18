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
    // Add a warning style or icon
    emailElement.style.border = '2px solid red';

    const warning = document.createElement('div');
    warning.innerText = '⚠️ Suspicious Email Detected';
    warning.style.color = 'red';
    warning.style.fontWeight = 'bold';
    warning.style.marginBottom = '5px';
    emailElement.prepend(warning);
}

function scanEmails() {
    console.log("Scanning emails...");

    let emailRowSelector = '.zA',  // Set a default fallback
        subjectSelector = '.bog',
        senderSelector = '.yX';

    // Determine the platform by checking the hostname
    if (window.location.hostname.includes("mail.google.com")) {
        console.log("Detected platform: Gmail");
    } else if (window.location.hostname.includes("outlook.live.com")) {
        emailRowSelector = '.lvHighlightAllClass'; // Adjust this if necessary
        subjectSelector = '.lvHighlightSubjectClass';
        senderSelector = '.lvHighlightFromClass';
        console.log("Detected platform: Outlook");
    } else {
        console.warn("Unsupported platform for email scanning.");
        return;
    }

    // Log the email row selector to confirm it's set
    console.log("Using emailRowSelector:", emailRowSelector);

    // Run querySelectorAll with the specified selector
    const emailElements = document.querySelectorAll(emailRowSelector);
    console.log("Email elements found:", emailElements.length);

    if (emailElements.length === 0) {
        console.warn("No email elements found with selector:", emailRowSelector);
        return;  // Exit if no emails found to avoid further errors
    }
    
    emailElements.forEach(emailElement => {
        // Skip emails that have already been scanned
        if (!scannedEmails.has(emailElement)) {
            scannedEmails.add(emailElement);
            console.log("Scanning email element:", emailElement);

            // Use platform-specific selectors to get subject and sender
            const subjectElement = emailElement.querySelector(subjectSelector);
            const senderElement = emailElement.querySelector(senderSelector);
            const bodyElement = document.body;  // Placeholder for email body content

            if (subjectElement && senderElement && bodyElement) {
                const emailData = {
                    subject: subjectElement.innerText || '',
                    sender: senderElement.innerText || '',
                    body: bodyElement.innerText || ''
                };
                console.log("Email data extracted:", emailData);

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
                console.warn('Email data could not be extracted for an email element.');
            }
        }
    });
}

// Observe changes in the DOM to detect new emails dynamically
const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
        scanEmails(); // Re-scan for any new emails loaded dynamically
    });
});

// Start observing changes on the page to detect dynamically loaded content
observer.observe(document.body, { childList: true, subtree: true });
