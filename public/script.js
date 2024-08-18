let recordButton = document.getElementById('recordButton');
let stopButton = document.getElementById('stopButton');
let uploadButton = document.getElementById('uploadButton');
let audioPlayback = document.getElementById('audioPlayback');
let mediaRecorder;
let audioBlob;
let isAudioReady = false;

recordButton.addEventListener('click', async () => {
    try {
        let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        let audioChunks = [];
        mediaRecorder.ondataavailable = function(event) {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = function() {
            if (audioChunks.length > 0) {
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                let audioURL = URL.createObjectURL(audioBlob);
                audioPlayback.src = audioURL;
                isAudioReady = true;
                uploadButton.disabled = false;
            } else {
                console.error('No audio data available.');
            }
        };

        mediaRecorder.start();
        recordButton.disabled = true;
        stopButton.disabled = false;
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
});

stopButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    recordButton.disabled = false;
    stopButton.disabled = true;
});

uploadButton.addEventListener('click', async () => {
    if (isAudioReady && audioBlob) {
        await uploadToDrive(audioBlob);
    } else {
        console.error('No audio ready for upload.');
    }
});

async function uploadToDrive(audioBlob) {
    if (audioBlob instanceof Blob) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Shareable Link: " + result.webViewLink);
            } else {
                console.error('Upload failed:', response.statusText);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    } else {
        console.error('The audioBlob is not a valid Blob object:', audioBlob);
    }
}
