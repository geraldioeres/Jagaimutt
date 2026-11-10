// Supabase signs in with an email, so a username is stored as a hidden email:
// "sasa" -> "sasa@jagaimutt.app". Create the account in the Supabase dashboard
// with that address and "Auto Confirm User" ticked. Nothing is ever sent to it.
export const USERNAME_DOMAIN = 'jagaimutt.app';

// Anything with an "@" is used as a full email, so older accounts still work.
export function loginEmail(input: string) {
  const v = input.trim().toLowerCase();
  return v.includes('@') ? v : `${v}@${USERNAME_DOMAIN}`;
}
