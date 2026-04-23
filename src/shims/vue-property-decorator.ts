// Shim: reimplements vue-property-decorator for Vue 3 + vue-class-component@8
import { Options as Component, Vue, mixins, createDecorator } from "vue-class-component"

export { Component, Vue, mixins as Mixins }

// ─── Watch ───────────────────────────────────────────────────────────────────
export function Watch (path: string, options: { immediate?: boolean; deep?: boolean } = {}) {
  return createDecorator((componentOptions, key) => {
    componentOptions.watch = componentOptions.watch || {}
    const watches = componentOptions.watch as Record<string, unknown>
    watches[path] = { handler: key, ...options }
  })
}

// ─── Prop ────────────────────────────────────────────────────────────────────
export function Prop (options: Record<string, unknown> = {}) {
  return createDecorator((componentOptions, key) => {
    componentOptions.props = componentOptions.props || {}
    const props = componentOptions.props as Record<string, unknown>
    props[key] = options
  })
}

// ─── Emit ────────────────────────────────────────────────────────────────────
export function Emit (event?: string) {
  return createDecorator((componentOptions, key) => {
    const original = (componentOptions.methods as Record<string, Function>)?.[key]
    if (!original) return
    ;(componentOptions.methods as Record<string, Function>)[key] = function (...args: unknown[]) {
      const result = original.apply(this, args)
      const emitName = event ?? key.replace(/([A-Z])/g, "-$1").toLowerCase()
      if (result instanceof Promise) {
        result.then(v => (this as Vue).$emit(emitName, ...args, v))
      } else {
        (this as Vue).$emit(emitName, ...args, result)
      }
      return result
    }
  })
}

// ─── Ref ─────────────────────────────────────────────────────────────────────
export function Ref (ref?: string) {
  return createDecorator((componentOptions, key) => {
    componentOptions.computed = componentOptions.computed || {}
    const computeds = componentOptions.computed as Record<string, unknown>
    const refName = ref ?? key
    computeds[key] = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get (this: any) { return this.$refs[refName] },
      cache: false
    }
  })
}

// ─── Inject ──────────────────────────────────────────────────────────────────
export function Inject (options?: { from?: string; default?: unknown }) {
  return createDecorator((componentOptions, key) => {
    componentOptions.inject = componentOptions.inject || {}
    const inj = componentOptions.inject as Record<string, unknown>
    inj[key] = options ?? key
  })
}

// ─── Provide ─────────────────────────────────────────────────────────────────
export function Provide (key?: string) {
  return createDecorator((componentOptions, propKey) => {
    const provide = (componentOptions.provide as Record<string, unknown>) ?? {}
    provide[key ?? propKey] = (componentOptions as unknown as Record<string, unknown>)[propKey]
    componentOptions.provide = provide
  })
}

// ─── Model (v-model prop) ────────────────────────────────────────────────────
export function Model (event: string, options: Record<string, unknown> = {}) {
  return createDecorator((componentOptions, key) => {
    componentOptions.props = componentOptions.props || {}
    const props = componentOptions.props as Record<string, unknown>
    props[key] = options
    ;(componentOptions as Record<string, unknown>).model = { prop: key, event }
  })
}

// Stubs for less-used decorators
export const InjectReactive = Inject
export const ProvideReactive = Provide
export const PropSync = Prop
export const VModel = Model
export const ModelSync = Model
