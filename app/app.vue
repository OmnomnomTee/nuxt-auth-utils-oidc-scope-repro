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
const latestSample = computed(() => result.value?.samples.at(-1))

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
  <div class="page-shell">
    <header class="site-header">
      <div class="repository-name">
        <span>nuxt-auth-utils</span>
        <span class="separator">/</span>
        <strong>oidc-scope-repro</strong>
      </div>
      <a href="https://github.com/OmnomnomTee/nuxt-auth-utils-oidc-scope-repro" target="_blank" rel="noreferrer">
        View source
      </a>
    </header>

    <main>
      <section class="intro">
        <p class="context"><span class="context-mark" /> Reproduction for v0.5.29</p>
        <h1>OIDC scopes accumulate between requests.</h1>
        <p class="summary">
          The generic OIDC handler retains its merged configuration in a long-running process.
          This example calls the real handler and inspects the redirect it produces.
        </p>
        <p class="constraint">
          No provider account, client secret, or outbound OAuth request is involved.
        </p>
      </section>

      <section class="experiment" aria-labelledby="experiment-title">
        <header class="section-heading">
          <div>
            <p class="section-number">01</p>
            <h2 id="experiment-title">Run the experiment</h2>
          </div>
          <p>Expected: <code>openid profile</code></p>
        </header>

        <div class="experiment-body">
          <div class="configuration">
            <p class="label">Runtime configuration</p>
            <pre><code>modules: ['nuxt-auth-utils']

oauth: {
  oidc: {
    clientId: 'reproduction-client',
    scope: ['openid', 'profile']
  }
}</code></pre>
          </div>

          <div class="method">
            <dl>
              <div>
                <dt>Route</dt>
                <dd><code>GET /auth/oidc</code></dd>
              </div>
              <div>
                <dt>Handler</dt>
                <dd><code>defineOAuthOidcEventHandler</code></dd>
              </div>
              <div>
                <dt>Inspection</dt>
                <dd><code>Location</code> response header</dd>
              </div>
            </dl>

            <div class="actions" aria-label="Choose the number of requests">
              <button type="button" class="secondary" :disabled="pending" @click="run(1)">1 request</button>
              <button type="button" class="primary" :disabled="pending" @click="run(5)">
                {{ pending ? 'Running…' : 'Run 5 requests' }}
              </button>
              <button type="button" class="secondary" :disabled="pending" @click="run(25)">25 requests</button>
            </div>

            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
          </div>
        </div>
      </section>

      <section v-if="result" class="evidence" aria-labelledby="evidence-title">
        <header class="section-heading">
          <div>
            <p class="section-number">02</p>
            <h2 id="evidence-title">Observed redirects</h2>
          </div>
          <p class="result-label"><span /> Bug reproduced</p>
        </header>

        <div class="finding">
          <p>
            The configured scope has <strong>2 entries</strong>. The latest response has
            <strong>{{ latestSample?.scopeEntries }}</strong>.
          </p>
          <p>
            Run another batch and the first result continues from the previous count. Browser reloads
            do not reset the shared server state.
          </p>
        </div>

        <div class="metrics">
          <div>
            <span>Latest scope entries</span>
            <strong>{{ latestSample?.scopeEntries }}</strong>
          </div>
          <div>
            <span>Configured entries</span>
            <strong>2</strong>
          </div>
          <div>
            <span>Latest URL length</span>
            <strong>{{ latestSample?.authorizationUrlLength }}</strong>
          </div>
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
                <td class="failure-value">{{ sample.scopeEntries }}</td>
                <td>{{ sample.openidOccurrences }}</td>
                <td>{{ sample.profileOccurrences }}</td>
                <td>{{ sample.authorizationUrlLength }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <details>
          <summary>Inspect the final scope value</summary>
          <pre class="scope-output"><code>{{ latestSample?.scope }}</code></pre>
        </details>
      </section>

      <section class="implementation" aria-labelledby="implementation-title">
        <header class="section-heading compact">
          <div>
            <p class="section-number">03</p>
            <h2 id="implementation-title">Implementation</h2>
          </div>
        </header>
        <div class="file-list">
          <div>
            <code>nuxt.config.ts</code>
            <span>Module and runtime scopes</span>
          </div>
          <div>
            <code>server/routes/auth/oidc.get.ts</code>
            <span>Generic OIDC handler</span>
          </div>
          <div>
            <code>server/api/reproduce.get.ts</code>
            <span>Repeated requests and redirect inspection</span>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <span>Nuxt 4.3.1</span>
      <span>nuxt-auth-utils 0.5.29</span>
      <span>Node 22+</span>
    </footer>
  </div>
</template>

<style>
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #1a1a18;
  background: #f6f6f3;
  font-synthesis: none;
}

* { box-sizing: border-box; }
body { margin: 0; background: #f6f6f3; }
button, code { font: inherit; }
code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .9em; }

.page-shell {
  width: min(100% - 2rem, 62rem);
  margin: 0 auto;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 4rem;
  border-bottom: 1px solid #d8d8d2;
  font-size: .86rem;
}

