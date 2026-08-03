# `nuxt-auth-utils` OIDC scope accumulation reproduction

Minimal Nuxt reproduction for a cross-request state bug in
`defineOAuthOidcEventHandler` from `nuxt-auth-utils@0.5.29`.

The reproduction uses the real Nuxt module and generic OIDC handler. No real identity provider,
client secret, or completed login is required. The fake provider endpoints use the reserved
`.example` domain and are never contacted.

## Run

```bash
corepack enable
pnpm install
pnpm dev
```

Open <http://localhost:3000> and click **Run 5 requests**.

## Expected

Every authorization redirect should contain two scope entries:

```text
openid profile
```

## Actual with `nuxt-auth-utils@0.5.29`

The same handler instance retains the merged configuration. Each request appends another
`openid profile openid` sequence:

```text
Request 1:  openid profile openid
Request 2:  openid profile openid openid profile openid
Request 3:  openid profile openid openid profile openid openid profile openid
```

The UI calls `/api/reproduce`, which invokes the real `/auth/oidc` route without following the
redirect and reads the generated `Location` header. Restarting the Nuxt process resets the count;
reloading the browser page does not.

## Relevant files

- [`nuxt.config.ts`](./nuxt.config.ts) configures `nuxt-auth-utils` and `scope: ['openid', 'profile']`.
- [`server/routes/auth/oidc.get.ts`](./server/routes/auth/oidc.get.ts) uses
  `defineOAuthOidcEventHandler`.
- [`server/api/reproduce.get.ts`](./server/api/reproduce.get.ts) makes the repeated requests and
  returns the observed scope counts.

## CodeSandbox

Import this repository into CodeSandbox with:

```text
https://codesandbox.io/p/github/OmnomnomTee/nuxt-auth-utils-oidc-scope-repro
```
