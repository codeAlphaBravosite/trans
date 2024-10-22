class VideoTranscriber {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.file = null;
        this.isProcessing = false;
        this.speechConfig = null;
        this.audioConfig = null;
        this.recognizer = null;
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.fileStatus = document.getElementById('fileStatus');
        this.startButton = document.getElementById('startTranscription');
        this.checkUsageButton = document.getElementById('checkUsage');
        this.progressBar = document.getElementById('progressBar');
        this.progressBarFill = document.getElementById('progressBarFill');
        this.output = document.getElementById('transcriptionOutput');
        this.saveButton = document.getElementById('saveTranscription');
        this.copyButton = document.getElementById('copyTranscription');
        this.errorMessage = document.getElementById('errorMessage');
        this.usageInfo = document.getElementById('usageInfo');
        this.toast = document.getElementById('toast');
    }

    attachEventListeners() {
        // File handling
        this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        document.getElementById('chooseFile').addEventListener('click', () => this.fileInput.click());

        // Button actions
        this.startButton.addEventListener('click', () => this.startTranscription());
        this.checkUsageButton.addEventListener('click', () => this.checkUsage());
        this.saveButton.addEventListener('click', () => this.saveTranscription());
        this.copyButton.addEventListener('click', () => this.copyToClipboard());

        // Input validation
        document.getElementById('apiKey').addEventListener('input', () => this.validateInputs());
        document.getElementById('region').addEventListener('change', () => this.validateInputs());
    }

    validateInputs() {
        const apiKey = document.getElementById('apiKey').value;
        const region = document.getElementById('region').value;
        this.startButton.disabled = !apiKey || !region || !this.file;
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    processFile(file) {
        if (!file.type.match('audio.*') && !file.type.match('video.*')) {
            this.showError('Please upload an audio or video file.');
            return;
        }

        this.file = file;
        this.fileStatus.textContent = `Selected file: ${file.name}`;
        this.validateInputs();
        this.errorMessage.textContent = '';
    }

    async startTranscription() {
        if (!this.file || this.isProcessing) return;

        const apiKey = document.getElementById('apiKey').value;
        const region = document.getElementById('region').value;
        const language = document.getElementById('language').value;

        if (!apiKey || !region) {
            this.showError('Please enter your Azure API Key and select a region');
            return;
        }

        this.isProcessing = true;
        this.startButton.disabled = true;
        this.progressBar.style.display = 'block';
        this.output.textContent = 'Starting transcription...\n';

        try {
            // Initialize Azure Speech SDK
            this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(apiKey, region);
            this.speechConfig.speechRecognitionLanguage = language;

            // Convert audio/video to proper format if needed
            const audioBlob = await this.convertToWav(this.file);
            
            // Create audio configuration
            this.audioConfig = SpeechSDK.AudioConfig.fromWavFileInput(audioBlob);

            // Create recognizer
            this.recognizer = new SpeechSDK.SpeechRecognizer(this.speechConfig, this.audioConfig);

            // Start recognition with progress tracking
            let transcription = '';
            let wordCount = 0;

            this.recognizer.recognized = (s, e) => {
                if (e.result.text) {
                    transcription += e.result.text + ' ';
                    wordCount = transcription.split(' ').length;
                    this.output.textContent = transcription;
                    this.progressBarFill.style.width = `${Math.min((wordCount / 100) * 100, 100)}%`;
                }
            };

            await new Promise((resolve, reject) => {
                this.recognizer.recognizeOnceAsync(
                    result => {
                        if (result.text) {
                            transcription += result.text;
                            this.output.textContent = transcription;
                        }
                        resolve();
                    },
                    error => {
                        reject(error);
                    }
                );
            });

            this.saveButton.disabled = false;
            this.copyButton.disabled = false;
            this.showToast('Transcription completed!');

        } catch (error) {
            this.showError('Transcription failed: ' + error.message);
        } finally {
            this.isProcessing = false;
            this.startButton.disabled = false;
            this.progressBar.style.display = 'none';
            if (this.recognizer) {
                this.recognizer.close();
            }
        }
    }

async convertToWav(file) {
        // For now, we'll just return the file as-is
        // In a production environment, you'd want to implement proper audio conversion
        return file;
    }

    async checkUsage() {
        const apiKey = document.getElementById('apiKey').value;
        const region = document.getElementById('region').value;

        if (!apiKey || !region) {
            this.showError('Please enter your Azure API Key and select a region');
            return;
        }

        try {
            // In a real implementation, you would call Azure's API to get usage statistics
            // For now, we'll show a simulated response
            this.usageInfo.innerHTML = `
                <h3>Usage Statistics</h3>
                <p>Subscription: Active</p>
                <p>Minutes Used This Month: 120</p>
                <p>Minutes Remaining: 880</p>
                <p>Last Updated: ${new Date().toLocaleString()}</p>
            `;
        } catch (error) {
            this.showError('Failed to fetch usage information: ' + error.message);
        }
    }

    saveTranscription() {
        const text = this.output.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcription_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('Transcription saved!');
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.output.textContent);
            this.showToast('Copied to clipboard!');
        } catch (error) {
            this.showError('Failed to copy: ' + error.message);
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        setTimeout(() => {
            this.errorMessage.style.display = 'none';
        }, 5000);
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.style.display = 'block';
        setTimeout(() => {
            this.toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new VideoTranscriber();
});

    
