<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { initCustomerLevels } from '@/utils/customerLevel'

const auth = useAuthStore()

onMounted(() => {
  if (auth.isLoggedIn) initCustomerLevels()
})

watch(() => auth.isLoggedIn, (v) => {
  if (v) initCustomerLevels()
})
</script>
