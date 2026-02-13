import { createBrowserRouter, Navigate } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { AttractionsPage } from "./components/AttractionsPage";
import { AttractionDetailPage } from "./components/AttractionDetailPage";
import { PrivateToursPage } from "./components/PrivateToursPage";
import { PrivateTourDetailPage } from "./components/PrivateTourDetailPage";
import { HopOnServiceDetailPage } from "./components/HopOnServiceDetailPage";
import { BuyTicketPage } from "./components/BuyTicketPage";
import { LiveChatPage } from "./components/LiveChatPage";
import { AboutPage } from "./components/AboutPage";
import { BlogPage } from "./components/BlogPage";
import { BlogArticlePage } from "./components/BlogArticlePage";
import { RouteMapPage } from "./components/RouteMapPage";
import { AdminPage } from "./components/AdminPage";
import { DriverPortalPage } from "./components/DriverPortalPage";
import { NotFoundPage } from "./components/NotFoundPage";

// Slug generation helper
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Attraction slug mapping (based on common attraction names)
export const attractionSlugs: Record<string, string> = {
  "pena-palace": "pena-palace",
  "quinta-da-regaleira": "quinta-da-regaleira",
  "moorish-castle": "moorish-castle",
  "monserrate-palace": "monserrate-palace",
  "sintra-national-palace": "sintra-national-palace",
  "cabo-da-roca": "cabo-da-roca",
  "park-and-palace-of-pena": "pena-palace",
  "parque-e-palacio-da-pena": "pena-palace",
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
        handle: {
          meta: {
            title: "Hop On Sintra - Unlimited Day Pass for Sintra Sightseeing",
            description:
              "Explore Sintra's palaces and attractions at your own pace with unlimited hop-on/hop-off rides. Buy your day pass online for guaranteed seating in tuk-tuks and UMM jeeps.",
            keywords:
              "Sintra day pass, Sintra transportation, hop on hop off Sintra, Sintra sightseeing, Pena Palace transport, Sintra tuk tuk",
            index: true,
          },
        },
      },
      {
        path: "hop-on-service",
        element: <HopOnServiceDetailPage />,
        handle: {
          meta: {
            title: "Hop On Day Pass - Unlimited Sintra Transportation Service",
            description:
              "Discover how our unlimited day pass works. Hop on and off as many times as you want with guaranteed seating in tuk-tuks and UMM jeeps from 9am to 7pm daily.",
            keywords:
              "Hop On Sintra service, Sintra day pass details, unlimited rides Sintra, hop on hop off service, Sintra transportation pass",
            index: true,
          },
        },
      },
      {
        path: "attractions",
        element: <AttractionsPage />,
        handle: {
          meta: {
            title: "Sintra Attractions - Top Palaces & Historic Sites",
            description:
              "Discover Sintra's UNESCO World Heritage attractions including Pena Palace, Quinta da Regaleira, Moorish Castle, and more. Buy combined tickets with your day pass.",
            keywords:
              "Sintra attractions, Pena Palace, Quinta da Regaleira, Moorish Castle, Monserrate Palace, Sintra palaces, UNESCO Sintra",
            index: true,
          },
        },
      },
      {
        path: "attractions/:slug",
        element: <AttractionDetailPage />,
        handle: {
          meta: {
            // Dynamic meta will be set by the component based on attraction
            index: true,
          },
        },
      },
      {
        path: "private-tours",
        element: <PrivateToursPage />,
        handle: {
          meta: {
            title: "Private Tours of Sintra - Personalized Guided Experiences",
            description:
              "Experience Sintra your way with a private tour. Expert local guides, custom itineraries, and flexible schedules. Perfect for families, couples, and groups.",
            keywords:
              "Sintra private tours, private Sintra guide, custom Sintra tour, personalized Sintra experience, private guide Sintra",
            index: true,
          },
        },
      },
      {
        path: "private-tours/:slug",
        element: <PrivateTourDetailPage />,
        handle: {
          meta: {
            // Dynamic meta will be set by the component based on tour
            index: true,
          },
        },
      },
      {
        path: "blog",
        element: <BlogPage />,
        handle: {
          meta: {
            title: "Sintra Travel Blog - Tips, Guides & Hidden Gems",
            description:
              "Discover insider tips, travel guides, and hidden gems of Sintra. Expert advice on visiting palaces, best photography spots, and local recommendations.",
            keywords:
              "Sintra blog, Sintra travel tips, Sintra guide, visit Sintra, Sintra photography, Sintra hidden gems",
            index: true,
          },
        },
      },
      {
        path: "blog/:slug",
        element: <BlogArticlePage />,
        handle: {
          meta: {
            // Dynamic meta will be set by the component based on article
            index: true,
          },
        },
      },
      {
        path: "about",
        element: <AboutPage />,
        handle: {
          meta: {
            title: "About Hop On Sintra - Your Sintra Day Pass Service",
            description:
              "Learn about Hop On Sintra's unlimited day pass service. Guaranteed seating, professional drivers, and flexible hop-on/hop-off access to all of Sintra's attractions.",
            keywords:
              "about Hop On Sintra, Sintra transport service, Sintra day pass info, about us",
            index: true,
          },
        },
      },
      {
        path: "live-chat",
        element: <LiveChatPage />,
        handle: {
          meta: {
            title: "Contact Us - Hop On Sintra Customer Support",
            description:
              "Get instant help with your Sintra day pass. Chat with our team via WhatsApp for booking assistance, questions, and travel advice.",
            keywords: "Sintra contact, Hop On Sintra support, Sintra help, WhatsApp contact",
            index: true,
          },
        },
      },
      {
        path: "route-map",
        element: <RouteMapPage />,
        handle: {
          meta: {
            title: "Route Map - Hop On Sintra Stops & Attractions",
            description:
              "View all Hop On Sintra pickup points and attraction stops. Plan your route and see how to get to Pena Palace, Quinta da Regaleira, and more.",
            keywords:
              "Sintra route map, Sintra stops, hop on hop off map, Sintra pickup points, Sintra transport map",
            index: true,
          },
        },
      },
      {
        path: "buy-ticket",
        element: <BuyTicketPage />,
        handle: {
          meta: {
            title: "Buy Day Pass - Hop On Sintra",
            description: "Purchase your Sintra day pass for unlimited hop-on/hop-off access.",
            index: false, // Not indexed - users should arrive via home or detail pages
          },
        },
      },
      {
        path: "admin",
        element: <AdminPage />,
        handle: {
          meta: {
            title: "Admin Portal",
            index: false,
            protected: true,
          },
        },
      },
      {
        path: "driver",
        element: <DriverPortalPage />,
        handle: {
          meta: {
            title: "Driver Portal",
            index: false,
            protected: true,
          },
        },
      },
      {
        path: "404",
        element: <NotFoundPage />,
        handle: {
          meta: {
            title: "Page Not Found - Hop On Sintra",
            index: false,
          },
        },
      },
      {
        path: "*",
        element: <Navigate to="/404" replace />,
      },
    ],
  },
]);