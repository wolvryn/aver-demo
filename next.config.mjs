import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  // Source-map upload runs only when SENTRY_AUTH_TOKEN/org/project are configured;
  // without them the build proceeds and upload is skipped. Keep build logs quiet.
  silent: true,
});
