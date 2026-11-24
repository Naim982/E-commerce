// Data definition for LUMEN Custom PC Builder
export const STAGES = [
            // ==========================================
            // STAGE 1: CPU
            // ==========================================
            {
                id: "stage-cpu",
                stepNumber: 1,
                title: "Processor (CPU)",
                hint: "Socket AM5 • LGA1851 • LGA1700",
                availableCount: "9 processors available",
                status: { id: "status-cpu", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search CPUs (e.g. 7800X3D, Ultra 9, i7)...",
                    pills: [
                        { group: "brand", value: "all", label: "All Brands", isActive: true },
                        { group: "brand", value: "amd", label: "AMD", isActive: false },
                        { group: "brand", value: "intel", label: "Intel", isActive: false },
                        { group: "socket", value: "am5", label: "AM5", isActive: false },
                        { group: "socket", value: "lga1851", label: "LGA1851", isActive: false },
                        { group: "socket", value: "lga1700", label: "LGA1700", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "cpu-1",
                        category: "cpu",
                        dataName: "AMD Ryzen 7 7800X3D",
                        price: 349.00,
                        watts: 120,
                        socket: "AM5",
                        brand: "amd",
                        isSelected: true,
                        badge: { type: "accent", text: "GAMING #1" },
                        displayPrice: "৳349.00",
                        title: "AMD Ryzen™ 7 7800X3D 8-Core 3D V-Cache",
                        chips: ["8C / 16T", "5.0 GHz Boost", "120W TDP", "AM5 Socket"],
                        compatibility: { isMatch: true, text: "✓ AM5 Compatible" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "cpu-2",
                        category: "cpu",
                        dataName: "AMD Ryzen 9 9950X",
                        price: 599.00,
                        watts: 170,
                        socket: "AM5",
                        brand: "amd",
                        isSelected: false,
                        badge: { type: "success", text: "ZEN 5 FLAGSHIP" },
                        displayPrice: "৳599.00",
                        title: "AMD Ryzen™ 9 9950X 16-Core 32-Thread",
                        chips: ["16C / 32T", "5.7 GHz Boost", "170W TDP", "AM5 Socket"],
                        compatibility: { isMatch: true, text: "✓ AM5 Compatible" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-3",
                        category: "cpu",
                        dataName: "AMD Ryzen 9 9900X",
                        price: 449.00,
                        watts: 120,
                        socket: "AM5",
                        brand: "amd",
                        isSelected: false,
                        badge: { type: "primary", text: "CREATOR PICK" },
                        displayPrice: "৳449.00",
                        title: "AMD Ryzen™ 9 9900X 12-Core 24-Thread",
                        chips: ["12C / 24T", "5.6 GHz Boost", "120W TDP", "AM5 Socket"],
                        compatibility: { isMatch: true, text: "✓ AM5 Compatible" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-4",
                        category: "cpu",
                        dataName: "AMD Ryzen 7 9700X",
                        price: 359.00,
                        watts: 65,
                        socket: "AM5",
                        brand: "amd",
                        isSelected: false,
                        badge: { type: "success", text: "65W EFFICIENCY" },
                        displayPrice: "৳359.00",
                        title: "AMD Ryzen™ 7 9700X 8-Core 16-Thread",
                        chips: ["8C / 16T", "5.5 GHz Boost", "65W TDP", "AM5 Socket"],
                        compatibility: { isMatch: true, text: "✓ AM5 Compatible" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-5",
                        category: "cpu",
                        dataName: "AMD Ryzen 5 7600X",
                        price: 199.00,
                        watts: 105,
                        socket: "AM5",
                        brand: "amd",
                        isSelected: false,
                        badge: { type: "warning", text: "SWEET VALUE" },
                        displayPrice: "৳199.00",
                        title: "AMD Ryzen™ 5 7600X 6-Core 12-Thread",
                        chips: ["6C / 12T", "5.3 GHz Boost", "105W TDP", "AM5 Socket"],
                        compatibility: { isMatch: true, text: "✓ AM5 Compatible" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-6",
                        category: "cpu",
                        dataName: "Intel Core Ultra 9 285K",
                        price: 589.00,
                        watts: 125,
                        socket: "LGA1851",
                        brand: "intel",
                        isSelected: false,
                        badge: { type: "accent", text: "ARROW LAKE FLAGSHIP" },
                        displayPrice: "৳589.00",
                        title: "Intel® Core™ Ultra 9 285K 24-Core Desktop",
                        chips: ["24C (8P+16E)", "5.7 GHz Boost", "125W Base", "LGA1851"],
                        compatibility: { isMatch: false, text: "LGA1851 Socket" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-7",
                        category: "cpu",
                        dataName: "Intel Core Ultra 7 265K",
                        price: 399.00,
                        watts: 125,
                        socket: "LGA1851",
                        brand: "intel",
                        isSelected: false,
                        badge: { type: "primary", text: "HYBRID PERFORMANCE" },
                        displayPrice: "৳399.00",
                        title: "Intel® Core™ Ultra 7 265K 20-Core Desktop",
                        chips: ["20C (8P+12E)", "5.5 GHz Boost", "125W Base", "LGA1851"],
                        compatibility: { isMatch: false, text: "LGA1851 Socket" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-8",
                        category: "cpu",
                        dataName: "Intel Core i7-14700K",
                        price: 369.00,
                        watts: 125,
                        socket: "LGA1700",
                        brand: "intel",
                        isSelected: false,
                        badge: { type: "success", text: "RAPTOR LAKE" },
                        displayPrice: "৳369.00",
                        title: "Intel® Core™ i7-14700K 20-Core 28-Thread",
                        chips: ["20C (8P+12E)", "5.6 GHz Boost", "125W TDP", "LGA1700"],
                        compatibility: { isMatch: false, text: "LGA1700 Socket" },
                        button: { text: "Select CPU", type: "outline" }
                    },
                    {
                        id: "cpu-9",
                        category: "cpu",
                        dataName: "Intel Core i5-14600K",
                        price: 269.00,
                        watts: 125,
                        socket: "LGA1700",
                        brand: "intel",
                        isSelected: false,
                        badge: { type: "warning", text: "MID-TIER KING" },
                        displayPrice: "৳269.00",
                        title: "Intel® Core™ i5-14600K 14-Core 20-Thread",
                        chips: ["14C (6P+8E)", "5.3 GHz Boost", "125W TDP", "LGA1700"],
                        compatibility: { isMatch: false, text: "LGA1700 Socket" },
                        button: { text: "Select CPU", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 2: MOTHERBOARD
            // ==========================================
            {
                id: "stage-mobo",
                stepNumber: 2,
                title: "Motherboard",
                hint: "AM5 • LGA1851 • LGA1700 Chipsets",
                availableCount: "9 boards available",
                status: { id: "status-mobo", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search motherboards (e.g. B650, X870, Z890, Wi-Fi 7)...",
                    pills: [
                        { group: "socket", value: "all", label: "All Sockets", isActive: true },
                        { group: "socket", value: "am5", label: "AM5 (AMD)", isActive: false },
                        { group: "socket", value: "lga1851", label: "LGA1851 (Intel)", isActive: false },
                        { group: "socket", value: "lga1700", label: "LGA1700 (Intel)", isActive: false },
                        { group: "form", value: "atx", label: "ATX", isActive: false },
                        { group: "form", value: "matx", label: "Micro-ATX", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "mobo-1",
                        category: "mobo",
                        dataName: "MSI MAG B650 Tomahawk WiFi",
                        price: 199.00,
                        watts: 40,
                        socket: "AM5",
                        form: "atx",
                        isSelected: true,
                        badge: { type: "success", text: "BEST SELLER" },
                        displayPrice: "৳199.00",
                        title: "MSI MAG B650 Tomahawk WiFi AM5 ATX",
                        chips: ["AM5 Socket", "DDR5 7600+", "PCIe 5.0 M.2", "Wi-Fi 6E"],
                        compatibility: { isMatch: true, text: "✓ AM5 Socket Match" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "mobo-2",
                        category: "mobo",
                        dataName: "ASUS ROG Strix X870-E Gaming WiFi 7",
                        price: 389.00,
                        watts: 50,
                        socket: "AM5",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "accent", text: "FLAGSHIP X870" },
                        displayPrice: "৳389.00",
                        title: "ASUS ROG Strix X870-E Gaming WiFi 7 ATX",
                        chips: ["AM5 Socket", "DDR5 8000+", "Dual USB4 40G", "Wi-Fi 7"],
                        compatibility: { isMatch: true, text: "✓ AM5 Socket Match" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-3",
                        category: "mobo",
                        dataName: "Gigabyte B650 AORUS Elite AX",
                        price: 189.00,
                        watts: 40,
                        socket: "AM5",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "primary", text: "TOP VALUE" },
                        displayPrice: "৳189.00",
                        title: "Gigabyte B650 AORUS Elite AX V2 ATX",
                        chips: ["AM5 Socket", "DDR5 7200", "12+2+2 VRM", "Wi-Fi 6E"],
                        compatibility: { isMatch: true, text: "✓ AM5 Socket Match" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-4",
                        category: "mobo",
                        dataName: "ASRock B650M Pro RS WiFi",
                        price: 149.00,
                        watts: 35,
                        socket: "AM5",
                        form: "matx",
                        isSelected: false,
                        badge: { type: "warning", text: "COMPACT MATX" },
                        displayPrice: "৳149.00",
                        title: "ASRock B650M Pro RS WiFi Micro-ATX",
                        chips: ["AM5 Socket", "DDR5 7200+", "PCIe 5.0 M.2", "Micro-ATX"],
                        compatibility: { isMatch: true, text: "✓ AM5 Socket Match" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-5",
                        category: "mobo",
                        dataName: "ASUS ROG Crosshair X670E Hero",
                        price: 599.00,
                        watts: 50,
                        socket: "AM5",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "accent", text: "EXTREME OC" },
                        displayPrice: "৳599.00",
                        title: "ASUS ROG Crosshair X670E Hero Flagship ATX",
                        chips: ["AM5 Socket", "18+2+2 Power", "PCIe 5.0 Slots", "Polymo Lighting"],
                        compatibility: { isMatch: true, text: "✓ AM5 Socket Match" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-6",
                        category: "mobo",
                        dataName: "ASUS ROG Maximus Z890 Hero",
                        price: 649.00,
                        watts: 50,
                        socket: "LGA1851",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "accent", text: "LGA1851 HERO" },
                        displayPrice: "৳649.00",
                        title: "ASUS ROG Maximus Z890 Hero Thunderbolt 4",
                        chips: ["LGA1851", "DDR5 8400+", "Thunderbolt 4", "Wi-Fi 7"],
                        compatibility: { isMatch: false, text: "Intel Socket" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-7",
                        category: "mobo",
                        dataName: "MSI MAG Z890 Tomahawk WiFi",
                        price: 279.00,
                        watts: 45,
                        socket: "LGA1851",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "success", text: "Z890 VALUE" },
                        displayPrice: "৳279.00",
                        title: "MSI MAG Z890 Tomahawk WiFi ATX",
                        chips: ["LGA1851", "DDR5 8000+", "PCIe 5.0", "5G LAN"],
                        compatibility: { isMatch: false, text: "Intel Socket" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-8",
                        category: "mobo",
                        dataName: "Gigabyte Z790 AORUS Master X",
                        price: 399.00,
                        watts: 50,
                        socket: "LGA1700",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "primary", text: "Z790 PRO" },
                        displayPrice: "৳399.00",
                        title: "Gigabyte Z790 AORUS Master X WiFi 7 ATX",
                        chips: ["LGA1700", "DDR5 8266+", "10G LAN", "10 M.2 Slots"],
                        compatibility: { isMatch: false, text: "Intel Socket" },
                        button: { text: "Select Board", type: "outline" }
                    },
                    {
                        id: "mobo-9",
                        category: "mobo",
                        dataName: "MSI PRO Z790-A MAX WiFi",
                        price: 219.00,
                        watts: 40,
                        socket: "LGA1700",
                        form: "atx",
                        isSelected: false,
                        badge: { type: "warning", text: "Z790 MID-TIER" },
                        displayPrice: "৳219.00",
                        title: "MSI PRO Z790-A MAX WiFi ATX",
                        chips: ["LGA1700", "DDR5 7200", "PCIe 5.0", "Wi-Fi 7"],
                        compatibility: { isMatch: false, text: "Intel Socket" },
                        button: { text: "Select Board", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 3: CPU COOLER
            // ==========================================
            {
                id: "stage-cooler",
                stepNumber: 3,
                title: "CPU Cooler",
                hint: "AIO Liquid • Dual-Tower Air",
                availableCount: "8 coolers available",
                status: { id: "status-cooler", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search coolers (e.g. Kraken, Liquid Freezer, Peerless Assassin)...",
                    pills: [
                        { group: "type", value: "all", label: "All Coolers", isActive: true },
                        { group: "type", value: "aio", label: "AIO Liquid (360/240mm)", isActive: false },
                        { group: "type", value: "air", label: "Air Coolers", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "cooler-1",
                        category: "cooler",
                        dataName: "NZXT Kraken Elite 360 RGB LCD",
                        price: 279.00,
                        watts: 15,
                        type: "aio",
                        isSelected: true,
                        badge: { type: "accent", text: "PREMIUM LCD" },
                        displayPrice: "৳279.00",
                        title: "NZXT Kraken Elite 360 RGB LCD Liquid Cooler",
                        chips: ["360mm Radiator", "2.36\" 60Hz LCD", "F120 RGB Core", "AM5 & LGA1851"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "cooler-2",
                        category: "cooler",
                        dataName: "Corsair iCUE LINK Titan 360 RX",
                        price: 249.00,
                        watts: 18,
                        type: "aio",
                        isSelected: false,
                        badge: { type: "success", text: "FLOWDRIVE PUMP" },
                        displayPrice: "৳249.00",
                        title: "Corsair iCUE LINK Titan 360 RX RGB AIO",
                        chips: ["360mm Radiator", "Single-Cable Hub", "RX120 Magnetic", "CapSwap System"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    },
                    {
                        id: "cooler-3",
                        category: "cooler",
                        dataName: "Arctic Liquid Freezer III 360",
                        price: 129.00,
                        watts: 12,
                        type: "aio",
                        isSelected: false,
                        badge: { type: "primary", text: "BEST THERMAL VALUE" },
                        displayPrice: "৳129.00",
                        title: "Arctic Liquid Freezer III 360 High-Pressure AIO",
                        chips: ["38mm Thick Rad", "Integrated VRM Fan", "P12 PWM Fans", "Offset Mounting"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    },
                    {
                        id: "cooler-4",
                        category: "cooler",
                        dataName: "DeepCool LT720 360mm AIO",
                        price: 119.00,
                        watts: 14,
                        type: "aio",
                        isSelected: false,
                        badge: { type: "warning", text: "INFINITY MIRROR" },
                        displayPrice: "৳119.00",
                        title: "DeepCool LT720 360mm High-Performance AIO",
                        chips: ["360mm Radiator", "4th Gen Dual-Pump", "FK120 FDB Fans", "Leak-Free Tech"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    },
                    {
                        id: "cooler-5",
                        category: "cooler",
                        dataName: "NZXT Kraken 240 RGB",
                        price: 149.00,
                        watts: 10,
                        type: "aio",
                        isSelected: false,
                        badge: { type: "success", text: "COMPACT 240MM" },
                        displayPrice: "৳149.00",
                        title: "NZXT Kraken 240 RGB Liquid CPU Cooler",
                        chips: ["240mm Radiator", "1.54\" LCD Screen", "Dual F120 RGB", "Micro-ATX Fit"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    },
                    {
                        id: "cooler-6",
                        category: "cooler",
                        dataName: "Thermalright Peerless Assassin 120 SE",
                        price: 38.00,
                        watts: 5,
                        type: "air",
                        isSelected: false,
                        badge: { type: "warning", text: "LEGENDARY AIR VALUE" },
                        displayPrice: "৳38.00",
                        title: "Thermalright Peerless Assassin 120 SE Dual Tower",
                        chips: ["Dual 120mm Fans", "6 Heatpipes", "245W TDP Rated", "Zero Pump Noise"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    },
                    {
                        id: "cooler-7",
                        category: "cooler",
                        dataName: "Noctua NH-D15 chromax.black",
                        price: 119.00,
                        watts: 6,
                        type: "air",
                        isSelected: false,
                        badge: { type: "primary", text: "WHISPER QUIET" },
                        displayPrice: "৳119.00",
                        title: "Noctua NH-D15 chromax.black Dual-Tower Air Cooler",
                        chips: ["Dual NF-A15 140mm", "SecuFirm2 System", "6-Yr Warranty", "Matte Black"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    },
                    {
                        id: "cooler-8",
                        category: "cooler",
                        dataName: "be quiet! Dark Rock Pro 5",
                        price: 89.00,
                        watts: 6,
                        type: "air",
                        isSelected: false,
                        badge: { type: "success", text: "GERMAN ACOUSTICS" },
                        displayPrice: "৳89.00",
                        title: "be quiet! Dark Rock Pro 5 Silent Dual-Tower",
                        chips: ["270W TDP Capable", "Silent Wings Fans", "Speed Switch", "Stealth Top Cover"],
                        compatibility: { isMatch: true, text: "✓ AM5 Bracket Included" },
                        button: { text: "Select Cooler", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 4: MEMORY (RAM)
            // ==========================================
            {
                id: "stage-ram",
                stepNumber: 4,
                title: "Memory (RAM)",
                hint: "DDR5 Dual-Channel • EXPO & XMP Ready",
                availableCount: "9 memory kits available",
                status: { id: "status-ram", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search RAM (e.g. 32GB, 64GB, 6000MHz, Dominator)...",
                    pills: [
                        { group: "capacity", value: "all", label: "All Capacities", isActive: true },
                        { group: "capacity", value: "32gb", label: "32GB (2x16GB)", isActive: false },
                        { group: "capacity", value: "64gb", label: "64GB (2x32GB)", isActive: false },
                        { group: "capacity", value: "96gb", label: "96GB (2x48GB)", isActive: false },
                        { group: "speed", value: "6000", label: "6000 MT/s", isActive: false },
                        { group: "speed", value: "7200", label: "7200 MT/s", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "ram-1",
                        category: "ram",
                        dataName: "G.Skill Trident Z5 RGB 32GB DDR5 6000",
                        price: 119.00,
                        watts: 15,
                        capacity: "32gb",
                        speed: "6000",
                        isSelected: true,
                        badge: { type: "success", text: "EXPO READY" },
                        displayPrice: "৳119.00",
                        title: "G.Skill Trident Z5 RGB 32GB (2x16GB) DDR5 6000 CL30",
                        chips: ["32GB (2x16GB)", "6000 MT/s", "CL30 Low Latency", "AMD EXPO / XMP"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "ram-2",
                        category: "ram",
                        dataName: "Corsair Dominator Titanium 64GB DDR5 7200",
                        price: 249.00,
                        watts: 20,
                        capacity: "64gb",
                        speed: "7200",
                        isSelected: false,
                        badge: { type: "accent", text: "CREATOR 64GB" },
                        displayPrice: "৳249.00",
                        title: "Corsair Dominator Titanium 64GB (2x32GB) DDR5 7200",
                        chips: ["64GB (2x32GB)", "7200 MT/s", "CL34 Timing", "Forged Aluminum"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-3",
                        category: "ram",
                        dataName: "Corsair Vengeance RGB 32GB DDR5 6000",
                        price: 109.00,
                        watts: 15,
                        capacity: "32gb",
                        speed: "6000",
                        isSelected: false,
                        badge: { type: "primary", text: "BEST SELLER" },
                        displayPrice: "৳109.00",
                        title: "Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000 CL30",
                        chips: ["32GB (2x16GB)", "6000 MT/s", "CL30 Low-Latency", "Ten-Zone RGB"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-4",
                        category: "ram",
                        dataName: "TeamGroup T-Force Delta RGB 32GB DDR5 6400",
                        price: 115.00,
                        watts: 15,
                        capacity: "32gb",
                        speed: "6400",
                        isSelected: false,
                        badge: { type: "warning", text: "SPEED DEMON" },
                        displayPrice: "৳115.00",
                        title: "TeamGroup T-Force Delta RGB 32GB DDR5 6400 CL32",
                        chips: ["32GB (2x16GB)", "6400 MT/s", "CL32 Timing", "120° Wide Angle"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-5",
                        category: "ram",
                        dataName: "Kingston Fury Beast 32GB DDR5 5600",
                        price: 95.00,
                        watts: 12,
                        capacity: "32gb",
                        speed: "5600",
                        isSelected: false,
                        badge: { type: "success", text: "PLUG & PLAY" },
                        displayPrice: "৳95.00",
                        title: "Kingston Fury Beast 32GB (2x16GB) DDR5 5600 CL36",
                        chips: ["32GB (2x16GB)", "5600 MT/s", "Low-Profile Heat", "JEDEC Stable"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-6",
                        category: "ram",
                        dataName: "G.Skill Ripjaws S5 64GB DDR5 6000",
                        price: 199.00,
                        watts: 20,
                        capacity: "64gb",
                        speed: "6000",
                        isSelected: false,
                        badge: { type: "primary", text: "STEALTH 64GB" },
                        displayPrice: "৳199.00",
                        title: "G.Skill Ripjaws S5 64GB (2x32GB) DDR5 6000 CL30",
                        chips: ["64GB (2x32GB)", "6000 MT/s", "33mm Low Profile", "Non-RGB Stealth"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-7",
                        category: "ram",
                        dataName: "Corsair Dominator Titanium 96GB DDR5 6600",
                        price: 389.00,
                        watts: 25,
                        capacity: "96gb",
                        speed: "6600",
                        isSelected: false,
                        badge: { type: "accent", text: "ULTIMATE 96GB" },
                        displayPrice: "৳389.00",
                        title: "Corsair Dominator Titanium 96GB (2x48GB) DDR5 6600",
                        chips: ["96GB (2x48GB)", "6600 MT/s", "24GB Die Density", "Workstation RAM"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-8",
                        category: "ram",
                        dataName: "G.Skill Trident Z5 Neo 32GB DDR5 6000",
                        price: 125.00,
                        watts: 15,
                        capacity: "32gb",
                        speed: "6000",
                        isSelected: false,
                        badge: { type: "success", text: "AM5 OPTIMIZED" },
                        displayPrice: "৳125.00",
                        title: "G.Skill Trident Z5 Neo RGB 32GB (2x16GB) DDR5 6000",
                        chips: ["32GB (2x16GB)", "6000 MT/s", "CL30-38-38-96", "Ryzen EXPO Tuned"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    },
                    {
                        id: "ram-9",
                        category: "ram",
                        dataName: "Crucial Pro 32GB DDR5 5600",
                        price: 84.00,
                        watts: 10,
                        capacity: "32gb",
                        speed: "5600",
                        isSelected: false,
                        badge: { type: "warning", text: "BUDGET PICK" },
                        displayPrice: "৳84.00",
                        title: "Crucial Pro 32GB (2x16GB) DDR5 5600 UDIMM",
                        chips: ["32GB (2x16GB)", "5600 MT/s", "Black Anodized", "Plug & Play"],
                        compatibility: { isMatch: true, text: "✓ DDR5 Motherboard Match" },
                        button: { text: "Select RAM", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 5: GRAPHICS CARD (GPU)
            // ==========================================
            {
                id: "stage-gpu",
                stepNumber: 5,
                title: "Graphics Card (GPU)",
                hint: "NVIDIA RTX 50 & 40 Series • AMD Radeon",
                availableCount: "9 GPUs available",
                status: { id: "status-gpu", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search GPUs (e.g. RTX 5080, 5070, RX 7900 XTX, 16GB)...",
                    pills: [
                        { group: "brand", value: "all", label: "All GPUs", isActive: true },
                        { group: "brand", value: "rtx50", label: "RTX 50-Series", isActive: false },
                        { group: "brand", value: "rtx40", label: "RTX 40-Series", isActive: false },
                        { group: "brand", value: "radeon", label: "AMD Radeon", isActive: false },
                        { group: "vram", value: "16gb", label: "16GB+ VRAM", isActive: false },
                        { group: "vram", value: "12gb", label: "12GB VRAM", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "gpu-1",
                        category: "gpu",
                        dataName: "NVIDIA RTX 5070 12GB",
                        price: 549.00,
                        watts: 220,
                        length: 280,
                        brand: "rtx50",
                        vram: "12gb",
                        isSelected: true,
                        badge: { type: "warning", text: "SWEET SPOT" },
                        displayPrice: "৳549.00",
                        title: "NVIDIA GeForce RTX 5070 12GB GDDR7",
                        chips: ["12GB GDDR7", "DLSS 4.0", "220W TGP", "280mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (280mm < 435mm)" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "gpu-2",
                        category: "gpu",
                        dataName: "NVIDIA RTX 5070 Ti 16GB",
                        price: 749.00,
                        watts: 285,
                        length: 305,
                        brand: "rtx50",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "success", text: "1440P ULTRA KING" },
                        displayPrice: "৳749.00",
                        title: "NVIDIA GeForce RTX 5070 Ti 16GB GDDR7",
                        chips: ["16GB GDDR7", "DLSS 4.0 Ultra", "285W TGP", "305mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (305mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-3",
                        category: "gpu",
                        dataName: "ASUS ROG Strix RTX 5080 16GB",
                        price: 999.00,
                        watts: 360,
                        length: 336,
                        brand: "rtx50",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "accent", text: "FLAGSHIP 4K" },
                        displayPrice: "৳999.00",
                        title: "ASUS ROG Strix GeForce RTX 5080 16GB GDDR7",
                        chips: ["16GB GDDR7", "Blackwell 4K", "360W TGP", "336mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (336mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-4",
                        category: "gpu",
                        dataName: "MSI Gaming X Trio RTX 5080 16GB",
                        price: 1049.00,
                        watts: 360,
                        length: 330,
                        brand: "rtx50",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "accent", text: "FACTORY OVERCLOCK" },
                        displayPrice: "৳1049.00",
                        title: "MSI Gaming X Trio RTX 5080 16GB GDDR7",
                        chips: ["16GB GDDR7", "Tri-Frozr 3 Fan", "360W TGP", "330mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (330mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-5",
                        category: "gpu",
                        dataName: "Gigabyte RTX 4070 Ti Super 16GB",
                        price: 789.00,
                        watts: 285,
                        length: 300,
                        brand: "rtx40",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "primary", text: "16GB VRAM PRO" },
                        displayPrice: "৳789.00",
                        title: "Gigabyte GeForce RTX 4070 Ti Super 16GB",
                        chips: ["16GB GDDR6X", "DLSS 3.5 & Frame Gen", "285W TGP", "300mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (300mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-6",
                        category: "gpu",
                        dataName: "Sapphire Nitro+ RX 7900 XTX 24GB",
                        price: 899.00,
                        watts: 355,
                        length: 320,
                        brand: "radeon",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "error", text: "24GB VRAM BEAST" },
                        displayPrice: "৳899.00",
                        title: "Sapphire Nitro+ AMD Radeon RX 7900 XTX 24GB",
                        chips: ["24GB GDDR6", "Vapor-X Cooling", "355W TGP", "320mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (320mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-7",
                        category: "gpu",
                        dataName: "PowerColor Hellhound RX 7800 XT 16GB",
                        price: 489.00,
                        watts: 263,
                        length: 322,
                        brand: "radeon",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "success", text: "1440P VALUE PICK" },
                        displayPrice: "৳489.00",
                        title: "PowerColor Hellhound AMD Radeon RX 7800 XT 16GB",
                        chips: ["16GB GDDR6", "Dual BIOS", "263W TGP", "322mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (322mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-8",
                        category: "gpu",
                        dataName: "Zotac Gaming RTX 4060 Ti 16GB",
                        price: 449.00,
                        watts: 165,
                        length: 225,
                        brand: "rtx40",
                        vram: "16gb",
                        isSelected: false,
                        badge: { type: "warning", text: "COMPACT 16GB" },
                        displayPrice: "৳449.00",
                        title: "Zotac Gaming GeForce RTX 4060 Ti 16GB Twin Edge",
                        chips: ["16GB GDDR6", "Dual Fan Compact", "165W TGP", "225mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (225mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    },
                    {
                        id: "gpu-9",
                        category: "gpu",
                        dataName: "ASUS Dual RTX 4060 8GB",
                        price: 299.00,
                        watts: 115,
                        length: 227,
                        brand: "rtx40",
                        vram: "8gb",
                        isSelected: false,
                        badge: { type: "primary", text: "1080P BUDGET" },
                        displayPrice: "৳299.00",
                        title: "ASUS Dual GeForce RTX 4060 8GB GDDR6",
                        chips: ["8GB GDDR6", "Axial-Tech Fans", "115W TGP", "227mm Length"],
                        compatibility: { isMatch: true, text: "✓ Fits Case (227mm < 435mm)" },
                        button: { text: "Select GPU", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 6: STORAGE (NVMe SSD)
            // ==========================================
            {
                id: "stage-ssd",
                stepNumber: 6,
                title: "Storage (PCIe NVMe SSD)",
                hint: "PCIe Gen5 & Gen4 M.2 Solid State Drives",
                availableCount: "8 SSDs available",
                status: { id: "status-ssd", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search SSDs (e.g. 990 PRO, Gen5, 2TB, 4TB)...",
                    pills: [
                        { group: "gen", value: "all", label: "All Generations", isActive: true },
                        { group: "gen", value: "gen5", label: "PCIe Gen5 (14,500 MB/s)", isActive: false },
                        { group: "gen", value: "gen4", label: "PCIe Gen4 (7,450 MB/s)", isActive: false },
                        { group: "cap", value: "2tb", label: "2TB", isActive: false },
                        { group: "cap", value: "4tb", label: "4TB", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "ssd-1",
                        category: "ssd",
                        dataName: "Samsung 990 EVO Plus 2TB",
                        price: 149.00,
                        watts: 8,
                        gen: "gen5",
                        capacity: "2tb",
                        isSelected: true,
                        badge: { type: "success", text: "FAST 2TB GEN5" },
                        displayPrice: "৳149.00",
                        title: "Samsung 990 EVO Plus 2TB PCIe Gen5 NVMe",
                        chips: ["14,500 MB/s Read", "2TB M.2 2280", "DirectStorage 1.2", "V-NAND V8"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "ssd-2",
                        category: "ssd",
                        dataName: "Samsung 990 EVO Plus 4TB",
                        price: 289.00,
                        watts: 10,
                        gen: "gen5",
                        capacity: "4tb",
                        isSelected: false,
                        badge: { type: "accent", text: "MASSIVE 4TB" },
                        displayPrice: "৳289.00",
                        title: "Samsung 990 EVO Plus 4TB PCIe Gen5 NVMe",
                        chips: ["14,500 MB/s Read", "4TB Capacity", "2400 TBW Lifespan", "5-Yr Warranty"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    },
                    {
                        id: "ssd-3",
                        category: "ssd",
                        dataName: "Crucial T705 2TB PCIe 5.0 Heatsink",
                        price: 189.00,
                        watts: 11,
                        gen: "gen5",
                        capacity: "2tb",
                        isSelected: false,
                        badge: { type: "warning", text: "MAX SPEED GEN5" },
                        displayPrice: "৳189.00",
                        title: "Crucial T705 2TB PCIe 5.0 with Premium Heatsink",
                        chips: ["14,500 MB/s Read", "Copper Heatsink", "Phison E26", "Micron 232-Layer"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    },
                    {
                        id: "ssd-4",
                        category: "ssd",
                        dataName: "WD_BLACK SN850X 2TB NVMe",
                        price: 139.00,
                        watts: 7,
                        gen: "gen4",
                        capacity: "2tb",
                        isSelected: false,
                        badge: { type: "primary", text: "GAMER FAVORITE" },
                        displayPrice: "৳139.00",
                        title: "WD_BLACK SN850X 2TB PCIe Gen4 NVMe M.2",
                        chips: ["7,300 MB/s Read", "Game Mode 2.0", "Low Latency", "2TB Capacity"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    },
                    {
                        id: "ssd-5",
                        category: "ssd",
                        dataName: "Samsung 990 PRO 2TB with Heatsink",
                        price: 159.00,
                        watts: 8,
                        gen: "gen4",
                        capacity: "2tb",
                        isSelected: false,
                        badge: { type: "success", text: "PRO HEATSINK" },
                        displayPrice: "৳159.00",
                        title: "Samsung 990 PRO 2TB PCIe Gen4 with Heatsink",
                        chips: ["7,450 MB/s Read", "Integrated Heatsink", "Pascal Controller", "PS5 Compatible"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    },
                    {
                        id: "ssd-6",
                        category: "ssd",
                        dataName: "Kingston KC3000 2TB NVMe",
                        price: 129.00,
                        watts: 7,
                        gen: "gen4",
                        capacity: "2tb",
                        isSelected: false,
                        badge: { type: "warning", text: "VALUE GEN4" },
                        displayPrice: "৳129.00",
                        title: "Kingston KC3000 2TB PCIe Gen4 NVMe M.2",
                        chips: ["7,000 MB/s Read", "Graphene Spreader", "1600 TBW", "2TB Storage"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    },
                    {
                        id: "ssd-7",
                        category: "ssd",
                        dataName: "Crucial P3 Plus 1TB NVMe",
                        price: 64.00,
                        watts: 5,
                        gen: "gen4",
                        capacity: "1tb",
                        isSelected: false,
                        badge: { type: "primary", text: "BUDGET 1TB" },
                        displayPrice: "৳64.00",
                        title: "Crucial P3 Plus 1TB PCIe Gen4 NVMe M.2",
                        chips: ["5,000 MB/s Read", "1TB Capacity", "Affordable OS Drive", "Gen4 Speed"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    },
                    {
                        id: "ssd-8",
                        category: "ssd",
                        dataName: "Seagate FireCuda 530 4TB NVMe",
                        price: 329.00,
                        watts: 9,
                        gen: "gen4",
                        capacity: "4tb",
                        isSelected: false,
                        badge: { type: "accent", text: "ENDURANCE 4TB" },
                        displayPrice: "৳329.00",
                        title: "Seagate FireCuda 530 4TB PCIe Gen4 NVMe",
                        chips: ["7,300 MB/s Read", "5100 TBW Extreme", "Rescue Recovery", "4TB Workstation"],
                        compatibility: { isMatch: true, text: "✓ M.2 Slot Compatible" },
                        button: { text: "Select SSD", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 7: POWER SUPPLY (PSU)
            // ==========================================
            {
                id: "stage-psu",
                stepNumber: 7,
                title: "Power Supply (PSU)",
                hint: "ATX 3.1 • 80-Plus Gold & Platinum • 12V-2x6 Cable",
                availableCount: "8 PSUs available",
                status: { id: "status-psu", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search PSUs (e.g. 850W, 1000W, RM850x, Seasonic)...",
                    pills: [
                        { group: "wattage", value: "all", label: "All Wattages", isActive: true },
                        { group: "wattage", value: "1000w", label: "1000W+", isActive: false },
                        { group: "wattage", value: "850w", label: "850W", isActive: false },
                        { group: "wattage", value: "750w", label: "750W", isActive: false },
                        { group: "wattage", value: "650w", label: "650W", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "psu-1",
                        category: "psu",
                        dataName: "Corsair RM850x 850W Gold ATX 3.1",
                        price: 139.00,
                        capacity: 850,
                        wattage: "850w",
                        isSelected: true,
                        badge: { type: "success", text: "850 WATTS" },
                        displayPrice: "৳139.00",
                        title: "Corsair RM850x 850W 80+ Gold Modular ATX 3.1",
                        chips: ["850W Output", "80+ Gold", "12V-2x6 GPU Cable", "Zero RPM Fan"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "psu-2",
                        category: "psu",
                        dataName: "ASUS ROG Thor 1000W Platinum II",
                        price: 329.00,
                        capacity: 1000,
                        wattage: "1000w",
                        isSelected: false,
                        badge: { type: "accent", text: "1000W PLATINUM" },
                        displayPrice: "৳329.00",
                        title: "ASUS ROG Thor 1000W Platinum II Modular PSU",
                        chips: ["1000W Output", "80+ Platinum", "OLED Power Display", "10-Yr Warranty"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    },
                    {
                        id: "psu-3",
                        category: "psu",
                        dataName: "Seasonic Vertex GX-1000 ATX 3.1",
                        price: 189.00,
                        capacity: 1000,
                        wattage: "1000w",
                        isSelected: false,
                        badge: { type: "primary", text: "TIER-1 SEASONIC" },
                        displayPrice: "৳189.00",
                        title: "Seasonic Vertex GX-1000 1000W 80+ Gold ATX 3.1",
                        chips: ["1000W Gold", "Native PCIe 5.1", "135mm FDB Fan", "12-Yr Warranty"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    },
                    {
                        id: "psu-4",
                        category: "psu",
                        dataName: "be quiet! Straight Power 12 850W",
                        price: 159.00,
                        capacity: 850,
                        wattage: "850w",
                        isSelected: false,
                        badge: { type: "success", text: "SILENT PLATINUM" },
                        displayPrice: "৳159.00",
                        title: "be quiet! Straight Power 12 850W Platinum ATX 3.1",
                        chips: ["850W Output", "80+ Platinum 94%", "Silent Wings 135mm", "Single-Rail 12V"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    },
                    {
                        id: "psu-5",
                        category: "psu",
                        dataName: "Corsair RM1000x 1000W Gold",
                        price: 179.00,
                        capacity: 1000,
                        wattage: "1000w",
                        isSelected: false,
                        badge: { type: "accent", text: "HIGH CAPACITY" },
                        displayPrice: "৳179.00",
                        title: "Corsair RM1000x 1000W 80+ Gold Modular ATX 3.1",
                        chips: ["1000W Gold", "105°C Japanese Caps", "Magnetic Levitation", "10-Yr Warranty"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    },
                    {
                        id: "psu-6",
                        category: "psu",
                        dataName: "MSI MAG A750GL 750W Gold",
                        price: 99.00,
                        capacity: 750,
                        wattage: "750w",
                        isSelected: false,
                        badge: { type: "warning", text: "COMPACT 140MM" },
                        displayPrice: "৳99.00",
                        title: "MSI MAG A750GL 750W 80+ Gold Modular ATX 3.0",
                        chips: ["750W Output", "80+ Gold", "Dual-Color 16-Pin", "Compact Depth"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    },
                    {
                        id: "psu-7",
                        category: "psu",
                        dataName: "Corsair RM750e 750W Gold",
                        price: 89.00,
                        capacity: 750,
                        wattage: "750w",
                        isSelected: false,
                        badge: { type: "primary", text: "BUDGET GOLD" },
                        displayPrice: "৳89.00",
                        title: "Corsair RM750e 750W 80+ Gold Modular ATX 3.0",
                        chips: ["750W Output", "80+ Gold Rated", "Low Noise Level", "7-Yr Warranty"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    },
                    {
                        id: "psu-8",
                        category: "psu",
                        dataName: "Seasonic Focus GX-650 650W",
                        price: 85.00,
                        capacity: 650,
                        wattage: "650w",
                        isSelected: false,
                        badge: { type: "success", text: "650W VALUE" },
                        displayPrice: "৳85.00",
                        title: "Seasonic Focus GX-650 650W 80+ Gold Modular",
                        chips: ["650W Gold", "Fluid Dynamic Bearing", "Cable-Free Design", "10-Yr Warranty"],
                        compatibility: { isMatch: true, text: "✓ Exceeds 415W System Load" },
                        button: { text: "Select PSU", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 8: PC CASE (CHASSIS)
            // ==========================================
            {
                id: "stage-case",
                stepNumber: 8,
                title: "PC Case (Chassis)",
                hint: "Dual-Chamber Panoramic • High Airflow Mid-Tower",
                availableCount: "8 cases available",
                status: { id: "status-case", text: "Selected ✓", isSelected: true },
                filters: {
                    searchPlaceholder: "Search cases (e.g. H9 Flow, Fractal North, O11 Vision, 4000D)...",
                    pills: [
                        { group: "style", value: "all", label: "All Styles", isActive: true },
                        { group: "style", value: "dual", label: "Panoramic Dual-Chamber", isActive: false },
                        { group: "style", value: "airflow", label: "High-Airflow Mesh", isActive: false },
                        { group: "style", value: "itx", label: "Mini-ITX SFF", isActive: false }
                    ]
                },
                components: [
                    {
                        id: "case-1",
                        category: "case",
                        dataName: "NZXT H9 Flow Panoramic Glass",
                        price: 159.00,
                        gpuClearance: 435,
                        style: "dual",
                        isSelected: true,
                        badge: { type: "success", text: "DUAL CHAMBER" },
                        displayPrice: "৳159.00",
                        title: "NZXT H9 Flow Dual-Chamber Panoramic Glass ATX Case",
                        chips: ["ATX Support", "Up to 360mm Rad", "435mm GPU Clearance", "Mesh Top Panel"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Selected ✓", type: "primary" }
                    },
                    {
                        id: "case-2",
                        category: "case",
                        dataName: "Fractal Design North Charcoal Mesh",
                        price: 139.00,
                        gpuClearance: 355,
                        style: "airflow",
                        isSelected: false,
                        badge: { type: "accent", text: "REAL WALNUT WOOD" },
                        displayPrice: "৳139.00",
                        title: "Fractal Design North Charcoal Black Mesh ATX Case",
                        chips: ["Real Walnut Front", "355mm GPU Space", "Dual Aspect 140mm", "Fine Mesh Side"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Select Case", type: "outline" }
                    },
                    {
                        id: "case-3",
                        category: "case",
                        dataName: "Lian Li O11 Vision Chrome",
                        price: 139.00,
                        gpuClearance: 455,
                        style: "dual",
                        isSelected: false,
                        badge: { type: "primary", text: "TRIPLE GLASS" },
                        displayPrice: "৳139.00",
                        title: "Lian Li O11 Vision Chrome Seamless Glass ATX Case",
                        chips: ["Seamless 3-Sided Glass", "455mm GPU Space", "Dual 360mm Rads", "Mirror Finish"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Select Case", type: "outline" }
                    },
                    {
                        id: "case-4",
                        category: "case",
                        dataName: "Corsair 4000D Airflow High-Airflow",
                        price: 89.00,
                        gpuClearance: 360,
                        style: "airflow",
                        isSelected: false,
                        badge: { type: "success", text: "AIRFLOW CLASSIC" },
                        displayPrice: "৳89.00",
                        title: "Corsair 4000D Airflow High-Airflow Mid-Tower ATX",
                        chips: ["RapidRoute Cables", "360mm Rad Space", "Dual AirGuide Fans", "Steel Front Panel"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Select Case", type: "outline" }
                    },
                    {
                        id: "case-5",
                        category: "case",
                        dataName: "Hyte Y70 Touch Infinite Panoramic",
                        price: 379.00,
                        gpuClearance: 422,
                        style: "dual",
                        isSelected: false,
                        badge: { type: "accent", text: "4K TOUCHSCREEN" },
                        displayPrice: "৳379.00",
                        title: "Hyte Y70 Touch Infinite Panoramic ATX Chassis",
                        chips: ["14.5\" 4K 60Hz Display", "PCIe 4.0 Luxury Riser", "422mm GPU Space", "Cold Floor Cooling"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Select Case", type: "outline" }
                    },
                    {
                        id: "case-6",
                        category: "case",
                        dataName: "Lian Li LANCOOL 216 RGB",
                        price: 99.00,
                        gpuClearance: 392,
                        style: "airflow",
                        isSelected: false,
                        badge: { type: "warning", text: "DUAL 160MM FANS" },
                        displayPrice: "৳99.00",
                        title: "Lian Li LANCOOL 216 RGB High-Airflow Mid-Tower",
                        chips: ["Dual 160mm ARGB Fans", "392mm GPU Space", "Continuous Mesh", "Rear PCIe Fan Bracket"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Select Case", type: "outline" }
                    },
                    {
                        id: "case-7",
                        category: "case",
                        dataName: "Fractal Design Terra Jade SFF",
                        price: 179.00,
                        gpuClearance: 322,
                        style: "itx",
                        isSelected: false,
                        badge: { type: "primary", text: "PREMIUM SFF" },
                        displayPrice: "৳179.00",
                        title: "Fractal Design Terra Jade Anodized Mini-ITX Case",
                        chips: ["10.4L SFF Volume", "Real Walnut Accent", "PCIe 4.0 Riser Cable", "Micro-Footprint"],
                        compatibility: { isMatch: false, text: "Mini-ITX Only" },
                        button: { text: "Select Case", type: "outline" }
                    },
                    {
                        id: "case-8",
                        category: "case",
                        dataName: "NZXT H5 Flow Compact ATX",
                        price: 84.00,
                        gpuClearance: 365,
                        style: "airflow",
                        isSelected: false,
                        badge: { type: "success", text: "COMPACT VALUE" },
                        displayPrice: "৳84.00",
                        title: "NZXT H5 Flow Compact High-Airflow ATX Case",
                        chips: ["Dedicated GPU Air Duct", "365mm GPU Space", "Perforated Panels", "Ultra-Clean Cables"],
                        compatibility: { isMatch: true, text: "✓ Fits ATX Motherboard" },
                        button: { text: "Select Case", type: "outline" }
                    }
                ]
            },

            // ==========================================
            // STAGE 9: CASE FANS & CUSTOM EXTRAS
            // ==========================================
            {
                id: "stage-extras",
                stepNumber: 9,
                title: "Case Fans & Custom Accessories (Optional)",
                hint: "RGB Fan Kits • Custom Sleeved Cables • Acoustic Mats",
                availableCount: "6 items available",
                status: { id: "status-extras", text: "Optional", isSelected: false },
                filters: null, // No search/pills present in Stage 9 HTML
                components: [
                    {
                        id: "extra-1",
                        category: "extras",
                        dataName: "Lian Li UNI FAN TL LCD 120 (3-Pack)",
                        price: 139.00,
                        watts: 10,
                        isSelected: false,
                        badge: { type: "accent", text: "LCD SCREEN FANS" },
                        displayPrice: "৳139.00",
                        title: "Lian Li UNI FAN TL LCD 120 Wireless 3-Pack",
                        chips: ["1.6\" IPS LCD Display", "Wireless Chain Link", "L-Connect 3 Control"],
                        compatibility: null,
                        button: { text: "Add Fans", type: "outline" }
                    },
                    {
                        id: "extra-2",
                        category: "extras",
                        dataName: "Corsair iCUE LINK QX120 RGB (3-Pack)",
                        price: 119.00,
                        watts: 10,
                        isSelected: false,
                        badge: { type: "success", text: "SINGLE CABLE LINK" },
                        displayPrice: "৳119.00",
                        title: "Corsair iCUE LINK QX120 RGB 3-Pack with Hub",
                        chips: ["34 RGB LEDs Per Fan", "Magnetic Dome Bearing", "iCUE Link Hub"],
                        compatibility: null,
                        button: { text: "Add Fans", type: "outline" }
                    },
                    {
                        id: "extra-3",
                        category: "extras",
                        dataName: "Noctua NF-A12x25 chromax (120mm)",
                        price: 34.00,
                        watts: 2,
                        isSelected: false,
                        badge: { type: "primary", text: "REFERENCE FAN" },
                        displayPrice: "৳34.00",
                        title: "Noctua NF-A12x25 PWM chromax.black 120mm Fan",
                        chips: ["Sterrox® LCP Material", "0.5mm Tip Clearance", "Ultra-Quiet 2000 RPM"],
                        compatibility: null,
                        button: { text: "Add Fan", type: "outline" }
                    },
                    {
                        id: "extra-4",
                        category: "extras",
                        dataName: "Arctic P12 Max 120mm (5-Pack)",
                        price: 39.00,
                        watts: 6,
                        isSelected: false,
                        badge: { type: "warning", text: "BEST VALUE PACK" },
                        displayPrice: "৳39.00",
                        title: "Arctic P12 Max High-Pressure 120mm 5-Pack",
                        chips: ["3300 RPM High Static", "0dB Zero RPM Mode", "Dual Ball Bearing"],
                        compatibility: null,
                        button: { text: "Add Fans", type: "outline" }
                    },
                    {
                        id: "extra-5",
                        category: "extras",
                        dataName: "Custom Sleeved 12V-2x6 & 24-Pin Cables",
                        price: 49.00,
                        watts: 0,
                        isSelected: false,
                        badge: { type: "accent", text: "PRO CABLING" },
                        displayPrice: "৳49.00",
                        title: "Custom GX16 Aviator Sleeved Cable Extension Kit",
                        chips: ["16AWG High Current", "Braided Paracord", "Stealth Cable Combs"],
                        compatibility: null,
                        button: { text: "Add Cables", type: "outline" }
                    },
                    {
                        id: "extra-6",
                        category: "extras",
                        dataName: "Merino Wool XXL Acoustic Desk Mat",
                        price: 45.00,
                        watts: 0,
                        isSelected: false,
                        badge: { type: "primary", text: "DESK ERGONOMICS" },
                        displayPrice: "৳45.00",
                        title: "Natural Merino Wool XXL Acoustic Desk Mat",
                        chips: ["900 x 400mm Surface", "Vibration Damping", "Anti-Slip Cork Base"],
                        compatibility: null,
                        button: { text: "Add Mat", type: "outline" }
                    }
                ]
            }
        ];

export const PURPOSES = [
    { id: 'gaming', icon: '🎮', name: 'Gaming & Esports', desc: 'High FPS & Low Latency' },
    { id: 'creation', icon: '🎨', name: '3D & 4K Creation', desc: 'Blender, Premiere & CAD' },
    { id: 'streaming', icon: '📡', name: 'Streaming & Broadcast', desc: 'Dual AV1 Encoding' },
    { id: 'coding', icon: '💻', name: 'Software & Compiling', desc: 'Multi-Threaded Workloads' },
    { id: 'ai', icon: '🤖', name: 'AI & Machine Learning', desc: 'High VRAM & Tensor Compute' },
    { id: 'productivity', icon: '🏢', name: 'Office & Productivity', desc: 'Silent & Multi-Display' }
];

export const BUDGET_TIERS = [
    { id: 'under600', label: 'Under 00', desc: 'Entry Esports', min: 0, max: 600 },
    { id: '600-900', label: '00 – 00', desc: '1080p Ultra', min: 600, max: 900 },
    { id: '900-1200', label: '00 – ,200', desc: '1440p Sweet Spot', min: 900, max: 1200 },
    { id: '1200-1500', label: ',200 – ,500', desc: 'High FPS 1440p', min: 1200, max: 1500 },
    { id: '1500-2000', label: ',500 – ,000', desc: '4K Enthusiast', min: 1500, max: 2000 },
    { id: '2000plus', label: ',000+', desc: 'Ultimate Flagship', min: 2000, max: 99999 }
];

export const RECOMMENDED_BUILDS = [
    {
        id: 'rec-esports',
        badge: 'ESPORTS SWEET SPOT',
        title: '1080p Ultra Esports Rig',
        specs: 'Ryzen 5 7600X • RX 4060 8GB • 32GB DDR5 • 1TB NVMe • 650W PSU',
        price: 699.00,
        featured: false,
        parts: {
            'stage-cpu': 'cpu-5',
            'stage-mobo': 'mobo-4',
            'stage-cooler': 'cooler-6',
            'stage-ram': 'ram-9',
            'stage-gpu': 'gpu-9',
            'stage-ssd': 'ssd-7',
            'stage-psu': 'psu-8',
            'stage-case': 'case-8'
        }
    },
    {
        id: 'rec-1440p',
        badge: 'MOST POPULAR',
        title: '1440p High FPS Gaming Rig',
        specs: 'Ryzen 7 7800X3D • RTX 5070 12GB • 32GB DDR5 • 2TB Gen4 • 850W PSU',
        price: 1663.00,
        featured: true,
        parts: {
            'stage-cpu': 'cpu-1',
            'stage-mobo': 'mobo-1',
            'stage-cooler': 'cooler-3',
            'stage-ram': 'ram-3',
            'stage-gpu': 'gpu-1',
            'stage-ssd': 'ssd-4',
            'stage-psu': 'psu-1',
            'stage-case': 'case-4'
        }
    },
    {
        id: 'rec-4k',
        badge: '4K ENTHUSIAST',
        title: '4K Ultimate Battlestation',
        specs: 'Ryzen 9 9950X • RTX 5080 16GB • 64GB DDR5 • 2TB PRO • 1000W Platinum',
        price: 2683.00,
        featured: false,
        parts: {
            'stage-cpu': 'cpu-2',
            'stage-mobo': 'mobo-2',
            'stage-cooler': 'cooler-1',
            'stage-ram': 'ram-6',
            'stage-gpu': 'gpu-3',
            'stage-ssd': 'ssd-5',
            'stage-psu': 'psu-5',
            'stage-case': 'case-1'
        }
    },
    {
        id: 'rec-creator',
        badge: '3D & CAD WORKSTATION',
        title: 'Creator Studio Pro Rig',
        specs: 'Ryzen 9 9950X • RTX 5080 16GB • 64GB DDR5 7200 • 2TB Gen5 • 1000W Gold',
        price: 2842.00,
        featured: false,
        parts: {
            'stage-cpu': 'cpu-2',
            'stage-mobo': 'mobo-5',
            'stage-cooler': 'cooler-2',
            'stage-ram': 'ram-2',
            'stage-gpu': 'gpu-3',
            'stage-ssd': 'ssd-3',
            'stage-psu': 'psu-3',
            'stage-case': 'case-2'
        }
    }
];

export const FAQS = [
    {
        q: 'How does LUMEN guarantee 100% hardware compatibility?',
        a: 'Our compatibility engine cross-references physical CPU sockets (e.g. AM5, LGA1851, LGA1700), memory generations (DDR5 vs DDR4), PSU transient headroom, PCIe lane bifurcation, and physical chassis clearances for GPU lengths and radiator thicknesses.'
    },
    {
        q: 'Can LUMEN assemble and test the PC for me before shipping?',
        a: 'Yes! When checking out with a complete build, you can select our optional "White-Glove Assembly & Stress Test" service (9), which includes cable management, latest BIOS flashing, memory EXPO profile validation, and a 24-hour thermal burn-in.'
    },
    {
        q: 'Can I save my build and finish selecting parts later?',
        a: 'Absolutely. Clicking "Save Build Configuration" stores your selected parts in your browser for instant retrieval on any visit.'
    },
    {
        q: 'What warranty coverage comes with custom PC components?',
        a: 'Every individual part includes full official manufacturer warranty coverage (typically 3 years for CPUs & GPUs, 5 years for SSDs, and 10 years for PSUs). Additionally, LUMEN provides a 30-day hassle-free return and replacement policy.'
    }
];
