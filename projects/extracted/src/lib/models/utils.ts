export interface SavedItem {
  id: string;
  createdAt: number;
  updatedAt?: number | null;
}

export type WithId<T, Id = string> = T & { id: Id };

export type UUID = string;
