import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dev/", "/admin/"],
      },
    ],
    sitemap: "https://insaatborsam.com/sitemap.xml",
  };
}
