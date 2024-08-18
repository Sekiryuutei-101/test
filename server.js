const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const app = express();
const upload = multer({ dest: 'uploads/' });

// Configure Google Drive API
const CLIENT_ID = '1039609089231-fjaai67fkp49vk629qqvt4anekglji8u.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = '1//04P2_GhktRgilCgYIARAAGAQSNwF-L9IroCDf-1DLUPxMWBnnb18qBExjv7P7y3FRI5IZ4BoSwfzKDmGoKZlx8lj3DyRrBYLnRQU';

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});
app.use(express.static(path.join(__dirname, 'public')));


app.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;
        const fileMetadata = {
            name: req.file.originalname,
            parents: ['1qbVCsqEKHoOxZuMYlGPDuE__6P5JtIxL']  // Optional: specify the folder ID in Google Drive
        };
        const media = {
            mimeType: 'audio/wav',
            body: fs.createReadStream(filePath)
        };
        const response = await drive.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id'
        });

        const fileId = response.data.id;

        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        const webViewLink = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
        res.json({ webViewLink: webViewLink });

        // Clean up: remove the file from server
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to upload file');
    }
});

app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
