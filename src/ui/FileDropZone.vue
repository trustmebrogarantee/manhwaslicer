<script setup lang="ts">
import { useDropZone, useEventListener } from '@vueuse/core'
import { ref } from 'vue'
import { useTemplateRef } from 'vue'

const dropZoneRef = useTemplateRef('dropZoneRef')
const emit = defineEmits(['drop'])
const isDragging = ref(false)

function onDrop(files: File[] | null): void {
  emit('drop', files)
}

useEventListener(document.body, 'dragenter', () => {
  isDragging.value = true
})

useEventListener(document.body, 'dragleave', () => {
  isDragging.value = false
})

const { isOverDropZone } = useDropZone(dropZoneRef, {
  onDrop,
  dataTypes: ['image/jpeg', 'image/png'],
  multiple: false,
  preventDefaultForUnhandled: false,
})
</script>

<template>
	<div ref="dropZoneRef" :class="['file-drop-zone', { dragging: isDragging,  active: isOverDropZone }]">
	  <div class="file-drop-zone__content">
	    <div class="file-drop-zone__icon">
	      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
	    </div>
	    <div class="file-drop-zone__text">
        {{ isOverDropZone  }}
	      Drop files here or click to upload
	    </div>
	  </div>
	</div>
</template>

<style lang="scss">
.file-drop-zone {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  inset: 0;
  z-index: 1;
  width: calc(100% - 240px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  opacity: 0;
  &.dragging {
    z-index: 3;
  }
  &.active {
    z-index: 3;
    opacity: 1;
  }

  &__content {
    background-color: #f5f5f5;
    border: 2px dashed #ccc;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    text-align: center;
    max-height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  &__icon {
    margin-bottom: 16px;
  }

  &__text {
    color: #666;
  }
}
</style>