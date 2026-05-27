import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((error) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email server ready ✅');
  }
});
interface BookingEmailData {
  to: string;
  userName: string;
  eventTitle: string;
  eventVenue: string;
  eventCity: string;
  eventDate: string;
  seats: {
    row: string;
    column: number;
    category: string;
    price: number;
  }[];
  total: number;
  bookingId: string;
  paymentId: string;
}

export const sendBookingConfirmation = async (data: BookingEmailData): Promise<void> => {
  const seatsHtml = data.seats.map(seat => `
    <tr>
      <td style="padding:8px;border:1px solid #333;color:#ffffff">
        ${seat.row}${seat.column}
      </td>
      <td style="padding:8px;border:1px solid #333;color:#ffffff">
        ${seat.category}
      </td>
      <td style="padding:8px;border:1px solid #333;color:#ffffff">
        ₹${seat.price}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation</title>
    </head>
    <body style="font-family:Arial,sans-serif;background:#0a0a0f;color:#ffffff;margin:0;padding:20px">
      <div style="max-width:600px;margin:0 auto">

        <div style="text-align:center;padding:30px 0;border-bottom:1px solid #333">
          <h1 style="color:#E24B4A;margin:0">🎬 BookIt</h1>
          <p style="color:rgba(255,255,255,0.5);margin:8px 0 0">
            Your booking is confirmed!
          </p>
        </div>

        <div style="background:rgba(29,158,117,0.15);border:1px solid rgba(29,158,117,0.3);border-radius:12px;padding:20px;margin:24px 0;text-align:center">
          <div style="font-size:40px">✅</div>
          <h2 style="color:#5DCAA5;margin:8px 0">Booking Confirmed!</h2>
          <p style="color:rgba(255,255,255,0.6);margin:4px 0">
            Hi ${data.userName}, your tickets are ready!
          </p>
        </div>

        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:16px">
          <h3 style="color:#E24B4A;margin:0 0 16px">Event Details</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:rgba(255,255,255,0.5);padding:6px 0;width:100px">Event</td>
              <td style="color:#ffffff;font-weight:bold">${data.eventTitle}</td>
            </tr>
            <tr>
              <td style="color:rgba(255,255,255,0.5);padding:6px 0">Venue</td>
              <td style="color:#ffffff">${data.eventVenue}, ${data.eventCity}</td>
            </tr>
            <tr>
              <td style="color:rgba(255,255,255,0.5);padding:6px 0">Date</td>
              <td style="color:#ffffff">${data.eventDate}</td>
            </tr>
          </table>
        </div>

        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:16px">
          <h3 style="color:#E24B4A;margin:0 0 16px">Your Seats</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:rgba(255,255,255,0.08)">
                <th style="padding:8px;border:1px solid #333;text-align:left;color:#ffffff">Seat</th>
                <th style="padding:8px;border:1px solid #333;text-align:left;color:#ffffff">Category</th>
                <th style="padding:8px;border:1px solid #333;text-align:left;color:#ffffff">Price</th>
              </tr>
            </thead>
            <tbody>
              ${seatsHtml}
            </tbody>
          </table>
        </div>

        <div style="background:rgba(226,75,74,0.1);border:1px solid rgba(226,75,74,0.2);border-radius:12px;padding:20px;margin-bottom:16px">
          <h3 style="color:#E24B4A;margin:0 0 16px">Payment Summary</h3>
          <table style="width:100%">
            <tr>
              <td style="color:rgba(255,255,255,0.5)">Total Paid</td>
              <td style="color:#E24B4A;font-size:20px;font-weight:bold;text-align:right">₹${data.total}</td>
            </tr>
          </table>
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08)">
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:4px 0">
              Booking ID: ${data.bookingId}
            </p>
            <p style="color:rgba(255,255,255,0.4);font-size:12px;margin:4px 0">
              Payment ID: ${data.paymentId}
            </p>
          </div>
        </div>

        <div style="text-align:center;padding:20px 0;border-top:1px solid #333">
          <p style="color:rgba(255,255,255,0.3);font-size:12px">
            Thank you for booking with BookIt!
          </p>
          <p style="color:rgba(255,255,255,0.3);font-size:12px">
            For support contact us at support@bookit.com
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.to,
    subject: `✅ Booking Confirmed — ${data.eventTitle} | BookIt`,
    html,
  });

  console.log(`Booking confirmation email sent to ${data.to} ✅`);
};