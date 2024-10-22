// DOM elements
const apiKeyInput = document.getElementById('apiKey');
const languageSelect = document.getElementById('language');
const audioFileInput = document.getElementById('audioFile');
const transcribeBtn = document.getElementById('transcribeBtn');
const resultText = document.getElementById('resultText');
const loading = document.getElementById('loading');
const transcriptionDiv = document.getElementById('transcription');

// Constants
const endpointUrl = 'https://centralindia.api.cognitive.microsoft.com/sts/v1.0/issuetoken';

// Load API key from localStorage (if exists)
document.addEventListener('DOMContentLoaded', () => {
  const savedApiKey = localStorage.getItem('apiKey');
  if (savedApiKey) {
    apiKeyInput.value = savedApiKey;
  }
});

// Event Listener for Transcribe Button
transcribeBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const apiKey = apiKeyInput.value.trim();
  const language = languageSelect.value;
  const audioFile = audioFileInput.files[0];

  if (!apiKey) {
    alert('Please enter your API key.');
    return;
  }

  if (!audioFile) {
    alert('Please upload an audio or video file.');
    return;
  }

  // Save API key to localStorage
  localStorage.setItem('apiKey', apiKey);

  // Show loading text
  loading.style.display = 'block';
  transcriptionDiv.classList.add('hidden');
  resultText.innerText = '';

  try {
    // Transcribe the audio file
    const transcription = await transcribeAudio(apiKey, language, audioFile);
    resultText.innerText = transcription;
    transcriptionDiv.classList.remove('hidden');
  } catch (error) {
    console.error('Error:', error);
    resultText.innerText = 'Transcription failed. Please try again.';
  } finally {
    loading.style.display = 'none';
  }
});

// Transcription function using Azure API
async function transcribeAudio(apiKey, language, audioFile) {
  const url = `https://centralindia.api.cognitive.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`;

  // Read file as a binary blob
  const audioBlob = await fileToBlob(audioFile);

  const headers = new Headers({
    'Ocp-Apim-Subscription-Key': apiKey,
    'Content-Type': 'audio/wav', // Adjust based on the audio file type
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: audioBlob,
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio.');
  }

  const result = await response.json();
  return result.DisplayText; // Return transcription result
}

// Helper function to convert file input to Blob
function fileToBlob(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result;
      resolve(new Blob([arrayBuffer], { type: file.type }));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
