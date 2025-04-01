export interface DecodedToken {
  name: string,
  given_name: string,
  email: string,
  nameid: string,
  nbf: number,
  exp: number,
  iat: number,
  iss: string,
  aud: string
}
