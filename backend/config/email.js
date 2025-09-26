import fetch from 'node-fetch';

// Brevo API is used; no SMTP transporter required.

const getFrom = () => {
	const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
	const fromName = process.env.BREVO_SENDER_NAME || process.env.SMTP_FROM_NAME || 'Attendance System';
	return { name: fromName, email: fromEmail };
};

export const sendEmail = async ({ to, subject, html }) => {
	if (!to) return;
	const apiKey = process.env.BREVO_API_KEY;
	if (!apiKey) {
		throw new Error('BREVO_API_KEY is not configured');
	}

	const sender = getFrom();
	const payload = {
		sender,
		to: [{ email: to }],
		subject,
		htmlContent: html,
	};

	const response = await fetch('https://api.brevo.com/v3/smtp/email', {
		method: 'POST',
		headers: {
			'api-key': apiKey,
			'accept': 'application/json',
			'content-type': 'application/json',
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		const errorText = await response.text().catch(() => '');
		throw new Error(`Brevo send failed: ${response.status} ${response.statusText} ${errorText}`);
	}

	return await response.json().catch(() => ({}));
};

export const renderAttendanceEmail = ({ studentName, date, timeIn = null, timeOut = null }) => {
    const title = timeIn && !timeOut ? 'Time In Notice' : timeOut && !timeIn ? 'Time Out Notice' : 'Attendance Update';

    const formatDate = (d) => {
        try {
            return new Date(d).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        } catch {
            return d;
        }
    };

    const formatTime = (t) => {
        if (!t) return null;
        try {
            const dt = new Date(`2000-01-01T${String(t).slice(0,5)}`);
            return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return t;
        }
    };

    const prettyDate = formatDate(date);
    const prettyIn = formatTime(timeIn);
    const prettyOut = formatTime(timeOut);

    const timeRows = [
        prettyIn ? `<tr><td style="padding:4px 0"><b>Time In:</b> ${prettyIn}</td></tr>` : '',
        prettyOut ? `<tr><td style="padding:4px 0"><b>Time Out:</b> ${prettyOut}</td></tr>` : ''
    ].join('');

    return {
        subject: `${title}: ${studentName} — ${prettyDate}`,
        html: `
            <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
                <h3 style="margin:0 0 8px;font-weight:600">${title}</h3>
                <p style="margin:0 0 6px">This is to inform you of an attendance event for <b>${studentName}</b>.</p>
                <p style="margin:0 0 8px;color:#444"><b>Date:</b> ${prettyDate}</p>
                <table style="margin-top:4px">${timeRows}</table>
                <p style="color:#6b7280;margin-top:12px;font-size:12px">This is an automated message.</p>
            </div>
        `
    };
};

export default sendEmail;


