export type Message = {
  sender?: string;
  subject: string;
  body: string;
  dueDate?: number;
};

export function getDefaultMessage() {
  return {
    subject: '',
    body: '',
  };
}
