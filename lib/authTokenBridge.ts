/**
 * Thin bridge so AuthContext can push the auth token to chatHistoryService
 * without creating a circular import between the two modules.
 */
let _token: string | null = null;

export function setSharedAuthToken(token: string) {
  _token = token;
}

export function getSharedAuthToken(): string | null {
  return _token;
}

export function clearSharedAuthToken() {
  _token = null;
}
