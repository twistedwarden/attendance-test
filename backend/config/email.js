import nodemailer from 'nodemailer';

let transporter;

const getTransporter = () => {
	if (!transporter) {
		transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT || 587),
			secure: String(process.env.SMTP_SECURE || 'false') === 'true',
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
		});
	}
	return transporter;
};

const getFrom = () => {
	const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
	const fromName = process.env.SMTP_FROM_NAME || 'Attendance System';
	return `${fromName} <${fromEmail}>`;
};

export const sendEmail = async ({ to, subject, html }) => {
	if (!to) return;
	const tx = getTransporter();
	await tx.sendMail({ from: getFrom(), to, subject, html });
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


