export interface Participants {
  users: string[];
  workgroups: string[];
}

export interface UpdateCommentInput {
  id: string;
  discussionId: string;
  message: string;
  metadata: Record<string, unknown>;
  participants?: Participants;
}

export interface CreateUserCommentInput {
  message: string;
  metadata: Record<string, unknown>;
}

export interface CreateDiscussionWithCommentsInput {
  targetEntityId: string;
  targetEntityType: string;
  targetEntityDigest?: string;
  metadata: Record<string, unknown>;
  comments: CreateUserCommentInput[];
  entityDigest: string;
  participants?: Participants;
}

export interface AddCommentToDiscussionInput {
  discussionId: string;
  comment: CreateUserCommentInput;
  participants?: Participants;
  entityDigest: string;
}

export interface DiscussionQueryParams {
  targetEntityId: string;
  targetEntityType: string;
  sinceTimestamp?: number;
  metadata?: Record<string, unknown>;
  entityDigest?: string;
}
