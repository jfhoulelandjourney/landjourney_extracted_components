export interface EscrowBaseSchema {
  name: string;
}

export interface EscrowCreatedSchema {
  id: string;
}

export interface ExistingEscrowSchema
  extends EscrowBaseSchema, EscrowCreatedSchema {
  isSynchronized?: boolean;
}

export function getDefaultEscrow(): EscrowBaseSchema {
  return {
    name: '',
  };
}
