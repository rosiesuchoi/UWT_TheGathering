// Talks to GitHub for the admin panel. There is no server: the browser calls
// GitHub's own API with a token the officer pastes in, and GitHub decides who
// may write. A token that cannot write to this repository cannot save.
//
// A save is one commit on the branch (blobs go in through the tree call), so
// one save is one deploy, however many files it changes.
import { club } from '../content';

const API = 'https://api.github.com';

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
  }
}

/** Raised when a file on GitHub is no longer what this page was built from. */
export class ConflictError extends GitHubError {
  constructor(readonly paths: string[]) {
    super(
      `${paths.join(' and ')} changed on GitHub since this page loaded. Reload the page, then make the edit again. ` +
        'If you saved a minute ago, the site may still be publishing that save.',
      409,
    );
  }
}

export interface SavedCommit {
  sha: string;
  url: string;
}

async function call(token: string, path: string, init: RequestInit = {}, accept = 'application/vnd.github+json'): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: accept,
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
  } catch {
    throw new GitHubError('Could not reach GitHub. Check the connection and try again.');
  }
  if (res.ok) return res;
  if (res.status === 401) throw new GitHubError('GitHub did not accept that token. It may be mistyped, expired or revoked.', 401);
  if (res.status === 403 || res.status === 404) {
    throw new GitHubError(
      `That token cannot reach ${club.repo}. You need write access to the repository, and a token that allows it: see the steps in the sign-in box.`,
      res.status,
    );
  }
  if (res.status === 422 || res.status === 409) {
    throw new GitHubError('GitHub refused the save because the branch moved while saving. Try again in a moment.', res.status);
  }
  throw new GitHubError(`GitHub answered with an error (${res.status}).`, res.status);
}

async function json<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  return (await call(token, path, init)).json() as Promise<T>;
}

/** Check the token and that it can write here. Returns the GitHub user name. */
export async function verifyToken(token: string): Promise<string> {
  const me = await json<{ login: string }>(token, '/user');
  const repo = await json<{ permissions?: { push?: boolean } }>(token, `/repos/${club.repo}`);
  if (!repo.permissions?.push) {
    throw new GitHubError(`${me.login} can read ${club.repo} but not change it. Ask an owner for write access.`, 403);
  }
  return me.login;
}

/** A text file that already exists. Checked against GitHub before it is replaced. */
export interface TextChange {
  path: string;
  content: string;
  /** What this file should look like on GitHub right now, if nobody else has touched it. */
  expected: string;
  /** Turn the text GitHub has into the same shape as `expected`. */
  normalize: (raw: string) => string;
}

/** A new binary file, such as a member's photo. Its name is unique, so nothing to check. */
export interface BinaryAdd {
  path: string;
  base64: string;
}

export type FileChange = TextChange | BinaryAdd;

/** Commit all the changes as one commit on the branch. */
export async function commitFiles(token: string, files: FileChange[], message: string): Promise<SavedCommit> {
  const repo = club.repo;
  const ref = await json<{ object: { sha: string } }>(token, `/repos/${repo}/git/ref/heads/${club.branch}`);
  const head = ref.object.sha;

  // Refuse to overwrite somebody else's change: each file must still be what
  // this page was built from.
  const stale: string[] = [];
  for (const file of files) {
    if ('base64' in file) continue;
    const res = await call(token, `/repos/${repo}/contents/${file.path}?ref=${head}`, {}, 'application/vnd.github.raw+json');
    let remote: string;
    try {
      remote = file.normalize(await res.text());
    } catch {
      remote = '';
    }
    if (remote !== file.expected) stale.push(file.path.split('/').pop() ?? file.path);
  }
  if (stale.length > 0) throw new ConflictError(stale);

  const headCommit = await json<{ tree: { sha: string } }>(token, `/repos/${repo}/git/commits/${head}`);
  // Binary files go up first as blobs; text goes straight into the tree.
  const entries: Array<{ path: string; mode: string; type: string; content?: string; sha?: string }> = [];
  for (const f of files) {
    if ('base64' in f) {
      const blob = await json<{ sha: string }>(token, `/repos/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: f.base64, encoding: 'base64' }),
      });
      entries.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    } else {
      entries.push({ path: f.path, mode: '100644', type: 'blob', content: f.content });
    }
  }
  const tree = await json<{ sha: string }>(token, `/repos/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: entries }),
  });
  const commit = await json<{ sha: string; html_url: string }>(token, `/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [head] }),
  });
  // Not forced: if the branch moved since we read it, GitHub refuses.
  await call(token, `/repos/${repo}/git/refs/heads/${club.branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });
  return { sha: commit.sha, url: commit.html_url };
}
