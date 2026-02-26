<script lang="ts" setup>
import { ref } from "vue";
import type { Audio, Slide } from "../shared/types";
import JSZip from "jszip";

import soundtrackUrl from '../shared/assets/soundtrack.mp3?url';
import backgroundVideoUrl from '../shared/assets/background.mp4?url';

const { slides = [] } = defineProps<{ slides: Slide[], sfx: Audio[] }>()

const isLoaded = ref(false);
const isLoading = ref(false);
const progress = ref('');

const parseDataURL = (dataURL: string) => {
  const match = dataURL.match(/^data:(image\/[^;]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
  return { mime: match[1], base64: match[2] };
};

const getExtension = (mime: string) => {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  return ".png";
};

const buildFFmpegCommand = (slides: Slide[], extensions: string[], durations: number[], backgroundFile: string, audioFile: string) => {
  const WIDTH = 1920;
  const HEIGHT = 1080;
  const MAX_SLIDE_HEIGHT = Math.round(0.8 * HEIGHT);
  const FPS = 120; 
  const TRANSITION = 0.7; 
  const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);
  let inputs = "";
  let filters = "";
  let lastOutput = "";
  let offset = 0;
  inputs += `-stream_loop -1 -i ${backgroundFile} `;
  inputs += `-i ${audioFile} `;
  for (let i = 0; i < slides.length; i++) {
    const dur = durations[i] as number;
    const ext = extensions[i] as string;
    inputs += `-loop 1 -t ${dur} -i slide${i}${ext} `;
    const SCALING_FACTOR = 4 
    filters += `[${i+2}:v]fps=${FPS},` +
               `scale='min(${WIDTH * SCALING_FACTOR}, floor(iw*${MAX_SLIDE_HEIGHT * SCALING_FACTOR}/ih))':${MAX_SLIDE_HEIGHT * SCALING_FACTOR}:'force_original_aspect_ratio=disable',` +
               `pad=${WIDTH * SCALING_FACTOR}:${HEIGHT * SCALING_FACTOR}:(ow-iw)/2:(oh-ih)/2:color=0x00000000,` +
               `zoompan=z=pzoom+0.00025:x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${WIDTH}x${HEIGHT}:fps=${FPS},` +
               `setsar=1[slide${i}];`;
    if (i === 0) {
      lastOutput = `[slide0]`;
      offset = dur - TRANSITION;
      continue;
    }
    const out = `[x${i}]`;
    // Simple crossfade transition
    filters += `${lastOutput}[slide${i}]xfade=transition=distance:duration=${TRANSITION}:offset=${offset}${out};`;
    offset += dur - TRANSITION;
    lastOutput = out;
  }
  // Prepare background (loop and trim to total duration, scale to full HD)
  filters += `[0:v]trim=duration=${totalDuration},setpts=PTS-STARTPTS,fps=${FPS},scale=${WIDTH}:${HEIGHT},setsar=1[background];`;
  // Overlay slides on background
  filters += `[background]${lastOutput}overlay=0:0:format=auto,format=yuv420p[finalvideo];`;
  // Prepare audio (trim to total duration)
  filters += `[1:a]volume=0.15,atrim=duration=${totalDuration}[finalaudio];`;

  const command = `ffmpeg ${inputs} -filter_complex "${filters}" ` +
                  `-map "[finalvideo]" -map "[finalaudio]" -c:v libx264 -preset slow -crf 18 ` +
                  `-c:a aac -b:a 192k -shortest ` +
                  `-r ${FPS} -pix_fmt yuv420p ../output.mp4`;
  return command;
};

const exportSlideshowZip = async () => {
  if (!slides.length) throw new Error("No slides provided");

  const zip = new JSZip();
  const slidesFolder = zip.folder("slides");

  const extensions = [];
  const durations = [];

  for (let i = 0; i < slides.length; i++) {
    const { mime, base64 } = parseDataURL(slides[i]!.image.src);
    const ext = getExtension(mime!);
    extensions.push(ext);
    durations.push(slides[i]!.duration / 1000);
    slidesFolder!.file(`slide${i}${ext}`, base64!, { base64: true });
  }

  let backgroundFile = "background.mp4";
  try {
    const response = await fetch(backgroundVideoUrl);
    const videoBlob = await response.blob();
    const videoBuffer = await videoBlob.arrayBuffer();
    slidesFolder!.file(backgroundFile, new Uint8Array(videoBuffer));
  } catch (error) {
    console.error("Failed to load background video:", error);
  }

  let audioFile = "soundtrack.mp3";
  try {
    const response = await fetch(soundtrackUrl);
    const audioBlob = await response.blob();
    const audioBuffer = await audioBlob.arrayBuffer();
    slidesFolder!.file(audioFile, new Uint8Array(audioBuffer));
  } catch (error) {
    console.error("Failed to load soundtrack:", error);
  }

  const command = buildFFmpegCommand(slides, extensions, durations, backgroundFile, audioFile);

  const batScript =
`@echo off
echo Rendering slideshow with background video and soundtrack...
cd slides
${command}
echo.
echo Done!
pause`;

  const readme =
`Slideshow Renderer with Background Video & Soundtrack

Requirements:
- FFmpeg installed and in PATH
- Video duration = sum of slide durations

Features:
- Looped background video (automatically trimmed to match slides duration)
- Background audio soundtrack (automatically trimmed to match slides duration)
- Smooth crossfade transitions between slides
- Gentle zoom effect on each slide

Files included:
- background.mp4 - Your background video
- soundtrack.mp3 - Your audio track
- slide0.jpg, slide1.jpg, etc. - Your slides

Usage:
1. Extract ZIP
2. Open "slides" folder
3. Double-click render.bat
4. Output will be saved as output.mp4

Note: The background video will loop seamlessly and be trimmed to exactly match your slides' total duration.`;

  zip.file("render.bat", batScript);
  zip.file("README.txt", readme);

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "slideshow_project.zip";
  a.click();
  URL.revokeObjectURL(url);
};

defineExpose({
    isLoaded,
    isLoading,
    progress
});
</script>

<template>
  <button 
    type="button" 
    class="text-white bg-gradient-to-r rounded-xs from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none cursor-pointer font-medium rounded-base text-sm px-4 py-2.5 text-center leading-5"
    @click="exportSlideshowZip">
      {{ progress || 'Generate video' }}
  </button>
</template>