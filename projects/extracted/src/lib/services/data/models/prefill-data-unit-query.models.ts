import { PrefillSourceTypes, ArtifactTypes } from '../enums/prefill-data.enums';

export type PrefillDataQuerySchema = {
  userId: string;
  sourceType?: PrefillSourceTypes;
  sourceIds?: string[];
  artifacts?: ArtifactTypes[];
  artifactIds?: string[];
  keys?: string[];
};