.repository-name { display: flex; align-items: center; gap: .45rem; }
.repository-name span:first-child { color: #696963; }
.repository-name .separator { color: #aaa9a1; }
.site-header a { color: #3f3f3a; text-decoration: none; border-bottom: 1px solid #aaa9a1; }
.site-header a:hover { color: #000; border-color: #000; }

main { padding: 5rem 0 2rem; }
.intro { max-width: 48rem; padding-bottom: 4rem; }
.context, .label, .section-number {
  margin: 0;
  color: #676760;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.context { display: flex; align-items: center; gap: .55rem; }
.context-mark { width: .5rem; height: .5rem; border-radius: 50%; background: #b42318; }
h1 { margin: 1.25rem 0 1.5rem; max-width: 46rem; font-size: clamp(2.5rem, 7vw, 4.7rem); line-height: 1.02; letter-spacing: -.05em; font-weight: 650; }
.summary { max-width: 42rem; margin: 0; color: #55554f; font-size: 1.12rem; line-height: 1.7; }
.constraint { margin: 1.3rem 0 0; color: #74746d; font-size: .9rem; }

section:not(.intro) { border-top: 1px solid #c9c9c2; padding: 2rem 0 4rem; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; margin-bottom: 2rem; }
.section-heading > div { display: flex; align-items: baseline; gap: 1rem; }
.section-heading h2 { margin: 0; font-size: 1.35rem; letter-spacing: -.025em; }
.section-heading > p { margin: .2rem 0 0; color: #686862; font-size: .82rem; }
.section-number { color: #9b9b94; }
.section-heading.compact { margin-bottom: 1rem; }

.experiment-body { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(17rem, .9fr); gap: 3rem; }
.configuration .label { margin-bottom: .7rem; }
pre { margin: 0; overflow: auto; border: 1px solid #d4d4cd; background: #eeeeea; padding: 1.15rem; color: #292925; line-height: 1.6; }
.method { display: flex; flex-direction: column; justify-content: space-between; }
dl { margin: 0; }
dl > div { display: grid; grid-template-columns: 5.5rem 1fr; gap: 1rem; padding: .7rem 0; border-bottom: 1px solid #ddddd7; }
dt { color: #777770; font-size: .78rem; }
dd { margin: 0; font-size: .84rem; overflow-wrap: anywhere; }

.actions { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 2rem; }
button { min-height: 2.55rem; border: 1px solid #1e1e1b; border-radius: .2rem; padding: .55rem .8rem; font-size: .82rem; font-weight: 650; cursor: pointer; }
button.primary { background: #1e1e1b; color: #fff; }
button.secondary { background: transparent; color: #1e1e1b; border-color: #b8b8b1; }
button:hover:not(:disabled) { transform: translateY(-1px); }
button.secondary:hover:not(:disabled) { border-color: #1e1e1b; }
button:disabled { cursor: wait; opacity: .5; }
.error { margin: 1rem 0 0; color: #a42117; font-size: .85rem; }

.result-label { display: flex; align-items: center; gap: .45rem; color: #9c2017 !important; font-weight: 700; }
.result-label span { width: .45rem; height: .45rem; border-radius: 50%; background: #b42318; }
.finding { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
.finding p { margin: 0; color: #55554f; line-height: 1.65; }
.finding strong { color: #1a1a18; }
.metrics { display: grid; grid-template-columns: repeat(3, 1fr); border: 1px solid #d4d4cd; margin-bottom: 2rem; }
.metrics > div { padding: 1rem 1.1rem; }
.metrics > div + div { border-left: 1px solid #d4d4cd; }
.metrics span { display: block; color: #777770; font-size: .72rem; }
.metrics strong { display: block; margin-top: .3rem; font-family: "SFMono-Regular", Consolas, monospace; font-size: 1.45rem; font-weight: 500; }

.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
th, td { border-bottom: 1px solid #d8d8d2; padding: .72rem .8rem; text-align: right; white-space: nowrap; }
th:first-child, td:first-child { padding-left: 0; text-align: left; }
th:last-child, td:last-child { padding-right: 0; }
th { color: #777770; font-size: .7rem; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; }
td { font-family: "SFMono-Regular", Consolas, monospace; font-size: .83rem; }
.failure-value { color: #a42117; font-weight: 700; }
details { margin-top: 1.5rem; }
summary { width: fit-content; cursor: pointer; color: #50504a; font-size: .82rem; border-bottom: 1px solid #aaa9a1; }
.scope-output { max-height: 15rem; margin-top: 1rem; white-space: pre-wrap; overflow-wrap: anywhere; }

.implementation { padding-bottom: 2rem !important; }
.file-list > div { display: grid; grid-template-columns: minmax(16rem, .8fr) 1fr; gap: 2rem; padding: .8rem 0; border-bottom: 1px solid #ddddd7; }
.file-list span { color: #6e6e67; font-size: .84rem; }
footer { display: flex; flex-wrap: wrap; gap: 1.3rem; border-top: 1px solid #c9c9c2; padding: 1.4rem 0 3rem; color: #81817a; font-family: "SFMono-Regular", Consolas, monospace; font-size: .72rem; }

@media (max-width: 44rem) {
  main { padding-top: 3rem; }
  .site-header { align-items: flex-start; padding: 1rem 0; gap: 1rem; }
  .repository-name { flex-wrap: wrap; }
  .experiment-body, .finding { grid-template-columns: 1fr; gap: 1.5rem; }
  .section-heading { flex-direction: column; gap: .7rem; }
  .metrics { grid-template-columns: 1fr; }
  .metrics > div + div { border-left: 0; border-top: 1px solid #d4d4cd; }
  .file-list > div { grid-template-columns: 1fr; gap: .3rem; }
}
</style>
