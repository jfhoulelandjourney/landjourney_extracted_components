export type StartExportBatchResponse = {
  export_info: {
    bucket_name: string;
    database_name: string;
    entities_to_export: string;
    export_id: string;
    export_timestamp: string;
    organization_key: string;
    service_name: string;
  };
  message: string;
};

export type PollExportBatchResponse = {
  bucketName: string;
  databaseName: string;
  entitiesStatuses: object;
  id: string;
  isCompleted: boolean;
  isHealthy: boolean;
  organizationKey: string;
};
