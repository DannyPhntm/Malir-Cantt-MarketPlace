import { PulseFitHero } from "@/components/ui/pulse-fit-hero";

export default function PulseFitHeroDemo() {
  return (
    <PulseFitHero
      logo="Malir Market"
      navigation={[
        { label: "Browse", onClick: () => {} },
        { label: "Categories", hasDropdown: true, onClick: () => {} },
        { label: "Listings", onClick: () => {} },
        { label: "About", onClick: () => {} },
        { label: "Contact", onClick: () => {} },
      ]}
      ctaButton={{
        label: "List an Item",
        onClick: () => {},
      }}
      title="Find Everything Inside Malir Cantt."
      subtitle="Buy, sell, and connect with your neighbours. The trusted marketplace exclusively for Malir Cantt residents."
      primaryAction={{
        label: "Browse listings",
        onClick: () => {},
      }}
      secondaryAction={{
        label: "Sell something",
        onClick: () => {},
      }}
      disclaimer="*Free to list. No hidden charges."
      socialProof={{
        avatars: [
          "https://i.pravatar.cc/150?img=11",
          "https://i.pravatar.cc/150?img=22",
          "https://i.pravatar.cc/150?img=33",
          "https://i.pravatar.cc/150?img=44",
        ],
        text: "Trusted by 1,000+ Malir Cantt residents",
      }}
      programs={[
        {
          image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&h=500&fit=crop",
          category: "CARS & VEHICLES",
          title: "Browse Cars",
          onClick: () => {},
        },
        {
          image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=500&fit=crop",
          category: "ELECTRONICS",
          title: "Phones & Gadgets",
          onClick: () => {},
        },
        {
          image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=500&fit=crop",
          category: "PROPERTY",
          title: "Homes & Apartments",
          onClick: () => {},
        },
        {
          image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=500&fit=crop",
          category: "FURNITURE",
          title: "Home & Living",
          onClick: () => {},
        },
        {
          image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=500&fit=crop",
          category: "JOBS",
          title: "Local Opportunities",
          onClick: () => {},
        },
        {
          image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=500&fit=crop",
          category: "SERVICES",
          title: "Local Services",
          onClick: () => {},
        },
      ]}
    />
  );
}
