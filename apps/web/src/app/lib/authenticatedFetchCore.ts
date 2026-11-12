interface FetchDependencies {
  apiOrigin: string;
  baseOrigin: string;
  publicAnonKey: string;
  getAccessToken: () => Promise<string | undefined>;
  send: typeof fetch;
}

export function createAuthenticatedFetch(dependencies: FetchDependencies): typeof fetch {
  return async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input), dependencies.baseOrigin);
    if (url.origin !== dependencies.apiOrigin || !url.pathname.startsWith('/functions/v1/make-server-3bd0ade8/')) {
      return dependencies.send(input, init);
    }
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    const authorization = headers.get('Authorization');
    if (!authorization || authorization === `Bearer ${dependencies.publicAnonKey}`) {
      const token = await dependencies.getAccessToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
    return dependencies.send(input, { ...init, headers });
  };
}
