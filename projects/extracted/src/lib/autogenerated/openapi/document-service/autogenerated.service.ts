import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../services/api/api.service';
import {
  CloneArgsSchema,
  TemplateClonesSchema,
  LlmInput,
  LlmOutput,
  ExistingFormEmbeddingSchema,
  CreateDynamicFormEmbeddingSchema,
  DynamicFormEmbeddingCreatedSchema,
  ExistingFormEmbeddingSchemaWithCsrfToken,
  DynamicFormBaseSchema,
  DynamicFormCreatedSchema,
  FileBaseSchema,
  FileCreatedSchema,
  ExistingFileSchemaOutput,
  ExistingFileSchemaInput,
  FilePatchSchema,
  FileCloneArgsSchema,
  BatchFileTemplateCloneSchema,
  ExistingDynamicFormSchemaOutput,
  ExistingDynamicFormSchemaInput,
  MultipleDynamicFormsDownloadSchema,
  SignatureBaseSchema,
  SignatureCreatedSchema,
  ExistingSignatureSchema,
  CreateEmbeddedDocusignSignatureSchema,
  EmbeddedDocusignSignatureCreatedSchema,
  ExistingFileTemplateSchema,
  FileTemplateBaseSchema,
  FileTemplateCreatedSchema,
  FileTemplateCloneSchema,
  ExistingDynamicFormTemplateSchemaOutput,
  DynamicFormTemplateBaseSchema,
  DynamicFormTemplateCreatedSchema,
  ExistingDynamicFormTemplateSchemaInput,
  TenantDbArgs,
} from './types.gen';

