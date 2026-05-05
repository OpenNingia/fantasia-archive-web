import { computed } from "vue"
import { useQuasar } from "quasar"

export function useIsMobile () {
  const q = useQuasar()
  return computed(() => q.screen.lt.md)
}
