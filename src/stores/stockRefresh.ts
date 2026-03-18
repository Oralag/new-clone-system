import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStockRefreshStore = defineStore('stockRefresh', () => {
  const version = ref(0)
  function trigger() { version.value++ }
  return { version, trigger }
})
