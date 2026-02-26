<script setup lang="ts">
import { useTemplateRef } from 'vue';

const sidebar = useTemplateRef<HTMLDivElement>('sidebar')
const scrollBottom = () => {
  sidebar.value!.scrollTop = sidebar.value!.scrollHeight 
}
</script>

<template>
  <main class="layout">
    <div class="main">
      <slot></slot>
    </div>
    <div class="sidebar custom-scrollbar" ref="sidebar">
      <slot name="sidebar" :scrollBottom="scrollBottom"></slot>
    </div>
  </main>
</template>

<style lang="scss">
.layout {
  position: fixed;
  display: grid;
  grid-template-columns: 1fr 280px;
  inset: 0;
}

.main {
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: #d9ecffbe;
  overflow-y: scroll;
  gap: 8px;
}
</style>