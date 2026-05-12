import { DynamicForm } from '../../dynamic-forms/models/dynamic-forms.models';
import { SafeUserCreate } from '../userModels';

export interface FormEmbedding {
  id?: string;
  templateFormId: string;
  productId?: string;
  customCss: string;
  domains: string[];
}

export interface EmbeddedForm extends FormEmbedding {
  csrfToken: string;
  form: DynamicForm;
}

export interface SubmitEmbeddedFormInput {
  embeddingFormId: string;
  productId: string;
  csrfToken: string;
  users: SafeUserCreate[];
  dynamicForm: DynamicForm;
}
