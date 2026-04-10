const BASE = "/api";

function getToken() {
  return localStorage.getItem("hz_token");
}

function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const t = getToken();
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    register: (data: { username: string; email: string; password: string; displayName?: string }) =>
      req<{ token: string; user: any }>("POST", "/auth/register", data),
    login: (data: { usernameOrEmail: string; password: string }) =>
      req<{ token: string; user: any }>("POST", "/auth/login", data),
    me: () => req<any>("GET", "/auth/me"),
  },
  profile: {
    get: (userId: string) => req<any>("GET", `/profile/${userId}`),
    getByUsername: (username: string) => req<any>("GET", `/profile/by-username/${username}`),
    update: (userId: string, data: Partial<any>) => req<any>("PUT", `/profile/${userId}`, data),
    listUsers: () => req<any[]>("GET", "/users"),
  },
  wall: {
    getPosts: (userId: string) => req<any[]>("GET", `/wall/${userId}`),
    createPost: (userId: string, data: any) => req<any>("POST", `/wall/${userId}`, data),
    deletePost: (userId: string, postId: string) => req<any>("DELETE", `/wall/${userId}/${postId}`),
    likePost: (userId: string, postId: string, visitorId?: string) =>
      req<any>("POST", `/wall/${userId}/${postId}/like`, { visitorId }),
    addComment: (userId: string, postId: string, data: any) =>
      req<any>("POST", `/wall/${userId}/${postId}/comments`, data),
    deleteComment: (userId: string, postId: string, commentId: string) =>
      req<any>("DELETE", `/wall/${userId}/${postId}/comments/${commentId}`),
  },
  guestbook: {
    getEntries: (userId: string) => req<any[]>("GET", `/guestbook/${userId}`),
    addEntry: (userId: string, data: any) => req<any>("POST", `/guestbook/${userId}`, data),
    deleteEntry: (userId: string, entryId: string) =>
      req<any>("DELETE", `/guestbook/${userId}/${entryId}`),
  },
  blog: {
    getPosts: (userId: string) => req<any[]>("GET", `/blog/${userId}`),
    getPost: (userId: string, postId: string) => req<any>("GET", `/blog/${userId}/${postId}`),
    createPost: (userId: string, data: any) => req<any>("POST", `/blog/${userId}`, data),
    updatePost: (userId: string, postId: string, data: any) =>
      req<any>("PUT", `/blog/${userId}/${postId}`, data),
    deletePost: (userId: string, postId: string) =>
      req<any>("DELETE", `/blog/${userId}/${postId}`),
    addComment: (userId: string, postId: string, data: any) =>
      req<any>("POST", `/blog/${userId}/${postId}/comments`, data),
    deleteComment: (userId: string, postId: string, commentId: string) =>
      req<any>("DELETE", `/blog/${userId}/${postId}/comments/${commentId}`),
  },
  photos: {
    getAlbums: (userId: string) => req<any[]>("GET", `/photos/${userId}/albums`),
    createAlbum: (userId: string, data: any) => req<any>("POST", `/photos/${userId}/albums`, data),
    updateAlbum: (userId: string, albumId: string, data: any) =>
      req<any>("PUT", `/photos/${userId}/albums/${albumId}`, data),
    deleteAlbum: (userId: string, albumId: string) =>
      req<any>("DELETE", `/photos/${userId}/albums/${albumId}`),
    getPhotos: (userId: string) => req<any[]>("GET", `/photos/${userId}`),
    addPhoto: (userId: string, data: any) => req<any>("POST", `/photos/${userId}`, data),
    updatePhoto: (userId: string, photoId: string, data: any) =>
      req<any>("PUT", `/photos/${userId}/${photoId}`, data),
    deletePhoto: (userId: string, photoId: string) =>
      req<any>("DELETE", `/photos/${userId}/${photoId}`),
  },
};
