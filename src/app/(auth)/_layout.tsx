import { Redirect, Stack } from 'expo-router'
import React from 'react'
import { useAuth } from '../../features/auth/AuthContext'

export default function AuthLayout() {
  const { status } = useAuth()
  if (status === 'loading') return null
  if (status === 'signed-in') return <Redirect href="/(app)" />
  return <Stack screenOptions={{ headerShown: false }} />
}
