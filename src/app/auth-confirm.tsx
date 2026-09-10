import React from 'react'

import { AuthPkceCallback } from '../features/auth/AuthPkceCallback'

export default function AuthConfirm() {
  return <AuthPkceCallback kind="confirm" />
}
