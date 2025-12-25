const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Could not connect to MongoDB", err));

const UserSchema = new mongoose.Schema({
    email: String,
    points: { type: Number, default: 100 }
});
const User = mongoose.model('User', UserSchema);

// The Main Booking Logic
app.post('/api/book', async (req, res) => {
    const { email, movie, seats, usePoints } = req.body;
    let user = await User.findOne({ email });

    if (!user) {
        user = new User({ email });
        await user.save();
    }

    let message = `Booking confirmed for ${movie} (${seats} seats).`;
    if (usePoints && user.points >= 100) {
        user.points -= 100;
        await user.save();
        message = `Free Booking! 100 points used. Remaining: ${user.points}`;
    }

    const qrData = `User: ${email}, Movie: ${movie}, Seats: ${seats}`;
    const qrCodeImage = await QRCode.toDataURL(qrData);

    res.json({ success: true, message, qr: qrCodeImage });
});

module.exports = app;
