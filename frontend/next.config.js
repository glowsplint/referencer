// Additional loader due to Next.js Image component not working with static HTML export
// Read more at https://nextjs.org/docs/api-reference/next/image#built-in-loaders
const nextConfig = {
  images: {
    loader: "custom",
  },
};

module.exports = nextConfig;
