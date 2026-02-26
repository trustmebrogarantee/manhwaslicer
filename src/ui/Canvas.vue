<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { onUnmounted } from 'vue';
import { ManhwaSlicer } from '../domain/ManhwaSlicer';
import type { CroppedImage } from '../shared/types';

const container = useTemplateRef<HTMLDivElement>('container')
  const emit = defineEmits<{ crop: [CroppedImage] }>()

let manhwaSlicer: ManhwaSlicer | null = null

function uploadImage (files: File[]) {
  if (manhwaSlicer) manhwaSlicer.destroy()
  if (files.length === 0) return
  const file: File = files[0]!
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.src = url
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const cavnas = document.createElement('canvas')
    container.value?.appendChild(cavnas)
    manhwaSlicer = new ManhwaSlicer(img, container.value!, cavnas)
    manhwaSlicer.start()
    manhwaSlicer.on('crop', src => {
      emit('crop', src)
    })
  }
}

defineExpose({
  dropChangesUpTo: (id: CroppedImage["id"]) => manhwaSlicer?.dropChangesUpTo(id)
})

onUnmounted(() => {
  if (manhwaSlicer) manhwaSlicer.destroy()
})
</script>

<template>
  <slot :uploadImage="uploadImage"></slot>
  <div ref="container" class="canvas">
  </div>
</template>

<style lang="scss">
.canvas {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  background: aliceblue;
}
</style>