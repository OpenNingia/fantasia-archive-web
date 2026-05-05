import { inject } from "vue"
import type { InjectionKey, Ref } from "vue"

export interface MobileDrawerHandle {
  open: Ref<boolean>
  toggle: () => void
}

export const MOBILE_DRAWER_KEY: InjectionKey<MobileDrawerHandle> = Symbol("mobileDrawer")

export function useMobileDrawer (): MobileDrawerHandle | null {
  return inject(MOBILE_DRAWER_KEY, null)
}
