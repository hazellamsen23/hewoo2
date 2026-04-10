import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../../data");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readFile<T>(name: string): T[] {
  const fp = filePath(name);
  if (!fs.existsSync(fp)) return [];
  try {
    return JSON.parse(fs.readFileSync(fp, "utf-8")) as T[];
  } catch {
    return [];
  }
}

function writeFile<T>(name: string, data: T[]): void {
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2), "utf-8");
}

export const db = {
  users: {
    all: () => readFile<User>("users"),
    findById: (id: string) => readFile<User>("users").find((u) => u.id === id),
    findByUsername: (username: string) =>
      readFile<User>("users").find(
        (u) => u.username.toLowerCase() === username.toLowerCase()
      ),
    findByEmail: (email: string) =>
      readFile<User>("users").find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ),
    save: (user: User) => {
      const users = readFile<User>("users").filter((u) => u.id !== user.id);
      writeFile("users", [...users, user]);
    },
    update: (id: string, patch: Partial<User>) => {
      const users = readFile<User>("users");
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) return null;
      users[idx] = { ...users[idx], ...patch, updatedAt: new Date().toISOString() };
      writeFile("users", users);
      return users[idx];
    },
  },

  wallPosts: {
    all: () => readFile<WallPost>("wall_posts"),
    forUser: (userId: string) =>
      readFile<WallPost>("wall_posts")
        .filter((p) => p.wallOwnerId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    save: (post: WallPost) => {
      const posts = readFile<WallPost>("wall_posts");
      writeFile("wall_posts", [post, ...posts]);
    },
    update: (id: string, patch: Partial<WallPost>) => {
      const posts = readFile<WallPost>("wall_posts");
      const idx = posts.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      posts[idx] = { ...posts[idx], ...patch };
      writeFile("wall_posts", posts);
      return posts[idx];
    },
    delete: (id: string) => {
      const posts = readFile<WallPost>("wall_posts").filter((p) => p.id !== id);
      writeFile("wall_posts", posts);
    },
  },

  guestbook: {
    forUser: (userId: string) =>
      readFile<GuestbookEntry>("guestbook")
        .filter((e) => e.profileUserId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    save: (entry: GuestbookEntry) => {
      const entries = readFile<GuestbookEntry>("guestbook");
      writeFile("guestbook", [entry, ...entries]);
    },
    delete: (id: string) => {
      const entries = readFile<GuestbookEntry>("guestbook").filter((e) => e.id !== id);
      writeFile("guestbook", entries);
    },
  },

  blogs: {
    all: () => readFile<BlogPost>("blogs"),
    forUser: (userId: string) =>
      readFile<BlogPost>("blogs")
        .filter((b) => b.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    public: () =>
      readFile<BlogPost>("blogs")
        .filter((b) => b.visibility === "public")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    findById: (id: string) => readFile<BlogPost>("blogs").find((b) => b.id === id),
    save: (post: BlogPost) => {
      const posts = readFile<BlogPost>("blogs");
      writeFile("blogs", [post, ...posts]);
    },
    update: (id: string, patch: Partial<BlogPost>) => {
      const posts = readFile<BlogPost>("blogs");
      const idx = posts.findIndex((b) => b.id === id);
      if (idx === -1) return null;
      posts[idx] = { ...posts[idx], ...patch, updatedAt: new Date().toISOString() };
      writeFile("blogs", posts);
      return posts[idx];
    },
    delete: (id: string) => {
      const posts = readFile<BlogPost>("blogs").filter((b) => b.id !== id);
      writeFile("blogs", posts);
    },
  },

  photos: {
    forUser: (userId: string) =>
      readFile<Photo>("photos")
        .filter((p) => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    save: (photo: Photo) => {
      const photos = readFile<Photo>("photos");
      writeFile("photos", [photo, ...photos]);
    },
    update: (id: string, patch: Partial<Photo>) => {
      const photos = readFile<Photo>("photos");
      const idx = photos.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      photos[idx] = { ...photos[idx], ...patch };
      writeFile("photos", photos);
      return photos[idx];
    },
    delete: (id: string) => {
      const photos = readFile<Photo>("photos").filter((p) => p.id !== id);
      writeFile("photos", photos);
    },
  },

  albums: {
    forUser: (userId: string) =>
      readFile<Album>("albums").filter((a) => a.userId === userId),
    findById: (id: string) => readFile<Album>("albums").find((a) => a.id === id),
    save: (album: Album) => {
      const albums = readFile<Album>("albums");
      writeFile("albums", [album, ...albums]);
    },
    update: (id: string, patch: Partial<Album>) => {
      const albums = readFile<Album>("albums");
      const idx = albums.findIndex((a) => a.id === id);
      if (idx === -1) return null;
      albums[idx] = { ...albums[idx], ...patch };
      writeFile("albums", albums);
      return albums[idx];
    },
    delete: (id: string) => {
      writeFile("albums", readFile<Album>("albums").filter((a) => a.id !== id));
    },
  },
};

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  statusText: string;
  profilePic: string;
  aboutItems: string[];
  zodiac: string;
  bloodType: string;
  funFacts: string[];
  location: string;
  course: string;
  bio: string;
  customCSS: string;
  bgColor: string;
  textColor: string;
  linkColor: string;
  fontFamily: string;
  bgMusicUrl: string;
  bgMusicEnabled: boolean;
  bgMusicVolume: number;
  cursorEffect: string;
  marqueeText: string;
  glitterEnabled: boolean;
  siteTitle: string;
  controlPanelTitle: string;
  aboutTitle: string;
  navHomeLabel: string;
  navProfileLabel: string;
  navGalleryLabel: string;
  navBlogLabel: string;
  navGuestbookLabel: string;
  top8Label: string;
  top8Count: number;
  top8Friends: Friend[];
  playlist: PlaylistItem[];
  profileSong: ProfileSong;
  createdAt: string;
  updatedAt: string;
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  profileUrl: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  url: string;
}

export interface ProfileSong {
  url: string;
  title: string;
  startTime: number;
  endTime: number;
}

export interface WallComment {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  text: string;
  voiceData: string;
  createdAt: string;
}

export interface WallPost {
  id: string;
  wallOwnerId: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string;
  text: string;
  img: string;
  comments: WallComment[];
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface GuestbookEntry {
  id: string;
  profileUserId: string;
  authorId: string | null;
  authorName: string;
  message: string;
  sticker: string;
  gifUrl: string;
  voiceData: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  visibility: "public" | "friends" | "private" | "specific";
  specificUserId: string;
  coverImage: string;
  comments: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  authorId: string | null;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Photo {
  id: string;
  userId: string;
  albumId: string;
  url: string;
  caption: string;
  createdAt: string;
}

export interface Album {
  id: string;
  userId: string;
  name: string;
  description: string;
  coverPhoto: string;
  createdAt: string;
}
