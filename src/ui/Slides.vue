<script setup lang="ts">
import { watch } from 'vue';
import IconDelete from './IconDelete.vue';
import type { CroppedImage } from '../shared/types';

const props = defineProps<{ images?: CroppedImage[] }>()
const emit = defineEmits<{ add: [], drop: [string] }>()

watch(() => props.images?.length, (value, oldValue) => {
  if (typeof value !== 'number' || typeof oldValue !== 'number') return
  if (value > oldValue) emit('add')
}, { flush: 'post' })
</script>

<template>
  <div ref="scroll" class="slides">
    <button v-for="(image) in images" :key="image.id" type="button">
      <IconDelete :fill="'rgba(252, 5, 5, 0.671)'" @click="emit('drop', image.id)" />
      <img :src="image.src">
    </button>
  </div>
</template>

<style lang="scss">
.slides {
  display: flex;
  flex-direction: column;
  button {
    position: relative;
    margin: 1px;
    outline: none;
    border: 1px dashed rgb(223, 223, 247);
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff48;
    transition: border-color 0.1s;
    svg {
      opacity: 0;
      position: absolute;
      right: 8px;
      top: 8px;
    }
    &:hover {
      svg {
        opacity: 1;
      }
    }
  }
  img {
    width: 144px;
    height: auto;
    object-fit: cover;
  }
}

.slides button:has(svg:hover),
.slides button:has(svg:hover) ~ button {
  margin: 1px;
  border-color: rgba(252, 5, 5, 0.671);
  border-width: 1px;
}
</style>