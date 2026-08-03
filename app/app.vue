<script setup lang="ts">
interface ScopeSample {
  request: number
  scopeEntries: number
  openidOccurrences: number
  profileOccurrences: number
  authorizationUrlLength: number
  scope: string
}

interface ReproductionResult {
  package: string
  configuredScope: string[]
  samples: ScopeSample[]
}

const result = ref<ReproductionResult>()
const pending = ref(false)
const errorMessage = ref('')

async function run(count: number) {
  pending.value = true
  errorMessage.value = ''

  try {
    result.value = await $fetch('/api/reproduce', { query: { count } })
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <main>
    <section class="hero">
      <p class="eyebrow">Minimal Nuxt reproduction</p>
      <h1><code>nuxt-auth-utils</code> OIDC scope accumulation</h1>
      <p class="lead">
        This page calls a real <code>defineOAuthOidcEventHandler</code> route repeatedly.
        No identity provider or credentials are required; only the generated redirect is inspected.
      </p>
      <div class="badges">
        <span>nuxt-auth-utils 0.5.29</span>
        <span>Nuxt 4.3.1</span>
        <span>Node ≥ 22</span>
      </div>
    </section>

    <section class="card">
      <h2>Configuration used by the real auth module</h2>
      <pre><code>modules: ['nuxt-auth-utils']

oauth: {
  oidc: {
    clientId: 'reproduction-client',
    scope: ['openid', 'profile']
  }
}</code></pre>

      <p>
        Expected on every request: <code>openid profile</code> (2 entries). With the bug,
        <code>defu</code> merges into the retained handler configuration and the list grows.
      </p>

      <div class="actions">
        <button :disabled="pending" @click="run(1)">Run 1 request</button>
        <button :disabled="pending" @click="run(5)">Run 5 requests</button>
        <button :disabled="pending" @click="run(25)">Run 25 requests</button>
      </div>

      <p v-if="pending" class="notice">Calling <code>/auth/oidc</code>…</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>

    <section v-if="result" class="card">
      <div class="result-heading">
        <div>
          <p class="eyebrow">Actual result</p>
          <h2>Scope grows in the same server process</h2>
        </div>
        <strong>{{ result.package }}</strong>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Request</th>
              <th>Scope entries</th>
              <th><code>openid</code></th>
              <th><code>profile</code></th>
              <th>URL length</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sample in result.samples" :key="`${sample.request}-${sample.scopeEntries}`">
              <td>{{ sample.request }}</td>
              <td class="danger">{{ sample.scopeEntries }}</td>
              <td>{{ sample.openidOccurrences }}</td>
              <td>{{ sample.profileOccurrences }}</td>
              <td>{{ sample.authorizationUrlLength }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <details>
        <summary>Show the final generated scope</summary>
        <pre><code>{{ result.samples.at(-1)?.scope }}</code></pre>
      </details>

      <p class="notice">
        Run another batch: the first row continues from the previous result. Reloading the page does
        not reset the server state; restarting the Nuxt process does.
      </p>
    </section>

    <section class="card source">
      <h2>Relevant files</h2>
      <ul>
        <li><code>nuxt.config.ts</code> — registers <code>nuxt-auth-utils</code> and the runtime scopes</li>
        <li><code>server/routes/auth/oidc.get.ts</code> — the real generic OIDC handler</li>
        <li><code>server/api/reproduce.get.ts</code> — calls the route and reads only its redirect header</li>
      </ul>
    </section>
  </main>
</template>

<style>
:root {
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: #08111f;
  color: #e5edf8;
}

* { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(circle at top, #183354 0, #08111f 42rem); }
button, code { font: inherit; }

main {
  width: min(100% - 2rem, 68rem);
  margin: 0 auto;
  padding: 4rem 0;
}

.hero { padding: 2rem 0; }
.eyebrow { margin: 0 0 .6rem; color: #69d5ff; font-size: .8rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
h1 { max-width: 56rem; margin: 0; font-size: clamp(2.4rem, 7vw, 5rem); line-height: 1; letter-spacing: -.045em; }
h2 { margin: 0 0 1rem; font-size: 1.35rem; }
.lead { max-width: 48rem; margin: 1.5rem 0; color: #b8c8dc; font-size: 1.1rem; line-height: 1.7; }
.badges { display: flex; flex-wrap: wrap; gap: .6rem; }
.badges span { border: 1px solid #355170; border-radius: 999px; padding: .45rem .75rem; background: #10223a; color: #c8d8ea; }

.card {
  margin-top: 1.25rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  border: 1px solid #29445f;
  border-radius: 1.1rem;
  background: rgb(11 26 44 / 88%);
  box-shadow: 0 1.2rem 4rem rgb(0 0 0 / 24%);
}

pre { overflow: auto; border: 1px solid #243c57; border-radius: .7rem; padding: 1rem; background: #050c16; color: #bce7ff; line-height: 1.55; }
code { color: #9ee6ff; }
.actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 1.5rem; }
button { border: 0; border-radius: .65rem; padding: .75rem 1rem; background: #27b8e8; color: #03111a; font-weight: 800; cursor: pointer; }
button:hover { background: #72dcff; }
button:disabled { cursor: wait; opacity: .55; }
.notice { margin: 1rem 0 0; border-left: 3px solid #4bc9f4; padding-left: .85rem; color: #b8c8dc; }
.error { color: #ff9a9a; }
.result-heading { display: flex; flex-wrap: wrap; align-items: start; justify-content: space-between; gap: 1rem; }
.result-heading strong { color: #69d5ff; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
th, td { border-bottom: 1px solid #29445f; padding: .7rem .85rem; text-align: right; white-space: nowrap; }
th:first-child, td:first-child { text-align: left; }
th { color: #9eb1c8; font-size: .8rem; text-transform: uppercase; }
.danger { color: #ff9a9a; font-weight: 900; }
details { margin-top: 1rem; }
summary { cursor: pointer; color: #69d5ff; font-weight: 700; }
.source li { margin: .65rem 0; color: #b8c8dc; }

@media (max-width: 40rem) {
  main { padding-top: 2rem; }
  .card { border-radius: .8rem; }
}
</style>
