export const gems = [
  {
    id: "gem-koc-fashion",
    slug: "koc-fashion-veo3",
    title: "Chatbot KOC Thoi Trang VEO3",
    categoryId: "cat-koc",
    price: 399000,
    originalPrice: 699000,
    description:
      "Bo chatbot tao prompt quay KOC thoi trang, co workflow quay canh, script hook va CTA chot don.",
    thumbnail:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
    ],
    productType: "chatbot_prompt",
    chatbotLink: "https://example.com/chatbot/koc-fashion",
    workflowLink: "",
    tutorialVideo: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    tutorialSteps: [
      {
        order: 1,
        title: "Nhap thong tin san pham",
        content: "Nhap diem khac biet, gia ban, uu dai va doi tuong khach hang."
      },
      {
        order: 2,
        title: "Sinh bo prompt 10 canh",
        content: "He thong tu sinh prompt canh quay hook-body-cta theo phong cach KOC."
      }
    ],
    linkedAiToolId: "tool-veo3"
  },
  {
    id: "gem-skincare",
    slug: "my-pham-ugc-pro",
    title: "Chatbot UGC My Pham Chot Don",
    categoryId: "cat-beauty",
    price: 299000,
    originalPrice: 499000,
    description:
      "Mau prompt UGC my pham theo cam xuc truoc-sau, ban chuyen doi cho landing va short video.",
    thumbnail:
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80"
    ],
    productType: "chatbot_prompt",
    chatbotLink: "https://example.com/chatbot/beauty",
    workflowLink: "",
    tutorialVideo: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    tutorialSteps: [
      {
        order: 1,
        title: "Nghien cuu pain point",
        content: "Xac dinh van de da, muc tieu va thoi gian thay doi ky vong."
      }
    ],
    linkedAiToolId: "tool-sora"
  },
  {
    id: "gem-ecom-generic",
    slug: "ecommerce-90-reels",
    title: "Chatbot 90 Reels Ecommerce",
    categoryId: "cat-ecom",
    price: 499000,
    originalPrice: 990000,
    description:
      "Goi chatbot tao 90 y tuong reels ban hang tu dong cho ecommerce da nganh.",
    thumbnail:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
    ],
    productType: "workflow",
    chatbotLink: "",
    workflowLink: "https://example.com/workflow/ecom-90",
    tutorialVideo: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    tutorialSteps: [
      {
        order: 1,
        title: "Chon nganh hang",
        content: "Tu dong map theo tone va hanh vi mua cua tung nganh."
      }
    ],
    linkedAiToolId: "tool-runway"
  }
];

export const aiTools = [
  {
    id: "tool-veo3",
    slug: "veo3",
    name: "VEO3 Studio",
    category: "Text to Video",
    description: "Nen tang tao video AI cho marketing, ho tro prompt ngan va storyboard tu dong.",
    features: ["Text to Video", "Brand Preset", "Batch Render", "Auto Caption"],
    accountPrice: 320000,
    originalPrice: 450000,
    availableCount: 15,
    websiteUrl: "https://example.com/veo3",
    tutorialUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    logo:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    linkedGemIds: ["gem-koc-fashion"]
  },
  {
    id: "tool-sora",
    slug: "sora",
    name: "Sora Motion",
    category: "Generative Video",
    description: "Cong cu sinh video AI theo phong cach dien anh va quay canh cham.",
    features: ["Cinematic", "High Fidelity", "Prompt Remix"],
    accountPrice: 390000,
    originalPrice: 590000,
    availableCount: 8,
    websiteUrl: "https://example.com/sora",
    tutorialUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    logo:
      "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?auto=format&fit=crop&w=200&q=80",
    linkedGemIds: ["gem-skincare"]
  },
  {
    id: "tool-runway",
    slug: "runway",
    name: "Runway Pro",
    category: "Video Editing AI",
    description: "Edit video AI, remove background, motion tracking va style transfer.",
    features: ["Green Screen", "Motion Tracking", "Background Replace"],
    accountPrice: 270000,
    originalPrice: 420000,
    availableCount: 21,
    websiteUrl: "https://example.com/runway",
    tutorialUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    logo:
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=200&q=80",
    linkedGemIds: ["gem-ecom-generic"]
  }
];

export const reviews = [
  {
    id: "review-1",
    slug: "review-veo3-thuc-te",
    name: "Review VEO3 thuc te 30 ngay",
    category: "Video AI",
    description:
      "Danh gia toc do render, chat luong khung hinh va ty le chuyen doi khi chay ads."
  },
  {
    id: "review-2",
    slug: "review-runway-cho-ecommerce",
    name: "Runway cho ecommerce co dang tien?",
    category: "Editing AI",
    description:
      "So sanh Runway voi quy trinh edit thu cong, danh gia ROI theo 3 cap do team."
  }
];

export const pricing = {
  monthly: 2000000,
  yearly: 16800000,
  yearlySavingsPercent: 30,
  compareRows: [
    {
      feature: "Chatbot Prompt",
      free: "Gioi han",
      premium: "Khong gioi han"
    },
    { feature: "Video huong dan", free: "Demo", premium: "Day du HD" },
    { feature: "Support", free: "Email", premium: "Zalo 1-1 24/7" },
    { feature: "Cap nhat moi", free: "Khong", premium: "Hang tuan" }
  ]
};
