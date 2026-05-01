import React from 'react';

export function Logo({ light = false }: { light?: boolean }) {
  const logoSrc = light ? '/logo-light.png' : '/logo-dark.png';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img src={logoSrc} alt="logo" style={{ width: '220px', height: 'auto' }} />
    </div>
  );
}