import { loadPSPDFKit } from './pspdfkit-loader';

export const PDF_VIEWER_LOCALES = {
  BASE: 'en',
  // Using a different locale as a hack for changing text in the initials popup
  INITIALS: 'en-029',
};

export const setupLocales = async () => {
  const PSPDFKit = await loadPSPDFKit();
  await PSPDFKit.I18n.preloadLocalizationData(PDF_VIEWER_LOCALES.BASE);
  PSPDFKit.I18n.locales.push(PDF_VIEWER_LOCALES.INITIALS);
  PSPDFKit.I18n.messages[PDF_VIEWER_LOCALES.INITIALS] = {
    ...PSPDFKit.I18n.messages[PDF_VIEWER_LOCALES.BASE],
    signatures: 'Initials',
    addSignature: 'Add Initials',
    clearSignature: 'Clear Initials',
    storeSignature: 'Store Initials',
    pleaseSignHere: 'Please enter initials here',
    signatureDialog: 'Initials',
    signatureDialogDesc:
      "This dialog lets you select previously used initials to insert into the document. If you don't have stored initials, you can create one using the canvas view.",
    signature: 'Initials',
    ElectronicSignatures_SignHereTypeHint: 'Type Your Initials Above',
    ElectronicSignatures_SignHereDrawHint: 'Add your initials here',
    saveSignature: 'Save Initials',
    signatureField: 'Initials Field',
    noSignatures: 'No Initials',
  };
};
