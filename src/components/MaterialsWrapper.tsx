'use client'

import React, { Suspense } from 'react'
import { MaterialsComponent } from './materials'

export function MaterialsWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MaterialsComponent />
    </Suspense>
  )
} 