export const CLIENT_URL = 'http://localhost:5173';
export const API_URL = 'http://localhost:4000/api';

async function answers(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

// The capture drives a running app and creates accounts, so it only runs against a local development setup.
export async function preflight() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to run with NODE_ENV=production: the capture creates throwaway accounts.',
    );
  }
  for (const [name, url] of [
    ['client', `${CLIENT_URL}/`],
    ['API', `${API_URL}/health`],
  ]) {
    try {
      await answers(url);
    } catch (error) {
      throw new Error(
        `The ${name} is not answering at ${url} (${error.message}). Start the app with "npm run db:up" and "npm run dev", then run this again.`,
        { cause: error },
      );
    }
  }
}
