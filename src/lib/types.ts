export interface Article {
  title: string;
  description: string;
  date: string;
  lastModified: string;
  path: string;
}

export interface Resource {
  name: string;
  description: string;
  url: string;
}

export interface ArticleResponse {
  success: boolean;
  data: Article[];
  message?: string;
}

export interface ResourceResponse {
  success: boolean;
  data: Resource[];
  message?: string;
}

// Common response type for single item operations
export interface SingleItemResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}