const express = require('express');
const { create, Client } = require('whatsapp-web.js');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));

let client;
let pairingCodes = {};

// Generăm Pairing Code automat pe baza numărului de telefon
app.post('/generate-pairing', (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: "Număr de telefon lipsă!" });

    const pairingCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    pairingCodes[phoneNumber] = pairingCode;

    res.json({ success: true, pairingCode });
});

// Inițializăm clientul WhatsApp pe baza Pairing Code-ului
app.post('/connect', async (req, res) => {
    const { phoneNumber, pairingCode } = req.body;
    if (!phoneNumber || !pairingCode) return res.status(400).json({ error: "Date lipsă!" });
    
    if (pairingCodes[phoneNumber] !== pairingCode) {
        return res.status(401).json({ error: "Pairing Code invalid!" });
    }

    client = new Client({ authStrategy: new Client.AuthStrategies.Pairing(pairingCode) });
    
    client.on('ready', () => console.log("WhatsApp Bot conectat!"));
    client.initialize();

    res.json({ success: true, message: "Conectare în curs..." });
});

// Endpoint pentru trimiterea mesajelor
app.post('/send', async (req, res) => {
    if (!client) return res.status(500).json({ error: "Botul nu este conectat!" });
    
    const { number, message, delay } = req.body;
    if (!number || !message) return res.status(400).json({ error: "Număr sau mesaj lipsă!" });
    
    setTimeout(async () => {
        await client.sendMessage(number + "@c.us", message);
        res.json({ success: true, message: "Mesaj trimis!" });
    }, delay * 1000 || 1000);
});

app.listen(port, () => console.log(`Serverul rulează pe portul ${port}`));
