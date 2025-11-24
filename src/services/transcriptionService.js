const ASSEMBLYAI_API_KEY = import.meta.env.VITE_ASSEMBLYAI_API_KEY;
const ASSEMBLYAI_API_URL = 'https://api.assemblyai.com/v2';

export async function transcribeVideo(videoSource, onProgress) {
  try {
    let audioUrl;

    if (typeof videoSource === 'string') {
      onProgress?.({ status: 'processing', progress: 10 });
      audioUrl = videoSource;
    } else {
      onProgress?.({ status: 'uploading', progress: 0 });
      audioUrl = await uploadFile(videoSource);
      onProgress?.({ status: 'processing', progress: 20 });
    }

    const transcriptId = await submitTranscription(audioUrl);

    onProgress?.({ status: 'processing', progress: 30 });

    const transcript = await pollTranscription(transcriptId, (progress) => {
      const mappedProgress = 30 + (progress * 0.6);
      onProgress?.({ status: 'processing', progress: mappedProgress });
    });

    onProgress?.({ status: 'finalizing', progress: 90 });

    const formattedTranscript = formatTranscript(transcript);

    onProgress?.({ status: 'complete', progress: 100 });

    return formattedTranscript;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

async function uploadFile(file) {
  const response = await fetch(`${ASSEMBLYAI_API_URL}/upload`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
    },
    body: file
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.upload_url;
}

async function submitTranscription(audioUrl) {
  const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript`, {
    method: 'POST',
    headers: {
      'authorization': ASSEMBLYAI_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      audio_url: audioUrl,
      speech_model: 'best'
    })
  });

  if (!response.ok) {
    throw new Error(`Transcription submission failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

async function pollTranscription(transcriptId, onProgress) {
  const pollingInterval = 3000;
  let attempts = 0;
  const maxAttempts = 200;

  while (attempts < maxAttempts) {
    const response = await fetch(`${ASSEMBLYAI_API_URL}/transcript/${transcriptId}`, {
      headers: {
        'authorization': ASSEMBLYAI_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Polling failed: ${response.statusText}`);
    }

    const transcript = await response.json();

    if (transcript.status === 'completed') {
      return transcript;
    } else if (transcript.status === 'error') {
      throw new Error(transcript.error || 'Transcription failed');
    }

    const progress = Math.min((attempts / maxAttempts) * 100, 95);
    onProgress?.(progress);

    await new Promise(resolve => setTimeout(resolve, pollingInterval));
    attempts++;
  }

  throw new Error('Transcription timeout');
}

function formatTranscript(transcript) {
  const segments = [];

  if (transcript.words && transcript.words.length > 0) {
    let currentSegment = {
      start: 0,
      end: 0,
      text: '',
      words: []
    };

    transcript.words.forEach((word, index) => {
      const shouldStartNewSegment =
        (word.start - currentSegment.start > 10000) ||
        (word.text.match(/[.!?]$/) && currentSegment.words.length > 0);

      if (shouldStartNewSegment && currentSegment.words.length > 0) {
        segments.push({ ...currentSegment });
        currentSegment = {
          start: word.start,
          end: word.end,
          text: word.text,
          words: [word]
        };
      } else {
        if (currentSegment.words.length === 0) {
          currentSegment.start = word.start;
        }
        currentSegment.end = word.end;
        currentSegment.text += (currentSegment.text ? ' ' : '') + word.text;
        currentSegment.words.push(word);
      }
    });

    if (currentSegment.words.length > 0) {
      segments.push(currentSegment);
    }
  }

  return {
    id: transcript.id,
    text: transcript.text,
    segments: segments,
    duration: transcript.audio_duration,
    confidence: transcript.confidence,
    words: transcript.words
  };
}

export function formatTimestamp(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
