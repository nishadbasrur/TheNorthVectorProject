import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "North Vector",
    short_name: "North Vector",
    description: "Personal Chief of Staff Operating System.",
    start_url: "/",
    display: "standalone",
    background_color: "#04091a",
    theme_color: "#04091a",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
