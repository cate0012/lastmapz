interface PreparedStatement {
  bind(...params: unknown[]): PreparedStatement;
  run(): Promise<any>;
  all<T = any>(): Promise<{ results: T[] }>;
  first<T = any>(col?: string): Promise<T | null>;
}

export interface DbBinding {
  prepare(sql: string): PreparedStatement;
  exec(sql: string): Promise<any>;
  batch(stmts: PreparedStatement[]): Promise<any[]>;
}

export interface Env {
  DB: DbBinding;
  ACCORID_CLIENT_ID: string;
  ACCORID_CLIENT_SECRET: string;
  APP_URL: string;
}

export interface User {
  id: number;
  game_id: string;
  accorid_id: string | null;
  name: string;
  head_img: string | null;
  server_id: string | null;
  level: number;
  created_at: number;
  updated_at: number;
}

export interface MapRecord {
  id: string;
  name: string;
  owner_id: number;
  version: number;
  created_at: number;
  updated_at: number;
}

export interface Tile {
  map_id: string;
  q: number;
  r: number;
  color: string | null;
  label: string | null;
  icon: string | null;
  updated_by: number | null;
  updated_at: number;
}

export interface TileChange {
  id: number;
  map_id: string;
  q: number;
  r: number;
  color: string | null;
  label: string | null;
  icon: string | null;
  version: number;
  changed_by: number | null;
  changed_at: number;
}

export interface MapShare {
  map_id: string;
  user_id: number;
  permission: string;
  created_at: number;
}

export interface Template {
  id: string;
  user_id: number;
  name: string;
  hexes: Array<{ q: number; r: number }>;
  created_at: number;
}

export interface RequestContext {
  user: User | null;
  sessionToken: string | null;
}
