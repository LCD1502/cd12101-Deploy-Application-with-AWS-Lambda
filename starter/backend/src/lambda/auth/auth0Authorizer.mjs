import Axios from 'axios'
import jsonwebtoken from 'jsonwebtoken'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('auth')

const certificate = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJdq4lywdbykHdMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi1iYTY1Y3kzb2txMHdqOGdtLnVzLmF1dGgwLmNvbTAeFw0yNDA5Mjcx
NDIxMjlaFw0zODA2MDYxNDIxMjlaMCwxKjAoBgNVBAMTIWRldi1iYTY1Y3kzb2tx
MHdqOGdtLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBALEk37GZAsDgBmXAqfPsqM/Ov0RnLZHO5tQI2i5/W5IA4VmLK15TnyuBUUvo
E2Ke61dFQXddNhkvsge3G2Ba5ut6xm62chA13bIWVjOzHG10/BAbefNg8yyvbse9
0Hd+HVxk5g2MZ1CIx+dU4OKm8+sMD7HoR56nl8n8ZEcHTghg+90CPY8gVLMC704H
iUMsJhKY+U3d9ehGUEYxqorM3MOWwfaH4RC8sbDUI2SY9OU58MDKnAqx4LWGTnN8
GSdoSAGSxefhgSNmlpHSMvSddYmvjambSR1CIorif9BTXFe7qw79k83LPMBGUYHB
qWWjocbcEM8IyHfg+CNOmmTdS7kCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUP2Kqudl1vZGUWiEZUCCK+KoftJkwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQAKr3+t7FntF9u8S5qPnN5Bjwmj3JmdRgo2iXxVsTVr
tk2kN43g3YEj6SpdyWK+HGT6TAm1ryi/ZO4ahIGtPTRnYbXmM7OQPgEa8082/3s+
ftoDkJ9YDpsi2i8k/xHsVAWnE3Y1CY3+TeceumUjS11VIRM5P3qTKhbfDfgvch0l
fWHvawGxFd6i7fzZt4CkqItzJPHUJfCU7QBGWPJAcbu5rCKAtZsFL4nc9VXG7qni
eTJF6WgOD+/ex6He1b+5PogrAMdXMR+4a0S+s+BnOPkVLbM/OofYwut/aebVJBPu
rHzUUmeXXJSG9QFDMbnywm+YrJLeHwgVkjeOBjzaPLpk
-----END CERTIFICATE-----`

const jwksUrl = 'https://test-endpoint.auth0.com/.well-known/jwks.json'

export async function handler(event) {
  try {
    const jwtToken = await verifyToken(event.authorizationToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader) {
  const token = getToken(authHeader)
  // const jwt = jsonwebtoken.decode(token, { complete: true })

  return jsonwebtoken.verify(token, certificate, { algorithms: ['RS256'] })
}

function getToken(authHeader) {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
