import type { User } from './types';

export const usersMock: User[] = [
  { id: 'u1', firstName: 'Pierre',       lastName: 'Saussure', email: 'pierre@landjourney.ai' },
  { id: 'u2', firstName: 'Luke',         lastName: 'Johnson',  email: 'luke@landjourney.ai' },
  { id: 'u3', firstName: 'Jean-Francois',lastName: 'Houle',    email: 'jfhoule@landjourney.ai', phone: '+1 (514) 803-2081' },
  { id: 'u4', firstName: 'Cathleen',     lastName: 'Ghenne',   email: 'cathleen@landjourney.ai' },
  { id: 'u5', firstName: 'Yann',         lastName: 'Tremblay', email: 'yann@landjourney.ai' },
  { id: 'u6', firstName: 'Jérémie',      lastName: 'Bédard',   email: 'jeremie@landjourney.ai' },
  { id: 'u7', firstName: 'Raul',         lastName: 'Gallardo', email: 'matias@landjourney.ai' },
  { id: 'u8', firstName: 'Thiago',       lastName: 'Lima',     email: 'thiago@landjourney.ai' },
  { id: 'u9', firstName: 'Luna',         lastName: 'Kam',      email: 'luna@landjourney.ai' },
  { id: 'u10',firstName: 'JF test',      lastName: 'Houle Test',email:'jfhoule+local1@landjourney.ai', phone: '+1 (514) 803-2081' },
];

export const fullName = (u: { firstName: string; lastName: string }) => (u.firstName + ' ' + u.lastName).trim();
export const initials = (u: { firstName: string; lastName: string }) => (u.firstName[0]||'').toUpperCase() + (u.lastName[0]||'').toUpperCase();
