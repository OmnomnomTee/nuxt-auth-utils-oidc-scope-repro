export default defineOAuthOidcEventHandler({
  config: {
    openidConfig: {
      authorization_endpoint: 'https://identity-provider.example/authorize',
      token_endpoint: 'https://identity-provider.example/token',
      userinfo_endpoint: 'https://identity-provider.example/userinfo',
    },
  },

  async onSuccess(_event, { user, tokens }) {
    return { user, tokens }
  },
})
