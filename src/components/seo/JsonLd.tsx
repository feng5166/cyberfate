const baseUrl = "https://www.cyberfate.me";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${baseUrl}/#website`,
  url: baseUrl,
  name: "赛博命理师 CyberFate",
  description: "融合传统命理与现代 AI 技术，为你提供科学、理性的命理分析参考。",
  inLanguage: "zh-CN",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${baseUrl}/knowledge?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${baseUrl}/#organization`,
  name: "CyberFate",
  alternateName: "赛博命理师",
  url: baseUrl,
  logo: {
    "@type": "ImageObject",
    url: `${baseUrl}/icons/icon-512x512.png`,
    width: 512,
    height: 512,
  },
  // TODO: 补全社媒主页 URL（X / Instagram / YouTube / 小红书 等），增强 Google 实体识别。
  sameAs: [],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "首页",
      item: baseUrl,
    },
  ],
};

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
