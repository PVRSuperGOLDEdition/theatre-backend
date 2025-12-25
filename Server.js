const express = require('express');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI);

const User = mongoose.model('User', {
    email: String,
    points: { type: Number, default: 100 }
});

const Booking = mongoose.model('Booking', {
    movie: String,
    seats: Number,
    paymentMethod: String,
    status: { type: String, default: 'Pending' },
    cashToCollect: Number
});

app.post('/book', async (req, res) => {
    const { email, movie, seats, usePoints } = req.body;
    let user = await User.findOne({ email });
    if (!user) { user = new User({ email, points: 100 }); await user.save(); }

    let method = 'Cash';
    let cost = seats * 10; 

    if (usePoints && user.points >= 100) {
        user.points -= 100;
        await user.save();
        method = 'Points';
        cost = 0;
    }

    const newBooking = new Booking({ movie, seats, paymentMethod: method, cashToCollect: cost });
    await newBooking.save();

    const qrData = await QRCode.toDataURL(newBooking._id.toString());
    res.json({ success: true, qr: qrData, message: method === 'Points' ? "Free!" : `Pay $${cost} Cash` });
});

app.listen(process.env.PORT || 3000);
