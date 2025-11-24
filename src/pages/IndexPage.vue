<template>
  <q-page class="flex flex-center q-pa-md">
    <div class="container" style="max-width: 1200px; width: 100%;">
        <div class="text-center q-mb-xl fade-in">
          <p style="color: rgba(255, 255, 255, 0.7); font-size: 1.1rem; margin-top: 8px;">
            High-accuracy transcription with timestamps for MWN Marketing Team
          </p>
        </div>

      <div class="row q-col-gutter-lg">
        <div class="col-12 col-md-6">
          <div v-if="!videoFile && !videoUrl" class="glass-card q-pa-lg fade-in">
            <h3 style="color: white; margin-top: 0;">Upload Video</h3>

            <q-file
              v-model="videoFile"
              label="Choose video file"
              accept="video/*"
              filled
              dark
              color="primary"
              @update:model-value="handleFileSelect"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="videocam" />
              </template>
            </q-file>

            <div
              class="upload-zone q-mb-lg"
              @drop.prevent="handleDrop"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              :class="{ 'drag-over': dragOver }"
            >
              <q-icon name="cloud_upload" size="64px" color="primary" />
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.1rem; margin-top: 16px;">
                Drag and drop your video here
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem;">
                Supports video and audio files (MP4, MOV, WEBM, MP3, WAV, M4A...). Streaming links like YouTube, Vimeo, or Google Drive are not supported.
              </p>
            </div>

            <div class="row items-center q-my-md">
              <div class="col" style="height: 1px; background: rgba(255, 255, 255, 0.2);"></div>
              <div class="col-auto q-px-md" style="color: rgba(255, 255, 255, 0.5);">OR</div>
              <div class="col" style="height: 1px; background: rgba(255, 255, 255, 0.2);"></div>
            </div>

            <q-input
              v-model="videoUrlInput"
              filled
              dark
              label="Enter direct video URL (links ending in .mp4, .mov, etc.)"
              color="primary"
              @keyup.enter="handleUrlSubmit"
            >
              <template v-slot:prepend>
                <q-icon name="link" />
              </template>
              <template v-slot:append>
                <q-btn
                  v-if="videoUrlInput"
                  flat
                  round
                  dense
                  icon="arrow_forward"
                  @click="handleUrlSubmit"
                  color="primary"
                />
              </template>
            </q-input>
          </div>

          <div v-if="videoFile || videoUrl" class="glass-card q-pa-lg fade-in">
            <div class="row items-center justify-between q-mb-md">
              <h3 style="color: white; margin: 0;">{{ videoFile ? 'Video Preview' : 'Video URL' }}</h3>
              <q-btn
                flat
                round
                icon="close"
                color="white"
                @click="resetVideo"
              />
            </div>

            <div v-if="videoFile" class="video-player q-mb-md">
              <video
                ref="videoPlayer"
                :src="videoUrl"
                controls
                @loadedmetadata="onVideoLoaded"
              />
            </div>

            <div class="q-mb-md">
              <p style="color: rgba(255, 255, 255, 0.7); margin: 0;">
                <strong v-if="videoFile">{{ videoFile.name }}</strong>
                <strong v-else>{{ videoUrl }}</strong>
              </p>
              <p v-if="videoFile" style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin: 4px 0 0 0;">
                {{ formatFileSize(videoFile.size) }}
              </p>
              <p v-else style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin: 4px 0 0 0;">
                URL-based transcription (YouTube, Vimeo, or direct link)
              </p>
            </div>

            <q-btn
              v-if="!isTranscribing && !transcript"
              unelevated
              color="primary"
              label="Start Transcription"
              icon="mic"
              size="lg"
              class="full-width premium-btn"
              @click="startTranscription"
            />
          </div>

          <div v-if="isTranscribing" class="glass-card q-pa-lg q-mt-md fade-in">
            <h4 style="color: white; margin-top: 0;">Transcribing...</h4>
            <p style="color: rgba(255, 255, 255, 0.7);">{{ progressStatus }}</p>

            <div class="progress-bar q-mt-md">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>

            <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 8px; text-align: center;">
              {{ progressPercent }}%
            </p>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div v-if="transcript" class="glass-card q-pa-lg fade-in">
            <div class="row items-center justify-between q-mb-md">
              <h3 style="color: white; margin: 0;">Transcript</h3>
              <div class="row q-gutter-sm">
                <q-btn
                  unelevated
                  color="primary"
                  label="Export DOC"
                  icon="description"
                  @click="exportDoc"
                  :loading="exportingDoc"
                />
                <q-btn
                  unelevated
                  color="secondary"
                  label="Export PDF"
                  icon="picture_as_pdf"
                  @click="exportPdf"
                  :loading="exportingPdf"
                />
              </div>
            </div>

            <div style="color: rgba(255, 255, 255, 0.6); margin-bottom: 16px;">
              <p style="margin: 0;">
                <strong>Duration:</strong> {{ formatTimestamp(transcript.duration * 1000) }} |
                <strong>Confidence:</strong> {{ (transcript.confidence * 100).toFixed(1) }}%
              </p>
            </div>

            <q-input
              v-model="searchQuery"
              filled
              dark
              label="Search transcript..."
              color="primary"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
              <template v-slot:append v-if="searchQuery">
                <q-icon name="close" @click="searchQuery = ''" class="cursor-pointer" />
              </template>
            </q-input>

            <div style="max-height: 600px; overflow-y: auto;">
              <div
                v-for="(segment, index) in filteredSegments"
                :key="index"
                class="transcript-segment"
                @click="seekToTimestamp(segment.start)"
              >
                <span class="timestamp">{{ formatTimestamp(segment.start) }}</span>
                <span class="text">{{ segment.text }}</span>
              </div>

              <div v-if="filteredSegments.length === 0" style="text-align: center; padding: 32px; color: rgba(255, 255, 255, 0.5);">
                No results found for "{{ searchQuery }}"
              </div>
            </div>
          </div>

          <div v-else-if="!videoFile && !videoUrl" class="glass-card q-pa-xl text-center fade-in">
            <q-icon name="info" size="64px" color="primary" class="q-mb-md" />
            <h4 style="color: white;">Get Started</h4>
            <p style="color: rgba(255, 255, 255, 0.7);">
              Upload a video file or enter a video URL to begin transcription with high-accuracy timestamps
            </p>
            <p style="color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-top: 12px;">
              Streaming and gated links (YouTube, Vimeo, Google Drive) are not supported. Use a direct link ending in .mp4, .mov, .webm, etc., or upload the file.
            </p>
          </div>
        </div>
      </div>
      <div style="text-align: center; color: rgba(255, 255, 255, 0.4); font-size: 0.85rem; margin-top: 32px;">
        © MWN Marketing Team. All rights reserved.
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { transcribeVideo, formatTimestamp } from '../services/transcriptionService';
import { exportToDocx, exportToPdf } from '../utils/exportUtils';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const videoFile = ref(null);
const videoUrl = ref('');
const videoUrlInput = ref('');
const videoPlayer = ref(null);
const dragOver = ref(false);
const isTranscribing = ref(false);
const transcript = ref(null);
const progressStatus = ref('');
const progressPercent = ref(0);
const searchQuery = ref('');
const exportingDoc = ref(false);
const exportingPdf = ref(false);

