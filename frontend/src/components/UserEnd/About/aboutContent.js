// Editable Content for LUMEN Hardware About Us Page
// Centralized text, copy, links, and photography configuration

export const ABOUT_CONTENT = {
    hero: {
        eyebrow: "ABOUT LUMEN",
        headline: "Technology should empower everyone.",
        description: "We started LUMEN with a simple belief: finding, exploring, and building high-performance hardware shouldn't be complicated or intimidating. We provide clean product discovery, verified technical specifications, and modern tools to help you choose the right technology for your journey.",
        primaryCTA: {
            text: "Explore Products",
            link: "/shop"
        },
        secondaryCTA: {
            text: "Build Your PC",
            link: "/buildpc"
        },
        image: {
            url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1200&auto=format&fit=crop&q=80",
            alt: "High-Performance Liquid-Cooled Hardware Configuration",
            tag: "Precision Hardware • Full Clarity"
        }
    },
    story: {
        eyebrow: "OUR STORY",
        heading: "More than hardware. A passion for technology.",
        lead: "LUMEN was born out of a genuine appreciation for computing power and the craft of system building.",
        paragraphs: [
            "For too long, the PC hardware space has been crowded with confusing jargon, fragmented compatibility specs, and cluttered marketplace interfaces that leave builders second-guessing their decisions.",
            "We set out to build an intentional alternative: an approachable digital platform that pairs enthusiast-grade components with thoughtful, modern tools. Whether you are assembling your first desktop or configuring a multi-GPU rendering rig, LUMEN is designed to give you clarity, confidence, and peace of mind at every step.",
            "From side-by-side component comparisons to our automated custom PC configurator, we strip away the noise so you can focus on what matters most: bringing your creative, gaming, and engineering ideas to life."
        ],
        highlights: [
            {
                title: "Thoughtful Curation",
                text: "Every component in our catalog is selected for architectural quality, thermal headroom, and platform stability."
            },
            {
                title: "Clarity Over Complexity",
                text: "Deep technical specifications, socket dimensions, and interface standards presented with transparent simplicity."
            },
            {
                title: "Builder-First Experience",
                text: "Interactive tools engineered to validate socket and power headroom before you make a purchasing decision."
            }
        ],
        image: {
            url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000&auto=format&fit=crop&q=80",
            alt: "Modern PC Hardware Workstation & Builder Workbench"
        }
    },
    missionVision: {
        mission: {
            eyebrow: "OUR MISSION",
            title: "Make technology easier to explore, understand, and choose.",
            description: "We demystify hardware specifications and empower builders of all experience levels with clean discovery, honest technical guidance, and tools that make computing accessible."
        },
        vision: {
            eyebrow: "OUR VISION",
            title: "Become a trusted destination for people who believe in the power of technology.",
            description: "We envision a community where creators, gamers, and engineers can explore state-of-the-art hardware without friction, backed by intuitive software and dependable support."
        }
    },
    coreValues: [
        {
            id: "val-customer",
            icon: "users",
            title: "Customer First",
            description: "We design every feature, interaction, and checkout flow around you. Your satisfaction, peace of mind, and building success guide every decision we make."
        },
        {
            id: "val-quality",
            icon: "shield",
            title: "Quality Matters",
            description: "We hold hardware to the highest standards. We only curate reliable hardware components from industry leaders who share our passion for performance."
        },
        {
            id: "val-transparency",
            icon: "search",
            title: "Transparency",
            description: "No hidden catches or confusing jargon. We provide upfront pricing, clear compatibility checks, and verified details on every product."
        },
        {
            id: "val-innovation",
            icon: "zap",
            title: "Innovation",
            description: "Computing evolves at breakneck speed. We constantly improve our custom PC builder, search filters, and comparison engines to keep pace with next-gen hardware."
        }
    ],
    whatWeDo: [
        {
            id: "wwd-explore",
            number: "01",
            title: "Explore Technology",
            description: "Browse an organized catalog of processors, graphics cards, motherboards, memory, displays, and precision peripherals with intuitive filtering by brand, socket, and price.",
            linkText: "Explore Catalog",
            linkUrl: "/shop",
            image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=800&auto=format&fit=crop&q=80"
        },
        {
            id: "wwd-devices",
            number: "02",
            title: "Discover Your Next Device",
            description: "From ultra-fast gaming laptops and creative notebooks to pre-configured high-FPS desktops, find complete systems tailored to your specific performance target.",
            linkText: "Browse Systems",
            linkUrl: "/shop?category=Desktop+Computers",
            image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80"
        },
        {
            id: "wwd-build",
            number: "03",
            title: "Build Your Own PC",
            description: "Experience our step-by-step custom PC builder with real-time socket matching, power headroom calculations, and dynamic component verification.",
            linkText: "Start Building",
            linkUrl: "/buildpc",
            image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=800&auto=format&fit=crop&q=80"
        },
        {
            id: "wwd-support",
            number: "04",
            title: "Customer Support",
            description: "Need help confirming dimensions, checking BIOS compatibility, or tracking your order? Our dedicated customer care team is always here to assist.",
            linkText: "Get Support",
            linkUrl: "/account/help-and-support",
            image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"
        }
    ],
    whyChoose: {
        eyebrow: "THE LUMEN EXPERIENCE",
        headline: "Why Choose LUMEN?",
        subtitle: "A digital shopping experience built from the ground up for modern builders and creators.",
        features: [
            {
                number: "01",
                title: "Organized Product Discovery",
                description: "Find the exact hardware you need with multi-attribute filtering by category, subcategory, chipset, and form factor."
            },
            {
                number: "02",
                title: "Useful Product Information",
                description: "Detailed technical specification sheets, memory timings, and clearance guidelines without promotional clutter."
            },
            {
                number: "03",
                title: "Technology Exploration",
                description: "Side-by-side hardware comparison engine to weigh benchmark trade-offs and specifications before you buy."
            },
            {
                number: "04",
                title: "Custom PC-Building Possibilities",
                description: "Full system configurator with automatic socket cross-referencing and wattage estimation to prevent build errors."
            },
            {
                number: "05",
                title: "Responsive Customer Support",
                description: "Direct helpdesk ticketing and seamless tracking right inside your personal customer account dashboard."
            }
        ]
    },
    closingCTA: {
        headline: "Your next great idea starts with the right technology.",
        description: "Whether you're piecing together an enthusiast custom gaming rig or upgrading your daily workstation, LUMEN gives you the tools, clarity, and hardware to make it reality.",
        primaryCTA: {
            text: "Explore Products",
            link: "/shop"
        },
        secondaryCTA: {
            text: "Build Your PC",
            link: "/buildpc"
        },
        image: "https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=1200&auto=format&fit=crop&q=80"
    }
};
