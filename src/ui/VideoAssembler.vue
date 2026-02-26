<script lang="ts" setup>
import { ref } from "vue";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { Audio, Slide } from "../shared/types";
import JSZip from "jszip";

const { slides = [], sfx = [] } = defineProps<{ slides: Slide[], sfx: Audio[] }>()

let ffmpeg: FFmpeg | null = null;


const isLoaded = ref(false);
const isLoading = ref(false);
const progress = ref('');

const parseDataURL = (dataURL) => {
  const match = dataURL.match(/^data:(image\/[^;]+);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
  return { mime: match[1], base64: match[2] };
};

const getExtension = (mime) => {
  if (mime === "image/jpeg") return ".jpg";
  if (mime === "image/png") return ".png";
  return ".png";
};

const buildFFmpegCommand = (slides, extensions, durations, backgroundPath, audioPath) => {
  const WIDTH = 1920;
  const HEIGHT = 1080;
  const MAX_SLIDE_HEIGHT = Math.round(0.8 * HEIGHT); // 864 pixels
  const FPS = 60;         // High FPS for smooth transitions
  const TRANSITION = 0.7; // seconds for crossfade

  // Calculate total duration
  const totalDuration = durations.reduce((sum, dur) => sum + dur, 0);

  let inputs = "";
  let filters = "";
  let lastOutput = "";
  let offset = 0;

  // Add background and audio inputs
  inputs += `-stream_loop -1 -i ${backgroundPath} `; // Loop background if needed
  inputs += `-i ${audioPath} `; // Audio input

  for (let i = 0; i < slides.length; i++) {
    const dur = durations[i];
    const ext = extensions[i];

    // Input slide, looped for duration
    inputs += `-loop 1 -t ${dur} -i slide${i}${ext} `;

    // Scale to fit within MAX_SLIDE_HEIGHT while maintaining aspect ratio
    filters += `[${i+2}:v]fps=${FPS},` + // +2 because background and audio are first
               `scale='min(${WIDTH * 3}, floor(iw*${MAX_SLIDE_HEIGHT * 3}/ih))':${MAX_SLIDE_HEIGHT * 3}:'force_original_aspect_ratio=disable',` +
               `pad=${WIDTH * 3}:${HEIGHT * 3}:(ow-iw)/2:(oh-ih)/2:color=black,` +
               `zoompan=z=pzoom+0.0002:x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=${WIDTH}x${HEIGHT}:fps=${FPS},` +
               `setsar=1[slide${i}];`;

    if (i === 0) {
      lastOutput = `[slide0]`;
      offset = dur - TRANSITION;
      continue;
    }

    const out = `[x${i}]`;

    // Simple crossfade transition
    filters += `${lastOutput}[slide${i}]xfade=transition=fade:duration=${TRANSITION}:offset=${offset}${out};`;

    offset += dur - TRANSITION;
    lastOutput = out;
  }

  // Prepare background (loop if needed and trim to total duration)
  filters += `[0:v]loop=-1:1:0,trim=duration=${totalDuration},fps=${FPS},scale=${WIDTH}:${HEIGHT},setsar=1[background];`;

  // Overlay slides on background
  filters += `[background]${lastOutput}overlay=0:0:format=auto,format=yuv420p[finalvideo];`;

  // Prepare audio (trim to total duration)
  filters += `[1:a]atrim=duration=${totalDuration}[finalaudio];`;

  // Build final FFmpeg command
  const command = `ffmpeg ${inputs} -filter_complex "${filters}" ` +
                  `-map "[finalvideo]" -map "[finalaudio]" -c:v libx264 -preset slow -crf 18 ` +
                  `-c:a aac -b:a 192k -shortest ` +
                  `-r ${FPS} -pix_fmt yuv420p output.mp4`;

  return command;
};

const exportSlideshowZip = async () => {
  if (!slides.length) throw new Error("No slides provided");

  const zip = new JSZip();
  const slidesFolder = zip.folder("slides");

  const extensions = [];
  const durations = [];

  for (let i = 0; i < slides.length; i++) {
    const { mime, base64 } = parseDataURL(slides[i].image.src);
    const ext = getExtension(mime);
    extensions.push(ext);
    durations.push(slides[i].duration / 1000);
    slidesFolder.file(`slide${i}${ext}`, base64, { base64: true });
  }

  const command = buildFFmpegCommand(slides, extensions, durations);

  const batScript =
`@echo off
echo Rendering slideshow...
cd slides
${command}
echo.
echo Done!
pause`;

  const readme =
`Slideshow Renderer

Requirements:
- FFmpeg installed and in PATH
- Video duration = sum of slide durations

Usage:
1. Extract ZIP
2. Open "slides" folder
3. Double-click render.bat
`;

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