<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import Canvas from './ui/Canvas.vue';
import FileDropZone from './ui/FileDropZone.vue'
import Layout from './ui/Layout.vue';
import Slides from './ui/Slides.vue';
import type { Slide, CroppedImage, Audio } from './shared/types';
import VideoAssembler from './ui/VideoAssembler.vue';

const images = ref<CroppedImage[]>([])
const slides = ref<Slide[]>([])
const sfx = ref<Audio[]>([])

const canvas = useTemplateRef('canvas')

const addSlide = (img: CroppedImage) => {
  images.value.push(img)
  slides.value.push({ duration: 4000, image: img })
}

const dropImagesUpTo = (id: string) => {
  for (let i = images.value.length - 1; i >= 0; i--) {
    const currentId = images.value[i]?.id
    images.value.pop()
    slides.value.pop()
    if (currentId === id) break;
  }
  canvas.value?.dropChangesUpTo?.(id)
}
</script>

<template>
  <Layout>
    <template #sidebar="{ scrollBottom }">
      <Slides :images="images" @add="scrollBottom" @drop="id => dropImagesUpTo(id)" />
      <VideoAssembler class="sticky bottom-0 mt-auto" :slides="slides" :sfx="sfx" />
    </template>
    <Canvas ref="canvas" @crop="addSlide">
      <template #default="{ uploadImage }">
        <FileDropZone @drop="uploadImage" />
      </template>
    </Canvas>
  </Layout>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