const generateSearchParameters = <T>(options: T): string => {
  const searchParams = new URLSearchParams();
  for (const key in options) {
    const k = key as keyof typeof options;
    if (options?.[k] !== undefined && options?.[k] !== null) {
      searchParams.append(key, String(options[k]));
    }
  }
  const searchParameters = searchParams.toString()
    ? `?${searchParams.toString()}`
    : '';
  return searchParameters;
};

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiService = inject(ApiService);
  private httpClient = inject(HttpClient);


  private get serviceConfiguration() {
    return this.apiService.getEnvironmentConfiguration().APIs.Documents;
  }

  /**
   *  Provide the root level route for the service

Returns:
dict: Name of the API and the version
   */
  public getRootGet(): Observable<unknown> {
    /** @label getRootGet **/
    return this.apiService.get<unknown>(this.serviceConfiguration, `/`);
  }

  /**
   *  Clone documents to new objects.
   */
  public cloneTemplateBatchCloneBatchPost(
    input: CloneArgsSchema,
    options?: { target?: string | null }
  ): Observable<TemplateClonesSchema> {
    /** @label cloneTemplateBatchCloneBatchPost **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.post<TemplateClonesSchema, CloneArgsSchema>(
      this.serviceConfiguration,
      `/clone/batch${searchParameters}`,
      input
    );
  }

  /**
   *  Get the LLM output for the given file
   */
  public apiConverseConversationFilesFileIdLlmPost(
    input: LlmInput,
    fileId: string
  ): Observable<LlmOutput> {
    /** @label apiConverseConversationFilesFileIdLlmPost **/
    return this.apiService.post<LlmOutput, LlmInput>(
      this.serviceConfiguration,
      `/conversation/files/${fileId}/llm`,
      input
    );
  }

  /**
   *  Create an ai automatic description for a document
   */
  public createDocumentDescriptionDocumentAnalysisDocumentIdPost(
    documentId: string
  ): Observable<unknown> {
    /** @label createDocumentDescriptionDocumentAnalysisDocumentIdPost **/
    return this.apiService.post<unknown>(
      this.serviceConfiguration,
      `/document-analysis/${documentId}`
    );
  }

  /**
   *  Get a list embeddings form (definition and data).
   */
  public getEmbeddingFormsExternalFormsGet(options?: {
    productId?: string | null;
    templateFormId?: string | null;
    page?: number;
    pageSize?: number;
  }): Observable<Array<ExistingFormEmbeddingSchema>> {
    /** @label getEmbeddingFormsExternalFormsGet **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.get<Array<ExistingFormEmbeddingSchema>>(
      this.serviceConfiguration,
      `/external/forms${searchParameters}`
    );
  }

  /**
   *  Create a new dynamic form embedding object.
   */
  public createEmbeddingFormExternalFormsPost(
    input: CreateDynamicFormEmbeddingSchema
  ): Observable<DynamicFormEmbeddingCreatedSchema> {
    /** @label createEmbeddingFormExternalFormsPost **/
    return this.apiService.post<
      DynamicFormEmbeddingCreatedSchema,
      CreateDynamicFormEmbeddingSchema
    >(this.serviceConfiguration, `/external/forms`, input);
  }

  /**
   *  Get an embeddings form (definition and data).
   */
  public getEmbeddingFormExternalFormsEmbeddingFormIdGet(
    embeddingFormId: string
  ): Observable<ExistingFormEmbeddingSchema> {
    /** @label getEmbeddingFormExternalFormsEmbeddingFormIdGet **/
    return this.apiService.get<ExistingFormEmbeddingSchema>(
      this.serviceConfiguration,
      `/external/forms/${embeddingFormId}`
    );
  }

  /**
   *  Updates a dynamic form embedding object.
   */
  public updateEmbeddingFormExternalFormsEmbeddingFormIdPut(
    input: CreateDynamicFormEmbeddingSchema,
    embeddingFormId: string
  ): Observable<DynamicFormEmbeddingCreatedSchema> {
    /** @label updateEmbeddingFormExternalFormsEmbeddingFormIdPut **/
    return this.apiService.put<
      DynamicFormEmbeddingCreatedSchema,
      CreateDynamicFormEmbeddingSchema
    >(this.serviceConfiguration, `/external/forms/${embeddingFormId}`, input);
  }

  /**
   *  Deletes a dynamic form embedding object.
   */
  public deleteEmbeddingFormExternalFormsEmbeddingFormIdDelete(
    embeddingFormId: string
  ): Observable<unknown> {
    /** @label deleteEmbeddingFormExternalFormsEmbeddingFormIdDelete **/
    return this.apiService.delete<unknown>(
      this.serviceConfiguration,
      `/external/forms/${embeddingFormId}`
    );
  }

  /**
   *  Return an existing dynamic form template embed script
   */
  public getFormEmbedScriptExternalFormsEmbeddingFormIdFormJsGet(
    embeddingFormId: string
  ): Observable<unknown> {
    /** @label getFormEmbedScriptExternalFormsEmbeddingFormIdFormJsGet **/
    return this.apiService.get<unknown>(
      this.serviceConfiguration,
      `/external/forms/${embeddingFormId}/form.js`
    );
  }

  /**
   *  Get a form embedding (unauthenticated).
   */
  public getFormEmbeddingExternalFormsDefinitionEmbeddingFormIdGet(
    embeddingFormId: string,
    options?: { signature?: string; organization?: string }
  ): Observable<ExistingFormEmbeddingSchemaWithCsrfToken> {
    /** @label getFormEmbeddingExternalFormsDefinitionEmbeddingFormIdGet **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.get<ExistingFormEmbeddingSchemaWithCsrfToken>(
      this.serviceConfiguration,
      `/external/forms/definition/${embeddingFormId}${searchParameters}`
    );
  }

  /**
   *  Saves form data from a dynamic form.
   */
  public createFormExternalFormsSubmitPost(
    input: DynamicFormBaseSchema
  ): Observable<DynamicFormCreatedSchema> {
    /** @label createFormExternalFormsSubmitPost **/
    return this.apiService.post<
      DynamicFormCreatedSchema,
      DynamicFormBaseSchema
    >(this.serviceConfiguration, `/external/forms/submit`, input);
  }

  /**
   *  Create a new document metadata object.That object is not the file itself but information about the file.After creating that object, you need to post a request on the /upload path.
   */
  public createFileMetadataFilesPost(
    input: FileBaseSchema
  ): Observable<FileCreatedSchema> {
    /** @label createFileMetadataFilesPost **/
    return this.apiService.post<FileCreatedSchema, FileBaseSchema>(
      this.serviceConfiguration,
      `/files`,
      input
    );
  }

  /**
   *  Get a specific file metadata or a batch
   */
  public getFileMetadataFilesFileIdGet(
    fileId: string,
    options?: { targetFiles?: string | null }
  ): Observable<ExistingFileSchemaOutput | Array<ExistingFileSchemaOutput>> {
    /** @label getFileMetadataFilesFileIdGet **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.get<
      ExistingFileSchemaOutput | Array<ExistingFileSchemaOutput>
    >(this.serviceConfiguration, `/files/${fileId}${searchParameters}`);
  }

  /**
   *  Update a specific file metadata
   */
  public updateFileMetadataFilesFileIdPut(
    input: ExistingFileSchemaInput,
    fileId: string
  ): Observable<unknown> {
    /** @label updateFileMetadataFilesFileIdPut **/
    return this.apiService.put<unknown, ExistingFileSchemaInput>(
      this.serviceConfiguration,
      `/files/${fileId}`,
      input
    );
  }

  /**
   *  Update a specific file metadata
   */
  public patchFileMetadataFilesFileIdPatch(
    input: FilePatchSchema,
    fileId: string,
    options?: { digest?: string }
  ): Observable<unknown> {
    /** @label patchFileMetadataFilesFileIdPatch **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.patch<unknown, FilePatchSchema>(
      this.serviceConfiguration,
      `/files/${fileId}${searchParameters}`,
      input
    );
  }

  /**
   *  Delete a specific file metadata
   */
  public deleteFileMetadataFilesFileIdDelete(
    fileId: string
  ): Observable<unknown> {
    /** @label deleteFileMetadataFilesFileIdDelete **/
    return this.apiService.delete<unknown>(
      this.serviceConfiguration,
      `/files/${fileId}`
    );
  }

  /**
   *  Get a specific file metadata
   */
  public getHeadFileMetadataFilesFileIdHead(
    fileId: string
  ): Observable<boolean> {
    /** @label getHeadFileMetadataFilesFileIdHead **/
    return this.apiService.head(this.serviceConfiguration, `/files/${fileId}`);
  }

  /**
   *  Trigger the conversion of a file to PDF format.
   */
  public triggerConversionFilesFileIdConvertPost(
    fileId: string
  ): Observable<unknown> {
    /** @label triggerConversionFilesFileIdConvertPost **/
    return this.apiService.post<unknown>(
      this.serviceConfiguration,
      `/files/${fileId}/convert`
    );
  }

  /**
   *  Get the download link for a file
   */
  public downloadFileFilesFileIdDownloadGet(
    fileId: string,
    options?: { redirect?: boolean; pdfConversion?: boolean }
  ): Observable<unknown> {
    /** @label downloadFileFilesFileIdDownloadGet **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.get<unknown>(
      this.serviceConfiguration,
      `/files/${fileId}/download${searchParameters}`
    );
  }

  /**
   *  Get the upload link for a post request
   */
  public postUploadFileFilesFileIdUploadPost(
    fileId: string
  ): Observable<unknown> {
    /** @label postUploadFileFilesFileIdUploadPost **/
    return this.apiService.post<unknown>(
      this.serviceConfiguration,
      `/files/${fileId}/upload`
    );
  }

  /**
   *  Get the upload link for a put request
   */
  public putUploadFileFilesFileIdUploadPut(
    fileId: string
  ): Observable<unknown> {
    /** @label putUploadFileFilesFileIdUploadPut **/
    return this.apiService.put<unknown>(
      this.serviceConfiguration,
      `/files/${fileId}/upload`
    );
  }

  /**
   *  Batch create of documents metadata object.That object is not the file itself but information about the file.After creating that object, you need to post a request on the /upload path.
   */
  public createBatchFileMetadataFilesBatchPost(
    input: Array<FileBaseSchema>
  ): Observable<Array<FileCreatedSchema>> {
    /** @label createBatchFileMetadataFilesBatchPost **/
    return this.apiService.post<
      Array<FileCreatedSchema>,
      Array<FileBaseSchema>
    >(this.serviceConfiguration, `/files/batch`, input);
  }

  /**
   *  Clone a batch template to a new file.
   */
  public cloneTemplateBatchFilesCloneBatchPost(
    input: FileCloneArgsSchema
  ): Observable<BatchFileTemplateCloneSchema> {
    /** @label cloneTemplateBatchFilesCloneBatchPost **/
    return this.apiService.post<
      BatchFileTemplateCloneSchema,
      FileCloneArgsSchema
    >(this.serviceConfiguration, `/files/clone/batch`, input);
  }

  /**
   *  Create a new dynamic form object.
   */
  public createFormFormsPost(
    input: DynamicFormBaseSchema
  ): Observable<DynamicFormCreatedSchema> {
    /** @label createFormFormsPost **/
    return this.apiService.post<
      DynamicFormCreatedSchema,
      DynamicFormBaseSchema
    >(this.serviceConfiguration, `/forms`, input);
  }

  /**
   *  Get a dynamic form (definition and data).
   */
  public getFormFormsDynamicFormIdGet(
    dynamicFormId: string
  ): Observable<ExistingDynamicFormSchemaOutput> {
    /** @label getFormFormsDynamicFormIdGet **/
    return this.apiService.get<ExistingDynamicFormSchemaOutput>(
      this.serviceConfiguration,
      `/forms/${dynamicFormId}`
    );
  }

  /**
   *  Update the definition and the model of a dynamic form.To update only a field of the model, consider implementing a patch...
   */
  public updateFormFormsDynamicFormIdPut(
    input: ExistingDynamicFormSchemaInput,
    dynamicFormId: string
  ): Observable<unknown> {
    /** @label updateFormFormsDynamicFormIdPut **/
    return this.apiService.put<unknown, ExistingDynamicFormSchemaInput>(
      this.serviceConfiguration,
      `/forms/${dynamicFormId}`,
      input
    );
  }

  /**
   *  Delete a dynamic form, including the model and the data.
   */
  public deleteFormFormsDynamicFormIdDelete(
    dynamicFormId: string
  ): Observable<unknown> {
    /** @label deleteFormFormsDynamicFormIdDelete **/
    return this.apiService.delete<unknown>(
      this.serviceConfiguration,
      `/forms/${dynamicFormId}`
    );
  }

  /**
   *  Downloads the dynamic form as a PDF.
   */
  public downloadFormFormsDynamicFormIdDownloadGet(
    dynamicFormId: string
  ): Observable<unknown> {
    /** @label downloadFormFormsDynamicFormIdDownloadGet **/
    return this.apiService.get<unknown>(
      this.serviceConfiguration,
      `/forms/${dynamicFormId}/download`
    );
  }

  /**
   *  Downloads multiple dynamic forms .
   */
  public downloadMultipleFormsFormsDownloadBatchPost(
    input: MultipleDynamicFormsDownloadSchema
  ): Observable<unknown> {
    /** @label downloadMultipleFormsFormsDownloadBatchPost **/
    return this.apiService.post<unknown, MultipleDynamicFormsDownloadSchema>(
      this.serviceConfiguration,
      `/forms/download/batch`,
      input
    );
  }

  /**
   *  Search documents
   */
  public searchSearchGet(): Observable<unknown> {
    /** @label searchSearchGet **/
    return this.apiService.get<unknown>(this.serviceConfiguration, `/search/`);
  }

  /**
   *  Create a new signature.
   */
  public createSignatureSignaturesPost(
    input: SignatureBaseSchema
  ): Observable<SignatureCreatedSchema> {
    /** @label createSignatureSignaturesPost **/
    return this.apiService.post<SignatureCreatedSchema, SignatureBaseSchema>(
      this.serviceConfiguration,
      `/signatures`,
      input
    );
  }

  /**
   *  Get a signature.
   */
  public getSignatureSignaturesSignatureIdGet(
    signatureId: string
  ): Observable<ExistingSignatureSchema> {
    /** @label getSignatureSignaturesSignatureIdGet **/
    return this.apiService.get<ExistingSignatureSchema>(
      this.serviceConfiguration,
      `/signatures/${signatureId}`
    );
  }

  /**
   *  Delete a signature.
   */
  public deleteSignatureSignaturesSignatureIdDelete(
    signatureId: string
  ): Observable<unknown> {
    /** @label deleteSignatureSignaturesSignatureIdDelete **/
    return this.apiService.delete<unknown>(
      this.serviceConfiguration,
      `/signatures/${signatureId}`
    );
  }

  /**
   *  Create a new embedded docusign signature enveloppe.
   */
  public createEnveloppeFromFileIdSignaturesExternalDocusignPost(
    input: CreateEmbeddedDocusignSignatureSchema
  ): Observable<EmbeddedDocusignSignatureCreatedSchema> {
    /** @label createEnveloppeFromFileIdSignaturesExternalDocusignPost **/
    return this.apiService.post<
      EmbeddedDocusignSignatureCreatedSchema,
      CreateEmbeddedDocusignSignatureSchema
    >(this.serviceConfiguration, `/signatures/external/docusign`, input);
  }

  /**
   *  Get the status of the API and the resources.

Returns:
dict: Information about the status, the dependency status and the version.
   */
  public getStatusCheckStatusGet(): Observable<unknown> {
    /** @label getStatusCheckStatusGet **/
    return this.apiService.get<unknown>(this.serviceConfiguration, `/status`);
  }

  /**
   *  return a list of all file template metadata
   */
  public getAllTemplateMetadataTemplatesFilesGet(): Observable<
    Array<ExistingFileTemplateSchema>
  > {
    /** @label getAllTemplateMetadataTemplatesFilesGet **/
    return this.apiService.get<Array<ExistingFileTemplateSchema>>(
      this.serviceConfiguration,
      `/templates/files`
    );
  }

  /**
   *  Create a new template metadata object.That object is not the file template itself but information about the template.After creating that object, you need to post a request on the /upload path.
   */
  public createTemplateMetadataTemplatesFilesPost(
    input: FileTemplateBaseSchema
  ): Observable<FileTemplateCreatedSchema> {
    /** @label createTemplateMetadataTemplatesFilesPost **/
    return this.apiService.post<
      FileTemplateCreatedSchema,
      FileTemplateBaseSchema
    >(this.serviceConfiguration, `/templates/files`, input);
  }

  /**
   *  Return an existing file template metadata
   */
  public getTemplateMetadataTemplatesFilesTemplateIdGet(
    templateId: string
  ): Observable<ExistingFileTemplateSchema> {
    /** @label getTemplateMetadataTemplatesFilesTemplateIdGet **/
    return this.apiService.get<ExistingFileTemplateSchema>(
      this.serviceConfiguration,
      `/templates/files/${templateId}`
    );
  }

  /**
   *  Update a specific file template metadata
   */
  public updateTemplateMetadataTemplatesFilesTemplateIdPut(
    input: ExistingFileTemplateSchema,
    templateId: string
  ): Observable<unknown> {
    /** @label updateTemplateMetadataTemplatesFilesTemplateIdPut **/
    return this.apiService.put<unknown, ExistingFileTemplateSchema>(
      this.serviceConfiguration,
      `/templates/files/${templateId}`,
      input
    );
  }

  /**
   *  Delete a specific file template metadata
   */
  public deleteTemplateMetadataTemplatesFilesTemplateIdDelete(
    templateId: string
  ): Observable<unknown> {
    /** @label deleteTemplateMetadataTemplatesFilesTemplateIdDelete **/
    return this.apiService.delete<unknown>(
      this.serviceConfiguration,
      `/templates/files/${templateId}`
    );
  }

  /**
   *  Clone a template to a new file.
   */
  public cloneTemplateTemplatesFilesTemplateIdClonePost(
    templateId: string
  ): Observable<FileTemplateCreatedSchema> {
    /** @label cloneTemplateTemplatesFilesTemplateIdClonePost **/
    return this.apiService.post<FileTemplateCreatedSchema>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/clone`
    );
  }

  /**
   *  Trigger the conversion of a file to PDF format.
   */
  public triggerConversionTemplatesFilesTemplateIdConvertPost(
    templateId: string
  ): Observable<unknown> {
    /** @label triggerConversionTemplatesFilesTemplateIdConvertPost **/
    return this.apiService.post<unknown>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/convert`
    );
  }

  /**
   *  Get the download link for a template
   */
  public downloadTemplateTemplatesFilesTemplateIdDownloadGet(
    templateId: string,
    options?: { redirect?: boolean; pdfConversion?: boolean }
  ): Observable<unknown> {
    /** @label downloadTemplateTemplatesFilesTemplateIdDownloadGet **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.get<unknown>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/download${searchParameters}`
    );
  }

  /**
   *  Get the upload link for a post request
   */
  public postUploadTemplateTemplatesFilesTemplateIdUploadPost(
    templateId: string
  ): Observable<unknown> {
    /** @label postUploadTemplateTemplatesFilesTemplateIdUploadPost **/
    return this.apiService.post<unknown>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/upload`
    );
  }

  /**
   *  Get the upload link for a put request
   */
  public putUploadTemplateTemplatesFilesTemplateIdUploadPut(
    templateId: string
  ): Observable<unknown> {
    /** @label putUploadTemplateTemplatesFilesTemplateIdUploadPut **/
    return this.apiService.put<unknown>(
      this.serviceConfiguration,
      `/templates/files/${templateId}/upload`
    );
  }

  /**
   *  Batch create of file template documents metadata object.That object is not the file itself but information about the file.After creating that object, you need to post a request on the /upload path.
   */
  public createBatchFileTemplateTemplatesFilesBatchPost(
    input: Array<FileTemplateBaseSchema>
  ): Observable<Array<FileTemplateCreatedSchema>> {
    /** @label createBatchFileTemplateTemplatesFilesBatchPost **/
    return this.apiService.post<
      Array<FileTemplateCreatedSchema>,
      Array<FileTemplateBaseSchema>
    >(this.serviceConfiguration, `/templates/files/batch`, input);
  }

  /**
   *  Clone a batch template to a new file.
   */
  public cloneTemplateBatchTemplatesFilesCloneBatchPost(
    input: Array<string>
  ): Observable<Array<FileTemplateCloneSchema>> {
    /** @label cloneTemplateBatchTemplatesFilesCloneBatchPost **/
    return this.apiService.post<Array<FileTemplateCloneSchema>, Array<string>>(
      this.serviceConfiguration,
      `/templates/files/clone/batch`,
      input
    );
  }

  /**
   *  return a list of all dynamic form template
   */
  public getAllFormTemplatesTemplatesFormsGet(): Observable<
    Array<ExistingDynamicFormTemplateSchemaOutput>
  > {
    /** @label getAllFormTemplatesTemplatesFormsGet **/
    return this.apiService.get<Array<ExistingDynamicFormTemplateSchemaOutput>>(
      this.serviceConfiguration,
      `/templates/forms`
    );
  }

  /**
   *  Create a new dynamic form template object.
   */
  public createFormTemplateTemplatesFormsPost(
    input: DynamicFormTemplateBaseSchema
  ): Observable<DynamicFormTemplateCreatedSchema> {
    /** @label createFormTemplateTemplatesFormsPost **/
    return this.apiService.post<
      DynamicFormTemplateCreatedSchema,
      DynamicFormTemplateBaseSchema
    >(this.serviceConfiguration, `/templates/forms`, input);
  }

  /**
   *  Return an existing dynamic form template
   */
  public getFormTemplateTemplatesFormsTemplateIdGet(
    templateId: string
  ): Observable<ExistingDynamicFormTemplateSchemaOutput> {
    /** @label getFormTemplateTemplatesFormsTemplateIdGet **/
    return this.apiService.get<ExistingDynamicFormTemplateSchemaOutput>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}`
    );
  }

  /**
   *  Update a specific dynamic form template
   */
  public updateFormTemplateTemplatesFormsTemplateIdPut(
    input: ExistingDynamicFormTemplateSchemaInput,
    templateId: string
  ): Observable<unknown> {
    /** @label updateFormTemplateTemplatesFormsTemplateIdPut **/
    return this.apiService.put<unknown, ExistingDynamicFormTemplateSchemaInput>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}`,
      input
    );
  }

  /**
   *  Delete a specific dynamic form template
   */
  public deleteFormTemplateTemplatesFormsTemplateIdDelete(
    templateId: string
  ): Observable<unknown> {
    /** @label deleteFormTemplateTemplatesFormsTemplateIdDelete **/
    return this.apiService.delete<unknown>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}`
    );
  }

  /**
   *  Clone a template to a new file.
   */
  public cloneDynamicFormTemplateTemplatesFormsTemplateIdClonePost(
    templateId: string,
    options?: { target?: string | null; name?: string | null }
  ): Observable<DynamicFormTemplateCreatedSchema> {
    /** @label cloneDynamicFormTemplateTemplatesFormsTemplateIdClonePost **/
    const searchParameters = generateSearchParameters(options);

    return this.apiService.post<DynamicFormTemplateCreatedSchema>(
      this.serviceConfiguration,
      `/templates/forms/${templateId}/clone${searchParameters}`
    );
  }

  /**
   *  Initializes a new tenant
   */
  public initializeTenantTenantsDatabasePost(
    input: TenantDbArgs
  ): Observable<unknown> {
    /** @label initializeTenantTenantsDatabasePost **/
    return this.apiService.post<unknown, TenantDbArgs>(
      this.serviceConfiguration,
      `/tenants/database`,
      input
    );
  }

  /**
   *  Refresh settings cache
   */
  public refreshSettingsCacheTenantsRefreshSettingsCachePost(): Observable<unknown> {
    /** @label refreshSettingsCacheTenantsRefreshSettingsCachePost **/
    return this.apiService.post<unknown>(
      this.serviceConfiguration,
      `/tenants/refresh-settings-cache`
    );
  }
}
