document.addEventListener('DOMContentLoaded', () => {
  const playPauseBtn = document.getElementById('play-pause');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const audioPlayer = document.getElementById('audio-player');
  const seekBar = document.getElementById('seek-bar');
  const currentTimeSpan = document.getElementById('current-time');
  const durationSpan = document.getElementById('duration');
  const volumeBar = document.getElementById('volume-bar');

  if (!playPauseBtn || !audioPlayer) {
    console.error('Music player elements not found');
    return;
  }

  // Play/Pause toggle
  playPauseBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
    } else {
      audioPlayer.pause();
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
    }
  });

  // Update duration when metadata loads
  audioPlayer.addEventListener('loadedmetadata', () => {
    const minutes = Math.floor(audioPlayer.duration / 60);
    const seconds = Math.floor(audioPlayer.duration % 60);
    durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    seekBar.max = Math.floor(audioPlayer.duration);
  });

  // Update current time as song plays
  audioPlayer.addEventListener('timeupdate', () => {
    const minutes = Math.floor(audioPlayer.currentTime / 60);
    const seconds = Math.floor(audioPlayer.currentTime % 60);
    currentTimeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    seekBar.value = Math.floor(audioPlayer.currentTime);
  });

  // Seek bar interaction
  seekBar.addEventListener('input', () => {
    audioPlayer.currentTime = seekBar.value;
  });

  // Volume control
  volumeBar.addEventListener('input', () => {
    audioPlayer.volume = volumeBar.value;
  });

  // Set initial volume
  audioPlayer.volume = volumeBar.value;

  // Reset icons when audio ends
  audioPlayer.addEventListener('ended', () => {
    playIcon.style.display = 'inline';
    pauseIcon.style.display = 'none';
  });
});