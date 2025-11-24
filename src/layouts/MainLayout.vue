<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-dark">
      <q-toolbar class="justify-between">
        <div class="row items-center no-wrap toolbar-brand">
          <img :src="logo" alt="MWN logo" class="header-logo" />
          <div class="toolbar-typewriter">
            <span class="typewriter-text">{{ typewriterText }}</span>
            <span class="typewriter-cursor"></span>
          </div>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import logoUrl from '../assets/logo.png'

const logo = logoUrl
const typewriterText = ref('')
const typewriterFullText = 'Muslim Wellness Network'
const typingForward = ref(true)
let typewriterTimer = null

function scheduleTypewriter (delay = 120) {
  typewriterTimer = setTimeout(() => {
    if (typingForward.value) {
      if (typewriterText.value.length < typewriterFullText.length) {
        typewriterText.value = typewriterFullText.slice(0, typewriterText.value.length + 1)
        scheduleTypewriter()
      } else {
        typingForward.value = false
        scheduleTypewriter(1500)
      }
    } else {
      if (typewriterText.value.length > 0) {
        typewriterText.value = typewriterFullText.slice(0, typewriterText.value.length - 1)
        scheduleTypewriter(60)
      } else {
        typingForward.value = true
        scheduleTypewriter(500)
      }
    }
  }, delay)
}

onMounted(() => {
  scheduleTypewriter()
})

onBeforeUnmount(() => {
  if (typewriterTimer) {
    clearTimeout(typewriterTimer)
    typewriterTimer = null
  }
})
</script>
