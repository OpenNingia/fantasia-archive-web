<template>
  <q-page class="flex flex-center bg-dark">
    <q-card dark class="login-card q-pa-lg">
      <q-card-section class="text-center q-mb-md">
        <div class="text-h5 text-primary">Fantasia Archive</div>
        <div class="text-caption text-grey-5">Sign in to continue</div>
      </q-card-section>

      <q-card-section v-if="oidcAvailable">
        <q-btn
          color="primary"
          class="full-width q-mb-md"
          icon="mdi-login"
          label="Sign in with SSO"
          :href="oidcLoginUrl"
        />
        <q-separator dark class="q-mb-md" />
      </q-card-section>

      <q-card-section v-if="localAuthEnabled">
        <q-form @submit="submitLocalLogin">
          <q-input
            v-model="email"
            dark
            filled
            type="email"
            label="Email"
            class="q-mb-sm"
            :rules="[v => !!v || 'Required']"
          />
          <q-input
            v-model="password"
            dark
            filled
            type="password"
            label="Password"
            class="q-mb-md"
            :rules="[v => !!v || 'Required']"
          />
          <q-btn
            type="submit"
            color="primary"
            class="full-width"
            label="Sign in"
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-card-section v-if="error" class="text-negative text-center text-caption">
        {{ error }}
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from "vue"
import { useRouter, useRoute } from "vue-router"
import { authApi } from "src/services/api/authApi"
import { useStore } from "src/store"

export default defineComponent({
  name: "LoginPage",

  setup () {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()

    const email = ref("")
    const password = ref("")
    const loading = ref(false)
    const error = ref("")

    const localAuthEnabled = computed(() => process.env.LOCAL_AUTH_ENABLED !== "false")
    const oidcAvailable = computed(() => !!process.env.OIDC_ISSUER_URL)
    const oidcLoginUrl = computed(() => authApi.oidcLoginUrl())

    async function submitLocalLogin () {
      error.value = ""
      loading.value = true
      try {
        await authApi.localLogin(email.value, password.value)
        const user = await authApi.me()
        store.commit("projectModule/SET_CURRENT_USER", user)
        const redirect = (route.query.redirect as string) || "/"
        await router.push(redirect)
      } catch {
        error.value = "Invalid email or password."
      } finally {
        loading.value = false
      }
    }

    return { email, password, loading, error, localAuthEnabled, oidcAvailable, oidcLoginUrl, submitLocalLogin }
  }
})
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 380px;
}
</style>