const filteredSegments = computed(() => {
  if (!transcript.value || !searchQuery.value) {
    return transcript.value?.segments || [];
  }

  const query = searchQuery.value.toLowerCase();
  return transcript.value.segments.filter(segment =>
    segment.text.toLowerCase().includes(query)
  );
});

function handleFileSelect(file) {
  if (file) {
    videoUrl.value = URL.createObjectURL(file);
  }
}

function handleDrop(e) {
  dragOver.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('video/')) {
    videoFile.value = files[0];
    videoUrl.value = URL.createObjectURL(files[0]);
  } else {
    $q.notify({
      type: 'negative',
      message: 'Please upload a valid video file'
    });
  }
}

function onVideoLoaded() {
  console.log('Video loaded successfully');
}

function handleUrlSubmit() {
  if (!videoUrlInput.value.trim()) return;

  try {
    const parsedUrl = new URL(videoUrlInput.value.trim());

    if (isUnsupportedVideoPlatform(parsedUrl.hostname)) {
      throw new Error('unsupported_platform');
    }

    if (!isDirectVideoUrl(parsedUrl.pathname)) {
      throw new Error('requires_direct_link');
    }

    videoFile.value = null;
    videoUrl.value = parsedUrl.toString();
    $q.notify({
      type: 'positive',
      message: 'Video URL added successfully!',
      icon: 'check_circle'
    });
  } catch (error) {
    let message = 'Please enter a valid URL';

    if (error.message === 'unsupported_platform') {
      message = 'Streaming platforms like YouTube/Vimeo are not supported. Please download the video and upload it instead.';
    } else if (error.message === 'requires_direct_link') {
      message = 'Please enter a direct link that points to a video file (e.g. .mp4, .mov, .webm).';
    }

    $q.notify({
      type: 'negative',
      message
    });
  }
}

