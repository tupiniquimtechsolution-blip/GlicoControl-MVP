import React from 'react'

import { AuthPkceCallback } from '../features/auth/AuthPkceCallback'

export default function AuthRecovery() {
  return <AuthPkceCallback kind="recovery" />
}
