// We have a entangled circular dependency between the product, section and request models.
// To avoid this, we extracted the product types to a separate file.
export enum WorkflowProductTypes {
  LAND_LOAN = 'LAND_LOAN',
  OPERATION_LOAN = 'OPERATION_LOAN',
  LINE_OF_CREDIT = 'LINE_OF_CREDIT',
  EQUIPMENT_LOAN = 'EQUIPMENT_LOAN',
  MISC = 'MISC',
  CUSTOM = 'CUSTOM',
}
