;; Blockchain-based Certificate Issuance
;; Issue and verify digital certificates on-chain

(define-constant err-not-issuer (err u100))
(define-constant err-cert-exists (err u101))
(define-constant err-cert-not-found (err u102))

;; Contract owner (issuer)
(define-constant issuer tx-sender)

;; Certificate record: maps recipient principal to cert hash
(define-map certificates principal (buff 32))

;; Issue a certificate (only issuer)
(define-public (issue-certificate (recipient principal) (cert-hash (buff 32)))
  (begin
    (asserts! (is-eq tx-sender issuer) err-not-issuer)
    (asserts! (is-none (map-get? certificates recipient)) err-cert-exists)
    (map-set certificates recipient cert-hash)
    (ok true)
  )
)

;; Verify certificate by recipient principal
(define-read-only (verify-certificate (recipient principal))
  (match (map-get? certificates recipient)
    cert-hash (ok (some cert-hash))
    (ok none)
  )
)
