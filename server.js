import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// In-Memory Data Stores
const bookings = [];

// Helper function to calculate automatic clinic status (10:00 to 18:59 IST -> Open, 19:00 to 09:59 IST -> Closed)
function getAutomaticClinicStatus() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istMs = utcMs + (5.5 * 3600000); // IST (UTC+5:30)
  const istDate = new Date(istMs);

  const hours = istDate.getHours(); // 0-23
  // 10:00 AM (10:00) to 6:59 PM (18:59) -> Open; 7:00 PM (19:00) to 9:59 AM (09:59) -> Closed
  const isOpen = hours >= 10 && hours < 19;

  return {
    status: isOpen ? 'Open' : 'Closed',
    currentTimeIST: istDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    hours,
    schedule: '10:00 AM - 07:00 PM IST',
    updatedAt: new Date().toISOString()
  };
}

// API: Get Automatic Live Clinic Status
app.get('/api/status', (req, res) => {
  res.json(getAutomaticClinicStatus());
});

// API: Bookings
app.post('/api/book', (req, res) => {
  const { name, phone, email, service, doctor, date, time, notes } = req.body;
  
  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: 'Missing required appointment fields.' });
  }

  const bookingRef = 'TREX-' + Math.floor(100000 + Math.random() * 900000);
  const bookingData = {
    ref: bookingRef,
    name,
    phone,
    email: email || 'Not provided',
    service,
    doctor: doctor || 'First Available Specialist',
    date,
    time,
    notes: notes || 'None',
    createdAt: new Date().toISOString()
  };

  bookings.push(bookingData);
  res.json({ success: true, booking: bookingData });
});

app.get('/api/bookings', (req, res) => {
  res.json(bookings);
});

// Daily Email Status & Testing Endpoint
app.get('/api/daily-email/status', (req, res) => {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istMs = utcMs + (5.5 * 3600000);
  const istDate = new Date(istMs);

  res.json({
    currentTimeIST: istDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }),
    scheduledTimes: ['08:00 AM IST', '08:00 PM IST'],
    ownerEmail: 'trexdentalclinic@gmail.com',
    currentWebsiteStatus: clinicStatus,
    logs: dailyEmailLogs
  });
});

app.post('/api/daily-email/test', (req, res) => {
  const host = req.headers.host || 'trexdentalclinic.com';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const openUrl = `${protocol}://${host}/api/status/update?status=Open`;
  const closedUrl = `${protocol}://${host}/api/status/update?status=Closed`;

  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istMs = utcMs + (5.5 * 3600000);
  const istDate = new Date(istMs);
  const dateStr = istDate.toISOString().split('T')[0];

  const logEntry = {
    timestamp: new Date().toISOString(),
    date: dateStr,
    recipient: 'trexdentalclinic@gmail.com',
    openUrl,
    closedUrl,
    status: 'MANUAL TEST PROMPT SENT'
  };

  dailyEmailLogs.push(logEntry);

  res.json({
    success: true,
    recipient: 'trexdentalclinic@gmail.com',
    openUrl,
    closedUrl,
    message: '8:00 AM / 8:00 PM owner status inquiry email generated for trexdentalclinic@gmail.com with Open and Closed direct response links.'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
