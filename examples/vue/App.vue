<!--
  Vue example — using @trailguide/core directly

  Install:
    npm install @trailguide/core

  No Vue-specific wrapper needed. The core package manages its own DOM
  for tooltips and overlays, so it works with any Vue version (2 or 3).
-->
<script setup>
import { onMounted, ref } from 'vue'
import { start, stop } from '@trailguide/core'
import '@trailguide/core/dist/style.css'
import welcomeTour from './tours/welcome.json'

const tourActive = ref(false)

function startTour() {
  tourActive.value = true
  start(welcomeTour, {
    onComplete: () => {
      tourActive.value = false
      console.log('Tour completed!')
    },
    onSkip: () => {
      tourActive.value = false
      console.log('Tour skipped')
    },
  })
}

onMounted(() => {
  // Auto-start on first visit, or call startTour() from a button
  startTour()
})
</script>

<template>
  <header id="dashboard-header">
    <h1>Dashboard</h1>
    <button data-trail-id="settings">Settings</button>
  </header>

  <main>
    <button data-trail-id="create-btn" @click="() => {}">+ Create New</button>
    <button @click="startTour" :disabled="tourActive">Start Tour</button>

    <div id="stats-panel">
      <h2>Your Statistics</h2>
      <p>12 Projects / 48 Tasks / 6 Members</p>
    </div>
  </main>
</template>
