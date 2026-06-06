/**
 * src/app/page.tsx
 *
 * What: The landing route for the Aver demo.
 * Does: Renders the dual-pane shell placeholder. Loads clean with no feature wiring yet.
 * Use when: Framework entry — Next.js requires a default-exported page component.
 */

import { DualPane } from '@/components/dual-pane';

export default function Home(): React.ReactNode {
  return (
    <main>
      <h1>Aver</h1>
      <p>Agent output integrity, demonstrated live.</p>
      <DualPane />
    </main>
  );
}
