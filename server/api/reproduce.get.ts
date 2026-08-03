interface ScopeSample {
  request: number
  scopeEntries: number
  openidOccurrences: number
  profileOccurrences: number
  authorizationUrlLength: number
  scope: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const requestedCount = Number(query.count || 5)
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(Math.trunc(requestedCount), 1), 25)
    : 5
  const samples: ScopeSample[] = []

  for (let index = 0; index < count; index++) {
    const response = await $fetch.raw('/auth/oidc', {
      redirect: 'manual',
      ignoreResponseError: true,
    })
    const location = response.headers.get('location')

    if (!location) {
      throw createError({
        statusCode: 500,
        message: 'The OIDC handler did not return a Location header.',
      })
    }

    const scope = new URL(location).searchParams.get('scope') || ''
    const entries = scope.split(/\s+/).filter(Boolean)

    samples.push({
      request: index + 1,
      scopeEntries: entries.length,
      openidOccurrences: entries.filter(entry => entry === 'openid').length,
      profileOccurrences: entries.filter(entry => entry === 'profile').length,
      authorizationUrlLength: location.length,
      scope,
    })
  }

  return {
    package: 'nuxt-auth-utils@0.5.29',
    configuredScope: ['openid', 'profile'],
    samples,
  }
})
