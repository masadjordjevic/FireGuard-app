export type DidHolder = {
  didIdentifier?: string | null;
};

// MVP: "verified" just means the user has typed a non-empty DID string into
// their profile. There is no cryptographic proof of ownership here.
//
// PRODUCTION TODO: replace this presence check with a real DID resolver —
// e.g. `ethr-did`/`did-resolver` to resolve and validate a `did:ethr:*`
// document, or ENS reverse resolution for `did:ens:*` / ENS names — and
// require the user to prove control of the identifier (e.g. a signed
// challenge) before granting the "Verified" badge.
export function isVerified({ didIdentifier }: DidHolder): boolean {
  return Boolean(didIdentifier && didIdentifier.trim().length > 0);
}
