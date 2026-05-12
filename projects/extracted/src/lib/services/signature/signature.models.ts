export type SignatureRecipient = {
  organizationUserId: string;
  email: string;
  name: string;
};

export interface PostSignatureExternalDocusignResult {
  url: string;
}
