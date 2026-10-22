// Post-build patch for the @edgeone/astro adapter's generated handler.
// The upstream template (v1.1.4) returns the raw Web Response whose body is a
// ReadableStream; the EdgeOne Node function runtime fails to consume it and
// answers with an empty 200 body. Rewrite the handler to return a Response
// with a fully materialized Buffer body instead. Skips silently when the
// EdgeOne build output does not exist (e.g. Docker/Node builds).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'

const log = message => console.info(`[patch-edgeone] ${message}`)

const handlerPath = '.edgeone/cloud-functions/ssr-node/handler.js'
if (!existsSync(handlerPath)) {
  log('no .edgeone output, skipping')
  process.exit(0)
}

const original = `    // await handleResponse(res, response);
    return response;
`
const patched = `    // Patched: materialize the Astro response body so the EdgeOne Node
    // function runtime (which cannot consume a streaming ReadableStream)
    // serves the full page instead of an empty 200.
    const responseBodyBuffer = Buffer.from(await response.arrayBuffer());
    return new Response(responseBodyBuffer, {
      status: response.status,
      headers: response.headers,
    });
`

let source = readFileSync(handlerPath, 'utf8')
if (source.includes('responseBodyBuffer')) {
  log('already patched')
  process.exit(0)
}
if (!source.includes(original)) {
  console.error('[patch-edgeone] handler template changed upstream, patch skipped')
  process.exit(1)
}
source = source.replace(original, patched)
writeFileSync(handlerPath, source)
log('handler patched: materialized Response body')
