export interface ApiKey {
  id: string;
  name: string;
  createdAt: number;
}

export interface CreatedApiKey extends ApiKey {
  apiKey: string;
}
