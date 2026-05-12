import { DataVisibilityLevels } from '../enums/data-visibility-levels.enums';
import { ArtifactTypes, PrefillSourceTypes } from '../enums/prefill-data.enums';

export type BasePrefillDataUnitSchema = {
  userId: string;
  sourceType?: PrefillSourceTypes;
  sourceId?: string;
  artifactType?: ArtifactTypes;
  artifactId?: string;
  key: string;
  value: unknown;
  ttl?: number;
  visibilityLevel: DataVisibilityLevels;
  isDocument?: boolean;
  documentId?: string;
  documentName?: string;
  digest?: string;
};

export type CreatedPrefillDataUnitSchema = {
  id: string;
};

export type ExistingPrefillDataUnitSchema = BasePrefillDataUnitSchema &
  CreatedPrefillDataUnitSchema & {
    modifiedAt: number;
  };
