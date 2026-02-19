<!--
  Svelte example — using @trailguide/core directly

  Install:
    npm install @trailguide/core

  No Svelte-specific wrapper needed. The core package manages its own DOM
  for tooltips and overlays, so it works with Svelte, SvelteKit, etc.
-->
<script>
  import { onMount } from 'svelte';
  import { start, stop } from '@trailguide/core';
  import '@trailguide/core/dist/style.css';
  import welcomeTour from './tours/welcome.json';

  let tourActive = false;

  function startTour() {
    tourActive = true;
    start(welcomeTour, {
      onComplete: () => {
        tourActive = false;
        console.log('Tour completed!');
      },
      onSkip: () => {
        tourActive = false;
        console.log('Tour skipped');
      },
    });
  }

  onMount(() => {
    // Auto-start on first visit, or call startTour() from a button
    startTour();
  });
</script>

<header id="dashboard-header">
  <h1>Dashboard</h1>
  <button data-trail-id="settings">Settings</button>
</header>

<main>
  <button data-trail-id="create-btn">+ Create New</button>
  <button on:click={startTour} disabled={tourActive}>Start Tour</button>

  <div id="stats-panel">
    <h2>Your Statistics</h2>
    <p>12 Projects / 48 Tasks / 6 Members</p>
  </div>
</main>
