import * as fs from "node:fs";

export const PORTFOLIO_CONFIG_PATH = "portfolio-config.json";
export const DEFAULT_TEMPLATE_NAME = "default";

export const DEFAULT_PORTFOLIO_CONFIG = {
  site: {
    title: "My Static Site",
    description: "",
    author: "",
    keywords: [],
    branding: {
      favicon: "assets/icons/favicon-reprofolio-grid.svg",
      logo: {
        src: "assets/images/branding/logo-reprofolio-grid.svg",
        alt: "Site logo"
      }
    },
    contact: {
      fullName: "",
      role: "",
      institution: "",
      department: "",
      postalAddress: "",
      office: "",
      coordinates: {
        latitude: 0,
        longitude: 0
      },
      phones: [],
      emails: {
        institutional: "",
        personal: [],
        professional: []
      },
      socials: []
    }
  },
  templates: {
    default: DEFAULT_TEMPLATE_NAME
  },
  custom: {
    styles: ["assets/css/custom.css"],
    scripts: ["assets/js/custom.js"]
  },
  seo: {
    siteUrl: "",
    defaultLocale: "en_US",
    defaultType: "website",
    defaultRobots: "index,follow",
    defaultImage: "",
    twitterHandle: "",
    organizationName: "",
    sameAs: []
  }
};

export function readPortfolioConfig() {
  if (!fs.existsSync(PORTFOLIO_CONFIG_PATH)) {
    return DEFAULT_PORTFOLIO_CONFIG;
  }

  const userConfig = JSON.parse(fs.readFileSync(PORTFOLIO_CONFIG_PATH, "utf-8"));
  const defaultSite = DEFAULT_PORTFOLIO_CONFIG.site;
  const userSite = userConfig.site || {};
  const defaultBranding = defaultSite.branding || {};
  const userBranding = userSite.branding || {};
  const defaultLogo = defaultBranding.logo || {};
  const userLogo = userBranding.logo || {};
  const defaultContact = defaultSite.contact || {};
  const userContact = userSite.contact || {};
  const defaultEmails = defaultContact.emails || {};
  const userEmails = userContact.emails || {};
  const defaultCoordinates = defaultContact.coordinates || {};
  const userCoordinates = userContact.coordinates || {};
  const defaultTemplates = DEFAULT_PORTFOLIO_CONFIG.templates;
  const userTemplates = userConfig.templates || {};
  const defaultCustom = DEFAULT_PORTFOLIO_CONFIG.custom || {};
  const userCustom = userConfig.custom || {};

  return {
    ...DEFAULT_PORTFOLIO_CONFIG,
    ...userConfig,
    site: {
      ...defaultSite,
      ...userSite,
      branding: {
        ...defaultBranding,
        ...userBranding,
        logo: {
          ...defaultLogo,
          ...userLogo
        }
      },
      contact: {
        ...defaultContact,
        ...userContact,
        coordinates: {
          ...defaultCoordinates,
          ...userCoordinates
        },
        emails: {
          ...defaultEmails,
          ...userEmails
        }
      }
    },
    templates: {
      ...defaultTemplates,
      ...userTemplates
    },
    custom: {
      ...defaultCustom,
      ...userCustom,
      styles: Array.isArray(userCustom.styles) ? userCustom.styles : defaultCustom.styles,
      scripts: Array.isArray(userCustom.scripts) ? userCustom.scripts : defaultCustom.scripts
    },
    seo: {
      ...DEFAULT_PORTFOLIO_CONFIG.seo,
      ...(userConfig.seo || {})
    }
  };
}

