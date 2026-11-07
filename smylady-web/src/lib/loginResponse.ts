import type { User } from '@/types'

/**
 * Was eine Anmeldung zurückgibt, in beiden Formen.
 *
 * POST /auth/login und die Social-Logins liefern die Felder FLACH (userId,
 * email, role, token), ohne verschachteltes `user` — so seit dem ersten
 * Auth-Modul im Backend. OTP und Registrierung bauen `user` selbst zusammen.
 * Beide Formen müssen gelten, auch weil Backend und WebApp nicht gleichzeitig
 * deployt werden.
 */
export type LoginResponseLike = {
  token?: string
  user?: User
  termsUpToDate?: boolean
  needsDateOfBirth?: boolean
  userId?: string
  email?: string
  role?: string
  name?: string
  username?: string
  emailVerified?: boolean
}

/**
 * Die Antwort passt nicht zu einer Anmeldung (kein Token, keine Nutzer-ID).
 * Kein Fehler der Zugangsdaten: Die Login-Seite zeigt dafür eine eigene Meldung.
 */
export class UnexpectedLoginResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnexpectedLoginResponseError'
  }
}

/*
 * Die Login-Antwort trägt termsUpToDate/needsDateOfBirth teils neben `user`
 * statt darin. Damit die Pflichtdialoge (AccountGate) auch dann sofort
 * greifen, wenn /users/me danach scheitert, hier in den User übernehmen.
 */
function withLoginFlags(u: User, flags: { termsUpToDate?: boolean; needsDateOfBirth?: boolean }): User {
  return {
    ...u,
    termsUpToDate: u.termsUpToDate ?? flags.termsUpToDate,
    needsDateOfBirth: u.needsDateOfBirth ?? flags.needsDateOfBirth,
  }
}

/** Der vorläufige User aus der flachen Antwort; den vollständigen lädt danach /users/me. */
function userFromFlatResponse(response: LoginResponseLike): User {
  const id = response.userId ? String(response.userId) : ''
  return {
    id,
    _id: id,
    email: response.email ?? '',
    name: response.name ?? '',
    username: response.username ?? '',
    role: (response.role ?? 'user') as User['role'],
    ...(response.emailVerified === undefined ? {} : { emailVerified: response.emailVerified }),
  } as User
}

/** Token und User aus der Antwort; wirft nur UnexpectedLoginResponseError. */
export function toLoginSession(response: LoginResponseLike | null | undefined): { token: string; user: User } {
  if (!response || typeof response.token !== 'string' || !response.token) {
    // Auch die Zwei-Faktor-Antwort (requiresTwoFactor, challengeToken) landet hier.
    throw new UnexpectedLoginResponseError('Die Login-Antwort enthält kein Token.')
  }

  const user = response.user && typeof response.user === 'object' ? response.user : userFromFlatResponse(response)
  if (!user._id && !user.id) {
    throw new UnexpectedLoginResponseError('Die Login-Antwort enthält keine Nutzer-ID.')
  }

  return { token: response.token, user: withLoginFlags(user, response) }
}
