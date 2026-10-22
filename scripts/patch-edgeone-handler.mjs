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
// The upstream catch block writes to res (setHeader/end) — the EdgeOne
// runtime's res does not support these and turns any SSR error into an
// unhandled FRAMEWORK_HANDLER_ERROR crash. Replace it with a returned
// error Response instead.
const originalCatch = `  } catch (error) {
    console.error('SSR Error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<html><body><h1>Error</h1><p>' + error.message + '</p></body></html>');
  }
`
const patchedCatch = `  } catch (error) {
    console.error('SSR Error:', error);
    return new Response('<html><body><h1>Error</h1><p>' + (error && error.message ? error.message : 'Unknown error') + '</p></body></html>', {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
`

let source = readFileSync(handlerPath, 'utf8')
if (source.includes('responseBodyBuffer')) {
  log('already patched')
  process.exit(0)
}
if (!source.includes(original) || !source.includes(originalCatch)) {
  console.error('[patch-edgeone] handler template changed upstream, patch skipped')
  process.exit(1)
}
source = source.replace(original, patched).replace(originalCatch, patchedCatch)
writeFileSync(handlerPath, source)
log('handler patched: materialized Response body + safe error path')
