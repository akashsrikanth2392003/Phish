console.log("Phisherman Content Script Loaded");

// Function to extract email content
function getEmails() {
    let emails = document.querySelectorAll('.zA'); // Gmail's email selector

    if (emails.length === 0) {
        console.log("No emails found.");
        return [];
    }

    let emailData = [];
    emails.forEach(email => {
        let subject = email.querySelector('.bog')?.innerText || "No Subject";
        let sender = email.querySelector('.yX .yW span')?.innerText || "Unknown Sender";
        let snippet = email.querySelector('.y2')?.innerText || "No Content";

        emailData.push({
            subject: subject,
            sender: sender,
            snippet: snippet
        });
    });

    return emailData;
}

// Function to send email data to backend for phishing detection
async function checkEmails() {
    let emails = getEmails();

    if (emails.length === 0) {
        console.log("No emails to scan.");
        return;
    }

    console.log("Sending emails for phishing detection:", emails);

    try {
        let response = await fetch('http://127.0.0.1:5000/detect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emails: emails })
        });

        let result = await response.json();
        console.log("Detection Result:", result);

        result.forEach((res, index) => {
            if (res.isPhishing) {
                flagEmail(emails[index]);
            }
        });

    } catch (error) {
        console.error("Error communicating with phishing detection server:", error);
    }
}

// Function to visually flag phishing emails
function flagEmail(emailData) {
    let emails = document.querySelectorAll('.zA');

    emails.forEach(email => {
        let subject = email.querySelector('.bog')?.innerText;
        let sender = email.querySelector('.yX .yW span')?.innerText;

        if (emailData.subject === subject && emailData.sender === sender) {
            email.style.border = '2px solid red';
            let warning = document.createElement('div');
            warning.innerText = '⚠️ Suspicious Email Detected';
            warning.style.color = 'red';
            email.prepend(warning);
        }
    });
}

// Run the phishing detection when the page loads
setTimeout(checkEmails, 5000); // Wait 5 seconds to ensure Gmail loads
