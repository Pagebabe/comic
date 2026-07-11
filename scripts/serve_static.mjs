import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MIME_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp']
]);

function resolveRequestPath(rootDirectory, pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = normalize(decoded).replace(/^([/\\])+/, '');
  const candidate = resolve(rootDirectory, relative || '.');
  const rootPrefix = `${resolve(rootDirectory)}${sep}`;
  if (candidate !== resolve(rootDirectory) && !candidate.startsWith(rootPrefix)) {
    throw new Error('PATH_OUTSIDE_ROOT');
  }
  return candidate;
}

async function resolveFile(rootDirectory, pathname) {
  let candidate = resolveRequestPath(rootDirectory, pathname);
  try {
    const metadata = await stat(candidate);
    if (metadata.isDirectory()) candidate = join(candidate, 'index.html');
    const fileMetadata = await stat(candidate);
    return fileMetadata.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

export async function startStaticServer({ directory, host = '127.0.0.1', port = 0 } = {}) {
  if (!directory) throw new Error('STATIC_SERVER_DIRECTORY_REQUIRED');
  const rootDirectory = resolve(directory);
  const rootMetadata = await stat(rootDirectory);
  if (!rootMetadata.isDirectory()) throw new Error('STATIC_SERVER_DIRECTORY_INVALID');

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || '/', `http://${request.headers.host || host}`);
      const file = await resolveFile(rootDirectory, url.pathname);
      if (!file) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': MIME_TYPES.get(extname(file).toLowerCase()) || 'application/octet-stream'
      });
      createReadStream(file).pipe(response);
    } catch (error) {
      const forbidden = error instanceof Error && error.message === 'PATH_OUTSIDE_ROOT';
      response.writeHead(forbidden ? 403 : 500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(forbidden ? 'Forbidden' : 'Internal server error');
    }
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.once('error', rejectPromise);
    server.listen(port, host, () => {
      server.off('error', rejectPromise);
      resolvePromise();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('STATIC_SERVER_ADDRESS_UNAVAILABLE');
  const url = `http://${host}:${address.port}/`;
  return {
    server,
    url,
    close: () => new Promise((resolvePromise, rejectPromise) => {
      server.close((error) => error ? rejectPromise(error) : resolvePromise());
    })
  };
}

function valueAfter(args, flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
}

const invokedDirectly = process.argv[1]
  && pathToFileURL(fileURLToPath(pathToFileURL(process.argv[1]))).href === import.meta.url;

if (invokedDirectly) {
  const args = process.argv.slice(2);
  const directory = valueAfter(args, '--dir', process.cwd());
  const port = Number(valueAfter(args, '--port', '4178'));
  const instance = await startStaticServer({ directory, port });
  console.log(JSON.stringify({ status: 'ready', directory: resolve(directory), url: instance.url }));
  const stop = async () => {
    await instance.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
