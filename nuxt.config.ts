export default defineNuxtConfig({
  compatibilityDate: '2026-02-23',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils'],

  runtimeConfig: {
    session: {
      password: 'reproduction-only-password-at-least-32-characters',
    },
    oauth: {
      oidc: {
        clientId: 'reproduction-client',
        scope: ['openid', 'profile'],
      },
    },
  },
})