function resetVideo() {
  if (videoUrl.value && videoFile.value) {
    URL.revokeObjectURL(videoUrl.value);
  }
  videoFile.value = null;
  videoUrl.value = '';
  videoUrlInput.value = '';
  transcript.value = null;
  isTranscribing.value = false;
  progressPercent.value = 0;
  searchQuery.value = '';
}

async function startTranscription() {
  const videoSource = videoFile.value || videoUrl.value;
  if (!videoSource) return;

  isTranscribing.value = true;
  progressPercent.value = 0;
  progressStatus.value = 'Preparing...';

  try {
    const result = await transcribeVideo(videoSource, (progress) => {
      progressPercent.value = progress.progress;

      switch (progress.status) {
        case 'uploading':
          progressStatus.value = 'Uploading video...';
          break;
        case 'processing':
          progressStatus.value = 'Processing transcription...';
          break;
        case 'finalizing':
          progressStatus.value = 'Finalizing...';
          break;
        case 'complete':
          progressStatus.value = 'Complete!';
          break;
      }
    });

    transcript.value = result;

    $q.notify({
      type: 'positive',
      message: 'Transcription completed successfully!',
      icon: 'check_circle'
    });
  } catch (error) {
    console.error('Transcription error:', error);
    $q.notify({
      type: 'negative',
      message: error.message || 'Transcription failed. Please try again.',
      icon: 'error'
    });
  } finally {
    isTranscribing.value = false;
  }
}

function seekToTimestamp(ms) {
  if (videoPlayer.value) {
    videoPlayer.value.currentTime = ms / 1000;
    videoPlayer.value.play();
  }
}

async function exportDoc() {
  if (!transcript.value) return;

  exportingDoc.value = true;
  try {
    await exportToDocx(transcript.value, videoFile.value.name);
    $q.notify({
      type: 'positive',
      message: 'Document exported successfully!',
      icon: 'download'
    });
  } catch (error) {
    console.error('Export error:', error);
    $q.notify({
      type: 'negative',
      message: 'Export failed. Please try again.'
    });
  } finally {
    exportingDoc.value = false;
  }
}

function exportPdf() {
  if (!transcript.value) return;

  exportingPdf.value = true;
  try {
    exportToPdf(transcript.value, videoFile.value.name);
    $q.notify({
      type: 'positive',
      message: 'PDF exported successfully!',
      icon: 'download'
    });
  } catch (error) {
    console.error('Export error:', error);
    $q.notify({
      type: 'negative',
      message: 'Export failed. Please try again.'
    });
  } finally {
    exportingPdf.value = false;
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function isDirectVideoUrl(pathname) {
  const supportedExtensions = ['.mp4', '.mov', '.webm', '.mkv', '.mp3', '.wav', '.m4a'];
  return supportedExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
}

function isUnsupportedVideoPlatform(hostname) {
  const blockedHosts = ['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com'];
  return blockedHosts.includes(hostname.toLowerCase());
}
</script>
