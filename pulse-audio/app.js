/* PULSE — interactions, audio engine and screen routing */
(() => {
  "use strict";

  const template = document.getElementById("app-template");
  const stage = document.getElementById("stage");
  const slots = Array.from(document.querySelectorAll(".device-slot"));
  const STORAGE_KEY = "pulse-audio-state-v2";
  const LEGACY_STORAGE_KEY = "pulse-audio-state-v1";

  const PRESETS = {
    bass: {
      name: "Bass",
      note: "Deep, powerful low end",
      gains: { low: 6.5, mid: -1.2, high: -1.8 },
      bands: [7, 5, 3, 1, -1, -1, 0, 0, 1, 1]
    },
    default: {
      name: "Default",
      note: "Balanced, natural sound",
      gains: { low: 0, mid: 0, high: 0 },
      bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    },
    classic: {
      name: "Classic",
      note: "Warm and detailed",
      gains: { low: 1.8, mid: 1.2, high: 1.2 },
      bands: [2, 2, 1, 0, 0, 0, 1, 2, 2, 1]
    },
    pop: {
      name: "Pop",
      note: "Bright, vocal-forward clarity",
      gains: { low: 0.8, mid: 3.2, high: 1.2 },
      bands: [-1, 0, 2, 4, 3, 1, 1, 2, 2, 1]
    },
    soft: {
      name: "Soft",
      note: "Gentle, relaxed tuning",
      gains: { low: -2.4, mid: -1.2, high: -3.2 },
      bands: [-3, -2, -1, -1, 0, -1, -1, -2, -3, -3]
    },
    custom: {
      name: "Custom",
      note: "Your saved signature",
      gains: { low: 0, mid: 0, high: 0 },
      bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }
  };

  const GESTURES = [
    {
      value: "Playback/Pause",
      title: "Playback / Pause",
      description: "Pause or resume your audio",
      icon: "i-play"
    },
    {
      value: "Next Track",
      title: "Next track",
      description: "Skip forward in the queue",
      icon: "i-skip"
    },
    {
      value: "Previous Track",
      title: "Previous track",
      description: "Jump back to the previous track",
      icon: "i-skip"
    },
    {
      value: "Voice Assistant",
      title: "Voice assistant",
      description: "Wake Siri or Google Assistant",
      icon: "i-mic"
    }
  ];

  const CONTROL_META = {
    touch: {
      label: "Touch controls",
      double: "Double touch",
      triple: "Triple touch",
      area: "right earbud"
    },
    press: {
      label: "Press controls",
      double: "Double press",
      triple: "Triple press",
      area: "right stem"
    },
    pinch: {
      label: "Pinch controls",
      double: "Double pinch",
      triple: "Triple pinch",
      area: "right stem"
    },
    button: {
      label: "Button controls",
      double: "Double press",
      triple: "Triple press",
      area: "right earcup"
    }
  };

  const CAPABILITY_META = {
    anc: { label: "Active noise cancelling", short: "ANC", icon: "i-anc" },
    transparency: { label: "Transparency mode", short: "Transparency", icon: "i-transparency" },
    adaptive: { label: "Adaptive EQ", short: "Adaptive EQ", icon: "i-shield" },
    spatial: { label: "Spatial audio", short: "Spatial", icon: "i-sparkles" },
    autopause: { label: "Auto pause", short: "Auto pause", icon: "i-headphones" },
    sleeping: { label: "Sleeping mode", short: "Sleep mode", icon: "i-moon" },
    gaming: { label: "Gaming mode", short: "Low latency", icon: "i-gamepad" },
    multipoint: { label: "Multipoint connection", short: "Multipoint", icon: "i-bluetooth" },
    wirelessCharging: { label: "Wireless charging", short: "Wireless charge", icon: "i-battery-pill" },
    wearDetection: { label: "Wear detection", short: "Wear detection", icon: "i-touch" },
    firmware: { label: "Firmware updates", short: "Firmware", icon: "i-download" },
    find: { label: "Find my device", short: "Find", icon: "i-find" },
    eq: { label: "Custom equaliser", short: "Custom EQ", icon: "i-eq" }
  };

  const DEVICE_CATALOG = [
    {
      id: "pulse-explore",
      brand: "PULSE",
      model: "Explore Pro",
      name: "PULSE Explore Pro",
      formFactor: "earbuds",
      image: "assets/devices/pulse-explore.webp",
      color: "Matte Black",
      blurb: "Flagship adaptive earbuds with 48 dB hybrid ANC.",
      connectedByDefault: true,
      battery: { left: 91, right: 73, case: 68 },
      lastBattery: 91,
      batteryText: "7h 20m left",
      firmware: "v4.0.0",
      firmwareTarget: "v4.1.0",
      controlStyle: "touch",
      managedSoftware: "PULSE Audio",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "airpods-pro",
      brand: "Apple",
      model: "AirPods Pro (2nd gen)",
      name: "AirPods Pro",
      formFactor: "earbuds",
      image: "assets/devices/airpods-pro.webp",
      color: "White",
      blurb: "AirPods Pro with adaptive audio and personalised spatial sound.",
      connectedByDefault: true,
      battery: { left: 84, right: 88, case: 72 },
      lastBattery: 84,
      batteryText: "5h 40m left",
      firmware: "1.4.0",
      controlStyle: "press",
      managedSoftware: "iOS Settings",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "airpods-pro-3",
      brand: "Apple",
      model: "AirPods Pro 3",
      name: "AirPods Pro 3",
      formFactor: "earbuds",
      image: "assets/devices/airpods-pro3.webp",
      color: "White",
      blurb: "AirPods Pro 3 with the world’s best in-ear ANC and heart-rate sensing.",
      connectedByDefault: false,
      battery: { left: 88, right: 90, case: 76 },
      lastBattery: 88,
      batteryText: "8h left",
      firmware: "1.0.0",
      controlStyle: "press",
      managedSoftware: "iOS Settings",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "airpods-max-2",
      brand: "Apple",
      model: "AirPods Max 2",
      name: "AirPods Max 2",
      formFactor: "headphones",
      image: "assets/devices/airpods-max2.webp",
      color: "Purple",
      blurb: "AirPods Max 2 with remastered listening and 1.5x more ANC.",
      connectedByDefault: false,
      battery: { single: 82 },
      lastBattery: 82,
      batteryText: "20h left",
      firmware: "1.0.0",
      controlStyle: "button",
      managedSoftware: "iOS Settings",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: false, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "galaxy-buds3-pro",
      brand: "Samsung",
      model: "Galaxy Buds3 Pro",
      name: "Galaxy Buds3 Pro",
      formFactor: "earbuds",
      image: "assets/devices/galaxy-buds3-pro.webp",
      color: "Silver",
      blurb: "Samsung's hi-fi earbuds with adaptive ANC and blade lights.",
      connectedByDefault: true,
      battery: { left: 78, right: 80, case: 64 },
      lastBattery: 78,
      batteryText: "6h 10m left",
      firmware: "R630XXU0AXJ1",
      controlStyle: "pinch",
      managedSoftware: "Galaxy Wearable",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "sony-wh1000xm5",
      brand: "Sony",
      model: "WH-1000XM5",
      name: "WH-1000XM5",
      formFactor: "headphones",
      image: "assets/devices/sony-wh1000xm5.webp",
      color: "Black",
      blurb: "Sony's flagship over-ear headphones with industry-leading ANC.",
      connectedByDefault: true,
      battery: { single: 86 },
      lastBattery: 86,
      batteryText: "30h left",
      firmware: "2.1.0",
      controlStyle: "touch",
      managedSoftware: "Sony Headphones Connect",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "anker-liberty4nc",
      brand: "Anker",
      model: "Soundcore Liberty 4 NC",
      name: "Soundcore Liberty 4 NC",
      formFactor: "earbuds",
      image: "assets/devices/anker-liberty4nc.webp",
      color: "Black",
      blurb: "Soundcore's noise-cancelling earbuds with LDAC and spatial audio.",
      connectedByDefault: false,
      battery: { left: 92, right: 90, case: 80 },
      lastBattery: 92,
      batteryText: "9h 10m left",
      firmware: "v1.8.0",
      firmwareTarget: "v1.9.0",
      controlStyle: "touch",
      managedSoftware: "Soundcore app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "jbl-tune770nc",
      brand: "JBL",
      model: "Tune 770NC",
      name: "JBL Tune 770NC",
      formFactor: "headphones",
      image: "assets/devices/jbl-tune770nc.webp",
      color: "Black",
      blurb: "JBL over-ear headphones with adaptive ANC and 70-hour playtime.",
      connectedByDefault: false,
      battery: { single: 70 },
      lastBattery: 70,
      batteryText: "44h left",
      firmware: "v2.3.0",
      firmwareTarget: "v2.4.0",
      controlStyle: "button",
      managedSoftware: "JBL Headphones app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: false, firmware: true, find: true, eq: true
      }
    },
    {
      id: "bose-qc-ultra",
      brand: "Bose",
      model: "QuietComfort Ultra",
      name: "QuietComfort Ultra",
      formFactor: "headphones",
      image: "assets/devices/bose-qc-ultra.webp",
      color: "Sandstone",
      blurb: "Bose's immersive over-ear headphones with CustomTune sound.",
      connectedByDefault: false,
      battery: { single: 65 },
      lastBattery: 65,
      batteryText: "18h left",
      firmware: "1.7.0",
      firmwareTarget: "v1.8.0",
      controlStyle: "button",
      managedSoftware: "Bose app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "sennheiser-momentum4",
      brand: "Sennheiser",
      model: "Momentum 4 Wireless",
      name: "Momentum 4 Wireless",
      formFactor: "headphones",
      image: "assets/devices/sennheiser-momentum4.webp",
      color: "Denim",
      blurb: "Sennheiser's audiophile over-ear headphones with 60-hour battery.",
      connectedByDefault: false,
      battery: { single: 60 },
      lastBattery: 60,
      batteryText: "36h left",
      firmware: "v3.2.0",
      firmwareTarget: "v3.3.0",
      controlStyle: "touch",
      managedSoftware: "Smart Control",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "nothing-ear-a",
      brand: "Nothing",
      model: "Ear (a)",
      name: "Nothing Ear (a)",
      formFactor: "earbuds",
      image: "assets/devices/nothing-ear-a.webp",
      color: "White",
      blurb: "Nothing's transparent earbuds with 45 dB ANC and Bass Enhance.",
      connectedByDefault: false,
      battery: { left: 55, right: 57, case: 49 },
      lastBattery: 55,
      batteryText: "4h 20m left",
      firmware: "v1.0.2",
      firmwareTarget: "v1.1.0",
      controlStyle: "pinch",
      managedSoftware: "Nothing X",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "google-pixel-buds-pro2",
      brand: "Google",
      model: "Pixel Buds Pro 2",
      name: "Pixel Buds Pro 2",
      formFactor: "earbuds",
      image: "assets/devices/google-pixel-buds-pro2.webp",
      color: "Porcelain",
      blurb: "Google's Tensor-powered earbuds with Silent Seal 2.0 ANC.",
      connectedByDefault: false,
      battery: { left: 74, right: 76, case: 70 },
      lastBattery: 74,
      batteryText: "7h 10m left",
      firmware: "v3.1",
      firmwareTarget: "v3.2",
      controlStyle: "touch",
      managedSoftware: "Pixel Buds app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "hoco-ew75",
      brand: "HOCO",
      model: "EW75",
      name: "HOCO EW75",
      formFactor: "earbuds",
      image: "assets/devices/hoco-ew75.webp",
      color: "White",
      blurb: "Everyday true-wireless earbuds with a compact charging case.",
      connectedByDefault: false,
      battery: { left: 48, right: 52, case: 40 },
      lastBattery: 48,
      batteryText: "3h 05m left",
      firmware: "v1.0.0",
      controlStyle: "touch",
      managedSoftware: "HOCO assistant",
      capabilities: {
        anc: false, transparency: false, adaptive: false, spatial: false, autopause: true,
        sleeping: true, gaming: true, multipoint: false, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "baseus-bowie-ma10",
      brand: "Baseus",
      model: "Bowie MA10",
      name: "Baseus Bowie MA10",
      formFactor: "earbuds",
      image: "assets/devices/baseus-bowie-ma10.webp",
      color: "Black",
      blurb: "Baseus earbuds with 48 dB ANC and a pocketable charging case.",
      connectedByDefault: false,
      battery: { left: 63, right: 66, case: 58 },
      lastBattery: 63,
      batteryText: "5h 25m left",
      firmware: "v1.0.0",
      controlStyle: "touch",
      managedSoftware: "Baseus app",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    /* ——————————————————————— Apple ——————————————————————— */
    {
      id: "airpods-4",
      brand: "Apple",
      model: "AirPods 4",
      name: "AirPods 4",
      formFactor: "earbuds",
      image: "assets/devices/airpods-4.webp",
      color: "White",
      blurb: "All-new AirPods 4 with improved fit and H2 chip audio.",
      connectedByDefault: false,
      battery: { left: 85, right: 86, case: 78 },
      lastBattery: 85,
      batteryText: "5h left",
      firmware: "1.0.0",
      controlStyle: "press",
      managedSoftware: "iOS Settings",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    /* ——————————————————————— Samsung ——————————————————————— */
    {
      id: "galaxy-buds3",
      brand: "Samsung",
      model: "Galaxy Buds3",
      name: "Galaxy Buds3",
      formFactor: "earbuds",
      image: "assets/devices/galaxy-buds3.webp",
      color: "Silver",
      blurb: "Samsung Galaxy Buds3 with adaptive ANC and blade lights.",
      connectedByDefault: false,
      battery: { left: 76, right: 78, case: 60 },
      lastBattery: 76,
      batteryText: "6h left",
      firmware: "R610XXU0A",
      controlStyle: "pinch",
      managedSoftware: "Galaxy Wearable",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "galaxy-buds2-pro",
      brand: "Samsung",
      model: "Galaxy Buds2 Pro",
      name: "Galaxy Buds2 Pro",
      formFactor: "earbuds",
      image: "assets/devices/galaxy-buds2-pro.webp",
      color: "Graphite",
      blurb: "Galaxy Buds2 Pro with 24-bit hi-fi sound and intelligent ANC.",
      connectedByDefault: false,
      battery: { left: 80, right: 82, case: 70 },
      lastBattery: 80,
      batteryText: "7h left",
      firmware: "R560XXU0",
      controlStyle: "touch",
      managedSoftware: "Galaxy Wearable",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "galaxy-buds-fe",
      brand: "Samsung",
      model: "Galaxy Buds FE",
      name: "Galaxy Buds FE",
      formFactor: "earbuds",
      image: "assets/devices/galaxy-buds-fe.webp",
      color: "White",
      blurb: "Galaxy Buds FE — essential Samsung sound in a comfortable fit.",
      connectedByDefault: false,
      battery: { left: 72, right: 70, case: 55 },
      lastBattery: 72,
      batteryText: "6h left",
      firmware: "R500",
      controlStyle: "touch",
      managedSoftware: "Galaxy Wearable",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    /* ——————————————————————— Sony ——————————————————————— */
    {
      id: "sony-wh1000xm4",
      brand: "Sony",
      model: "WH-1000XM4",
      name: "WH-1000XM4",
      formFactor: "headphones",
      image: "assets/devices/sony-wh1000xm4.webp",
      color: "Black",
      blurb: "Sony WH-1000XM4 industry-leading noise canceling headphones.",
      connectedByDefault: false,
      battery: { single: 88 },
      lastBattery: 88,
      batteryText: "30h left",
      firmware: "2.1.0",
      controlStyle: "touch",
      managedSoftware: "Sony Headphones Connect",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "sony-wf1000xm5",
      brand: "Sony",
      model: "WF-1000XM5",
      name: "WF-1000XM5",
      formFactor: "earbuds",
      image: "assets/devices/sony-wf1000xm5.webp",
      color: "Black",
      blurb: "Sony WF-1000XM5 with Integrated Processor V2 and industry-leading NC.",
      connectedByDefault: false,
      battery: { left: 84, right: 84, case: 72 },
      lastBattery: 84,
      batteryText: "8h left",
      firmware: "1.3.0",
      controlStyle: "touch",
      managedSoftware: "Sony Headphones Connect",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: false, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.4.0"
    },
    {
      id: "sony-wf1000xm4",
      brand: "Sony",
      model: "WF-1000XM4",
      name: "WF-1000XM4",
      formFactor: "earbuds",
      image: "assets/devices/sony-wf1000xm4.webp",
      color: "Black",
      blurb: "Sony WF-1000XM4 noise canceling earbuds with long battery life.",
      connectedByDefault: false,
      battery: { left: 80, right: 80, case: 68 },
      lastBattery: 80,
      batteryText: "8h left",
      firmware: "1.2.0",
      controlStyle: "touch",
      managedSoftware: "Sony Headphones Connect",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: false, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.3.0"
    },
    /* ——————————————————————— Anker / Soundcore ——————————————————————— */
    {
      id: "anker-liberty4-pro",
      brand: "Anker",
      model: "Soundcore Liberty 4 Pro",
      name: "Soundcore Liberty 4 Pro",
      formFactor: "earbuds",
      image: "assets/devices/anker-liberty4-pro.webp",
      color: "Black",
      blurb: "Soundcore Liberty 4 Pro with ANC 3.0 and ACAA 4.0 acoustic system.",
      connectedByDefault: false,
      battery: { left: 90, right: 90, case: 78 },
      lastBattery: 90,
      batteryText: "9h left",
      firmware: "v1.7.0",
      firmwareTarget: "v1.8.0",
      controlStyle: "touch",
      managedSoftware: "Soundcore app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "anker-life-p3",
      brand: "Anker",
      model: "Soundcore Life P3",
      name: "Soundcore Life P3",
      formFactor: "earbuds",
      image: "assets/devices/anker-life-p3.webp",
      color: "Black",
      blurb: "Soundcore Life P3 with customizable EQ and HearID sound.",
      connectedByDefault: false,
      battery: { left: 68, right: 68, case: 55 },
      lastBattery: 68,
      batteryText: "7h left",
      firmware: "v1.2.0",
      controlStyle: "touch",
      managedSoftware: "Soundcore app",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: false, gaming: true, multipoint: false, wirelessCharging: false,
        wearDetection: false, firmware: false, find: true, eq: true
      }
    },
    {
      id: "anker-space-q45",
      brand: "Anker",
      model: "Soundcore Space Q45",
      name: "Soundcore Space Q45",
      formFactor: "headphones",
      image: "assets/devices/anker-space-q45.webp",
      color: "Black",
      blurb: "Soundcore Space Q45 adaptive noise cancelling headphones.",
      connectedByDefault: false,
      battery: { single: 78 },
      lastBattery: 78,
      batteryText: "50h left",
      firmware: "v1.3.0",
      controlStyle: "button",
      managedSoftware: "Soundcore app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: false, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.4.0"
    },
    /* ——————————————————————— HOCO ——————————————————————— */
    {
      id: "hoco-ew52",
      brand: "HOCO",
      model: "EW52",
      name: "HOCO EW52",
      formFactor: "earbuds",
      image: "assets/devices/hoco-ew52.webp",
      color: "White",
      blurb: "HOCO EW52 everyday wireless earbuds with a compact case.",
      connectedByDefault: false,
      battery: { left: 45, right: 48, case: 38 },
      lastBattery: 45,
      batteryText: "3h left",
      firmware: "v1.0.0",
      controlStyle: "touch",
      managedSoftware: "HOCO assistant",
      capabilities: {
        anc: false, transparency: false, adaptive: false, spatial: false, autopause: true,
        sleeping: true, gaming: true, multipoint: false, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "hoco-hm1",
      brand: "HOCO",
      model: "HM1",
      name: "HOCO HM1",
      formFactor: "headphones",
      image: "assets/devices/hoco-hm1.webp",
      color: "Black",
      blurb: "HOCO HM1 foldable wireless headphones with mic.",
      connectedByDefault: false,
      battery: { single: 55 },
      lastBattery: 55,
      batteryText: "12h left",
      firmware: "v1.0.0",
      controlStyle: "button",
      managedSoftware: "HOCO assistant",
      capabilities: {
        anc: false, transparency: false, adaptive: false, spatial: false, autopause: false,
        sleeping: true, gaming: false, multipoint: false, wirelessCharging: false,
        wearDetection: false, firmware: false, find: false, eq: false
      }
    },
    /* ——————————————————————— Baseus ——————————————————————— */
    {
      id: "baseus-bowie-wm01",
      brand: "Baseus",
      model: "Bowie WM01",
      name: "Bowie WM01",
      formFactor: "earbuds",
      image: "assets/devices/baseus-bowie-wm01.webp",
      color: "Black",
      blurb: "Baseus Bowie WM01 semi-in-ear earbuds with ANC.",
      connectedByDefault: false,
      battery: { left: 68, right: 68, case: 60 },
      lastBattery: 68,
      batteryText: "5h left",
      firmware: "v1.0.0",
      controlStyle: "touch",
      managedSoftware: "Baseus app",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    {
      id: "baseus-bowie-ma18-pro",
      brand: "Baseus",
      model: "Bowie MA18 Pro",
      name: "Bowie MA18 Pro",
      formFactor: "earbuds",
      image: "assets/devices/baseus-bowie-ma18-pro.webp",
      color: "Black",
      blurb: "Baseus Bowie MA18 Pro with spatial audio and dual drivers.",
      connectedByDefault: false,
      battery: { left: 70, right: 70, case: 62 },
      lastBattery: 70,
      batteryText: "6h left",
      firmware: "v1.1.0",
      controlStyle: "touch",
      managedSoftware: "Baseus app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    /* ——————————————————————— JBL ——————————————————————— */
    {
      id: "jbl-tune-flex",
      brand: "JBL",
      model: "Tune Flex",
      name: "JBL Tune Flex",
      formFactor: "earbuds",
      image: "assets/devices/jbl-tune-flex.webp",
      color: "Black",
      blurb: "JBL Tune Flex noise cancelling earbuds with semi-in-ear design.",
      connectedByDefault: false,
      battery: { left: 65, right: 65, case: 55 },
      lastBattery: 65,
      batteryText: "6h left",
      firmware: "v2.1.0",
      controlStyle: "touch",
      managedSoftware: "JBL Headphones app",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: false, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v2.2.0"
    },
    {
      id: "jbl-tune-230nc-tws",
      brand: "JBL",
      model: "Tune 230NC TWS",
      name: "JBL Tune 230NC TWS",
      formFactor: "earbuds",
      image: "assets/devices/jbl-tune-230nc-tws.webp",
      color: "Black",
      blurb: "JBL Tune 230NC TWS with deep bass sound and active noise cancelling.",
      connectedByDefault: false,
      battery: { left: 60, right: 60, case: 50 },
      lastBattery: 60,
      batteryText: "5h left",
      firmware: "v1.0.0",
      controlStyle: "button",
      managedSoftware: "JBL Headphones app",
      capabilities: {
        anc: true, transparency: false, adaptive: false, spatial: false, autopause: false,
        sleeping: false, gaming: false, multipoint: false, wirelessCharging: false,
        wearDetection: false, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.1.0"
    },
    {
      id: "jbl-live-pro-2",
      brand: "JBL",
      model: "Live Pro 2",
      name: "JBL Live Pro 2",
      formFactor: "earbuds",
      image: "assets/devices/jbl-live-pro-2.webp",
      color: "Black",
      blurb: "JBL Live Pro 2 true adaptive noise cancelling earbuds.",
      connectedByDefault: false,
      battery: { left: 70, right: 70, case: 60 },
      lastBattery: 70,
      batteryText: "7h left",
      firmware: "v2.0.0",
      firmwareTarget: "v2.1.0",
      controlStyle: "touch",
      managedSoftware: "JBL Headphones app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: false, firmware: true, find: true, eq: true
      }
    },
    /* ——————————————————————— Bose ——————————————————————— */
    {
      id: "bose-qc45",
      brand: "Bose",
      model: "QuietComfort 45",
      name: "QuietComfort 45",
      formFactor: "headphones",
      image: "assets/devices/bose-qc45.webp",
      color: "Black",
      blurb: "Bose QuietComfort 45 with world-class noise cancellation.",
      connectedByDefault: false,
      battery: { single: 72 },
      lastBattery: 72,
      batteryText: "24h left",
      firmware: "1.7.0",
      firmwareTarget: "v1.8.0",
      controlStyle: "button",
      managedSoftware: "Bose app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "bose-qc-ultra-earbuds",
      brand: "Bose",
      model: "QuietComfort Ultra Earbuds",
      name: "QuietComfort Ultra Earbuds",
      formFactor: "earbuds",
      image: "assets/devices/bose-qc-ultra-earbuds.webp",
      color: "White Smoke",
      blurb: "Bose QuietComfort Ultra Earbuds with CustomTune and Immersive Audio.",
      connectedByDefault: false,
      battery: { left: 78, right: 78, case: 66 },
      lastBattery: 78,
      batteryText: "6h left",
      firmware: "1.5.0",
      controlStyle: "touch",
      managedSoftware: "Bose app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.6.0"
    },
    {
      id: "bose-sport-earbuds",
      brand: "Bose",
      model: "Sport Earbuds",
      name: "Sport Earbuds",
      formFactor: "earbuds",
      image: "assets/devices/bose-sport-earbuds.webp",
      color: "Black",
      blurb: "Bose Sport Earbuds engineered for workouts with secure fit.",
      connectedByDefault: false,
      battery: { left: 70, right: 70, case: 60 },
      lastBattery: 70,
      batteryText: "5h left",
      firmware: "1.0.0",
      controlStyle: "touch",
      managedSoftware: "Bose app",
      capabilities: {
        anc: false, transparency: false, adaptive: false, spatial: false, autopause: false,
        sleeping: false, gaming: false, multipoint: false, wirelessCharging: false,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    },
    /* ——————————————————————— Sennheiser ——————————————————————— */
    {
      id: "sennheiser-mtw3",
      brand: "Sennheiser",
      model: "Momentum True Wireless 3",
      name: "Momentum True Wireless 3",
      formFactor: "earbuds",
      image: "assets/devices/sennheiser-mtw3.webp",
      color: "Black",
      blurb: "Sennheiser Momentum True Wireless 3 audiophile earbuds.",
      connectedByDefault: false,
      battery: { left: 68, right: 68, case: 60 },
      lastBattery: 68,
      batteryText: "7h left",
      firmware: "v1.5.0",
      controlStyle: "touch",
      managedSoftware: "Smart Control",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.6.0"
    },
    {
      id: "sennheiser-accentum",
      brand: "Sennheiser",
      model: "ACCENTUM Wireless",
      name: "ACCENTUM Wireless",
      formFactor: "headphones",
      image: "assets/devices/sennheiser-accentum.webp",
      color: "Black",
      blurb: "Sennheiser ACCENTUM Wireless headphones with 50-hour battery.",
      connectedByDefault: false,
      battery: { single: 85 },
      lastBattery: 85,
      batteryText: "50h left",
      firmware: "v1.1.0",
      controlStyle: "touch",
      managedSoftware: "Smart Control",
      capabilities: {
        anc: true, transparency: true, adaptive: false, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: false, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.2.0"
    },
    /* ——————————————————————— Nothing ——————————————————————— */
    {
      id: "nothing-ear-2",
      brand: "Nothing",
      model: "Ear (2)",
      name: "Nothing Ear (2)",
      formFactor: "earbuds",
      image: "assets/devices/nothing-ear-2.webp",
      color: "White",
      blurb: "Nothing Ear (2) transparent earbuds with LHDC 5.0.",
      connectedByDefault: false,
      battery: { left: 70, right: 70, case: 60 },
      lastBattery: 70,
      batteryText: "6h left",
      firmware: "v1.1.0",
      controlStyle: "pinch",
      managedSoftware: "Nothing X",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: false, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: false,
        wearDetection: true, firmware: true, find: true, eq: true
      },
      firmwareTarget: "v1.2.0"
    },
    {
      id: "nothing-ear-stick",
      brand: "Nothing",
      model: "Ear Stick",
      name: "Nothing Ear Stick",
      formFactor: "earbuds",
      image: "assets/devices/nothing-ear-stick.webp",
      color: "White",
      blurb: "Nothing Ear Stick tube-case earbuds.",
      connectedByDefault: false,
      battery: { left: 65, right: 65, case: 55 },
      lastBattery: 65,
      batteryText: "5h left",
      firmware: "v1.0.0",
      controlStyle: "pinch",
      managedSoftware: "Nothing X",
      capabilities: {
        anc: false, transparency: false, adaptive: false, spatial: false, autopause: true,
        sleeping: true, gaming: false, multipoint: true, wirelessCharging: false,
        wearDetection: false, firmware: false, find: true, eq: true
      }
    },
    /* ——————————————————————— Google ——————————————————————— */
    {
      id: "google-pixel-buds-pro",
      brand: "Google",
      model: "Pixel Buds Pro",
      name: "Pixel Buds Pro",
      formFactor: "earbuds",
      image: "assets/devices/google-pixel-buds-pro.webp",
      color: "Fog",
      blurb: "Google Pixel Buds Pro with Silent Seal and spatial audio.",
      connectedByDefault: false,
      battery: { left: 72, right: 72, case: 68 },
      lastBattery: 72,
      batteryText: "7h left",
      firmware: "v3.0",
      firmwareTarget: "v3.1",
      controlStyle: "touch",
      managedSoftware: "Pixel Buds app",
      capabilities: {
        anc: true, transparency: true, adaptive: true, spatial: true, autopause: true,
        sleeping: true, gaming: true, multipoint: true, wirelessCharging: true,
        wearDetection: true, firmware: true, find: true, eq: true
      }
    },
    {
      id: "google-pixel-buds-a",
      brand: "Google",
      model: "Pixel Buds A-Series",
      name: "Pixel Buds A-Series",
      formFactor: "earbuds",
      image: "assets/devices/google-pixel-buds-a.webp",
      color: "Charcoal",
      blurb: "Google Pixel Buds A-Series with adaptive sound and clear calls.",
      connectedByDefault: false,
      battery: { left: 65, right: 65, case: 60 },
      lastBattery: 65,
      batteryText: "5h left",
      firmware: "v2.1",
      controlStyle: "touch",
      managedSoftware: "Pixel Buds app",
      capabilities: {
        anc: false, transparency: false, adaptive: false, spatial: false, autopause: true,
        sleeping: false, gaming: false, multipoint: false, wirelessCharging: true,
        wearDetection: true, firmware: false, find: true, eq: true
      }
    }
  ];

  const DEFAULT_PROFILE = {
    name: "Alex Rivera",
    initials: "AR",
    email: "alex.rivera@icloud.com",
    memberSince: "2024"
  };

  const normalizeBands = (bands) => Array.isArray(bands) && bands.length === 10
    ? bands.map(n => Math.max(-12, Math.min(12, Number(n) || 0)))
    : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  const normalizeGesture = (value, fallback) =>
    GESTURES.some(gesture => gesture.value === value) ? value : fallback;

  const defaultSettingsFor = (device) => {
    const caps = device.capabilities || {};
    return {
      preset: "default",
      anc: caps.anc ? "on" : caps.transparency ? "transparency" : "off",
      level: caps.anc ? 80 : 0,
      sleeping: Boolean(caps.sleeping),
      gaming: Boolean(caps.gaming),
      adaptive: Boolean(caps.adaptive),
      spatial: Boolean(caps.spatial),
      autopause: false,
      gestures: {
        double: "Playback/Pause",
        triple: "Playback/Pause"
      },
      firmware: device.firmware || "v1.0.0",
      customBands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
  };

  const normalizeSettings = (device, saved = {}) => {
    const caps = device.capabilities || {};
    const fallback = defaultSettingsFor(device);
    let anc = ["on", "off", "transparency"].includes(saved.anc) ? saved.anc : fallback.anc;

    if (!caps.anc && anc !== "transparency") anc = caps.transparency ? "transparency" : "off";
    if (anc === "transparency" && !caps.transparency) anc = caps.anc ? "on" : "off";

    return {
      preset: PRESETS[saved.preset] ? saved.preset : fallback.preset,
      anc,
      level: caps.anc
        ? Math.max(0, Math.min(100, Number(saved.level ?? fallback.level) || 0))
        : 0,
      sleeping: caps.sleeping ? Boolean(saved.sleeping ?? fallback.sleeping) : false,
      gaming: caps.gaming ? Boolean(saved.gaming ?? fallback.gaming) : false,
      adaptive: caps.adaptive ? Boolean(saved.adaptive ?? fallback.adaptive) : false,
      spatial: caps.spatial ? Boolean(saved.spatial ?? fallback.spatial) : false,
      autopause: caps.autopause ? Boolean(saved.autopause ?? fallback.autopause) : false,
      gestures: {
        double: normalizeGesture(saved.gestures?.double, fallback.gestures.double),
        triple: normalizeGesture(saved.gestures?.triple, fallback.gestures.triple)
      },
      firmware: typeof saved.firmware === "string" && saved.firmware ? saved.firmware : fallback.firmware,
      customBands: normalizeBands(saved.customBands)
    };
  };

  const makeDefaultDevices = () => DEVICE_CATALOG.map(profile => ({
    ...structuredClone(profile),
    connected: Boolean(profile.connectedByDefault),
    name: profile.name,
    battery: { ...profile.battery },
    lastBattery: profile.lastBattery
  }));

  const makeDefaultSettings = () =>
    Object.fromEntries(DEVICE_CATALOG.map(device => [device.id, defaultSettingsFor(device)]));

  const defaultState = {
    activeDeviceId: "pulse-explore",
    devices: makeDefaultDevices(),
    settingsByDevice: makeDefaultSettings(),
    profile: { ...DEFAULT_PROFILE },
    ...defaultSettingsFor(DEVICE_CATALOG[0]),
    playing: false
  };

  const normalizeState = (parsed = {}) => {
    const savedDevices = Array.isArray(parsed.devices) ? parsed.devices : [];
    const devices = makeDefaultDevices().map(device => {
      const saved = savedDevices.find(item => item && item.id === device.id);
      if (!saved) return device;
      const savedName = typeof saved.name === "string" ? saved.name.trim().slice(0, 32) : "";
      return {
        ...device,
        ...saved,
        name: savedName || device.name,
        battery: { ...device.battery, ...(saved.battery || {}) },
        lastBattery: Number.isFinite(Number(saved.lastBattery))
          ? Math.max(0, Math.min(100, Number(saved.lastBattery)))
          : device.lastBattery,
        capabilities: { ...device.capabilities, ...(saved.capabilities || {}) },
        connected: typeof saved.connected === "boolean" ? saved.connected : device.connected
      };
    });

    const settingsByDevice = {};
    DEVICE_CATALOG.forEach(catalogDevice => {
      const device = devices.find(item => item.id === catalogDevice.id) || catalogDevice;
      const legacy = parsed.legacy && catalogDevice.id === "pulse-explore" ? parsed.legacy : null;
      const saved = parsed.settingsByDevice?.[catalogDevice.id] || legacy || {};
      settingsByDevice[catalogDevice.id] = normalizeSettings(device, saved);
    });

    const connected = devices.filter(device => device.connected);
    let activeDeviceId = parsed.activeDeviceId;
    if (!connected.some(device => device.id === activeDeviceId)) {
      activeDeviceId = connected[0]?.id || devices[0].id;
    }

    return {
      ...defaultState,
      ...(parsed.profile ? { profile: { ...DEFAULT_PROFILE, ...parsed.profile } } : {}),
      devices,
      settingsByDevice,
      activeDeviceId,
      ...settingsByDevice[activeDeviceId],
      playing: false
    };
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalizeState(JSON.parse(raw));

      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) return normalizeState({ legacy: JSON.parse(legacyRaw) });
    } catch {
      /* fall through to defaults */
    }
    return normalizeState({});
  };

  const state = loadState();
  const apps = [];
  let scanning = false;
  let scanTimer = null;

  const getDevice = id => state.devices.find(device => device.id === id) || null;
  const activeDevice = () => getDevice(state.activeDeviceId) || state.devices[0];
  const connectedDevices = () => state.devices.filter(device => device.connected);
  const nearbyDevices = () => state.devices.filter(device => !device.connected);

  const persistActiveSettings = () => {
    if (!state.activeDeviceId) return;
    state.settingsByDevice[state.activeDeviceId] = {
      preset: state.preset,
      anc: state.anc,
      level: state.level,
      sleeping: state.sleeping,
      gaming: state.gaming,
      adaptive: state.adaptive,
      spatial: state.spatial,
      autopause: state.autopause,
      gestures: { ...state.gestures },
      firmware: state.firmware,
      customBands: state.customBands.slice()
    };
  };

  const saveState = () => {
    try {
      persistActiveSettings();
      const copy = { ...state, playing: false };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    } catch {
      /* storage is optional */
    }
  };

  const icon = (name, className = "") =>
    `<svg class="icon ${className}"><use href="#${name}"/></svg>`;

  const escapeHTML = (value) =>
    String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));

  const TOGGLE_CAPABILITY = {
    sleeping: "sleeping",
    gaming: "gaming",
    adaptive: "adaptive",
    spatial: "spatial",
    autopause: "autopause"
  };

  const deviceSupports = (device, key) => Boolean(device?.capabilities?.[key]);
  const brandMonogramDataURI = (brand = "PULSE") => {
    const label = String(brand).slice(0, 3).toUpperCase();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="28" fill="#171719"/><text x="60" y="72" text-anchor="middle" font-family="Manrope, Segoe UI, sans-serif" font-size="42" font-weight="700" fill="#ffffff">${label}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };
  const deviceFormLabel = device =>
    device.formFactor === "headphones" ? "Over-ear headphones" : "Wireless earbuds";
  const deviceControlMeta = device => CONTROL_META[device.controlStyle] || CONTROL_META.touch;
  const deviceTypeIcon = device => device.formFactor === "headphones" ? "i-headphones" : "i-music";

  const capabilityKeys = device =>
    Object.keys(CAPABILITY_META).filter(key => deviceSupports(device, key));

  const highlightCapabilities = device => {
    const preferred = ["anc", "transparency", "spatial", "adaptive", "gaming", "multipoint", "wirelessCharging", "eq"];
    const supported = capabilityKeys(device);
    const highlights = preferred.filter(key => supported.includes(key));
    return [...highlights, ...supported.filter(key => !highlights.includes(key))];
  };

  const capabilityChipsHTML = (device, limit = 4) =>
    highlightCapabilities(device).slice(0, limit).map(key => {
      const meta = CAPABILITY_META[key];
      return `<span class="cap-chip">${icon(meta.icon)}<span>${meta.short}</span></span>`;
    }).join("");

  const batteryRows = device => {
    if (device.formFactor === "headphones") {
      const percent = Number(device.battery.single ?? device.lastBattery) || device.lastBattery;
      return [{
        label: "Battery",
        value: `${percent}%`,
        width: percent,
        note: device.batteryText
      }];
    }
    return [
      { label: "Left bud", value: `${device.battery.left}%`, width: device.battery.left },
      { label: "Right bud", value: `${device.battery.right}%`, width: device.battery.right },
      { label: "Case", value: `${device.battery.case}%`, width: device.battery.case }
    ];
  };

  const batteryChipsHTML = device => {
    if (device.formFactor === "headphones") {
      return `<span class="battery-chip">${icon("i-battery-pill")}<b>${device.lastBattery}%</b></span>
        <span class="battery-chip battery-chip--time">${icon("i-play")}<b>${escapeHTML(device.batteryText)}</b></span>`;
    }
    return `<span class="battery-chip">${icon("i-battery-pill")}<b>L ${device.battery.left}%</b></span>
      <span class="battery-chip">${icon("i-battery-pill")}<b>R ${device.battery.right}%</b></span>`;
  };

  const batteryDetailHTML = device => batteryRows(device).map(row =>
    `<div class="battery-detail-row"><span>${escapeHTML(row.label)}</span><div class="battery-meter"><i style="width:${row.width}%"></i></div><span>${escapeHTML(row.value)}</span></div>`
  ).join("");

  /* ————————————————————————— Audio ————————————————————————— */
  class PulseAudio {
    constructor() {
      this.ctx = null;
      this.nodes = null;
      this.gain = null;
      this.filters = null;
      this.playing = false;
      this.findTimer = null;
      this.findOsc = null;
      this.findGain = null;
    }

    ensureContext() {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      if (!this.ctx) this.ctx = new AudioCtor();
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return this.ctx;
    }

    buildGraph() {
      const ctx = this.ensureContext();
      if (!ctx) return;

      const master = ctx.createGain();
      master.gain.value = 0.0001;

      const low = ctx.createBiquadFilter();
      low.type = "lowshelf";
      low.frequency.value = 175;

      const mid = ctx.createBiquadFilter();
      mid.type = "peaking";
      mid.frequency.value = 1100;
      mid.Q.value = 0.9;

      const high = ctx.createBiquadFilter();
      high.type = "highshelf";
      high.frequency.value = 5600;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 22;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.02;
      compressor.release.value = 0.25;

      const soundBus = ctx.createGain();
      soundBus.gain.value = 0.72;

      const chords = [
        { freq: 110, type: "sine", gain: 0.22, detune: -3 },
        { freq: 164.81, type: "triangle", gain: 0.13, detune: 4 },
        { freq: 277.18, type: "sine", gain: 0.075, detune: -5 },
        { freq: 329.63, type: "sine", gain: 0.045, detune: 7 }
      ];

      const oscillators = chords.map((chord, i) => {
        const osc = ctx.createOscillator();
        osc.type = chord.type;
        osc.frequency.value = chord.freq;
        osc.detune.value = chord.detune;

        const env = ctx.createGain();
        env.gain.value = chord.gain;

        const lfo = ctx.createOscillator();
        lfo.type = "sine";
        lfo.frequency.value = 0.055 + i * 0.013;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = chord.gain * 0.18;
        lfo.connect(lfoGain).connect(env.gain);
        lfo.start();

        osc.connect(env).connect(soundBus);
        osc.start();
        return { osc, env, lfo };
      });

      // Quiet airy texture that gives the EQ something to shape.
      const length = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const channel = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        last = last * 0.975 + white * 0.025;
        channel[i] = last * 1.6;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.value = 950;
      noiseFilter.Q.value = 0.75;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.01;
      noise.connect(noiseFilter).connect(noiseGain).connect(soundBus);
      noise.start();

      soundBus.connect(low).connect(mid).connect(high).connect(compressor).connect(master).connect(ctx.destination);

      this.nodes = { master, low, mid, high, compressor, soundBus, oscillators, noise, noiseFilter, noiseGain };
      this.gain = master;
      this.filters = { low, mid, high };
      this.applyTuning(false);
    }

    applyTuning(smooth = true) {
      if (!this.nodes) return;
      const now = this.ctx.currentTime;
      const timeConstant = smooth ? 0.09 : 0.001;
      const preset = PRESETS[state.preset] || PRESETS.default;
      let tuning = preset.gains;

      if (state.preset === "custom") {
        const bands = state.customBands;
        tuning = {
          low: (bands[0] + bands[1] + bands[2]) / 3,
          mid: (bands[3] + bands[4] + bands[5] + bands[6]) / 4,
          high: (bands[7] + bands[8] + bands[9]) / 3
        };
      }

      const ancAdjustment = !deviceSupports(activeDevice(), "anc")
        ? 0
        : state.anc === "on" ? 0 : state.anc === "transparency" ? 0.6 : -0.7;
      this.filters.low.gain.setTargetAtTime(tuning.low + ancAdjustment, now, timeConstant);
      this.filters.mid.gain.setTargetAtTime(tuning.mid, now, timeConstant);
      this.filters.high.gain.setTargetAtTime(tuning.high, now, timeConstant);

      const hasAnc = deviceSupports(activeDevice(), "anc");
      const listeningLevel = hasAnc ? Number(state.level) : 70;
      const volume = 0.018 + (listeningLevel / 100) * 0.055;
      this.nodes.master.gain.setTargetAtTime(volume, now, timeConstant);
      if (this.nodes.noiseGain) {
        this.nodes.noiseGain.gain.setTargetAtTime(0.006 + listeningLevel / 42000, now, timeConstant);
      }
    }

    async play() {
      if (!this.ensureContext()) return false;
      if (!this.nodes) this.buildGraph();
      if (!this.nodes) return false;
      this.playing = true;
      state.playing = true;
      const now = this.ctx.currentTime;
      this.nodes.master.gain.cancelScheduledValues(now);
      this.nodes.master.gain.setValueAtTime(Math.max(0.0001, this.nodes.master.gain.value), now);
      this.applyTuning();
      this.sync();
      return true;
    }

    stop() {
      this.playing = false;
      state.playing = false;
      if (this.nodes && this.ctx) {
        const now = this.ctx.currentTime;
        this.nodes.master.gain.cancelScheduledValues(now);
        this.nodes.master.gain.setTargetAtTime(0.0001, now, 0.06);
        const captured = this.nodes;
        this.nodes = null;
        this.filters = null;
        this.gain = null;
        window.setTimeout(() => {
          try {
            captured.oscillators.forEach(({ osc, lfo }) => {
              osc.stop();
              lfo.stop();
            });
            captured.noise.stop();
          } catch {
            /* already stopped */
          }
        }, 450);
      }
      this.sync();
    }

    toggle() {
      if (this.playing) {
        this.stop();
        return false;
      }
      this.play();
      return true;
    }

    sync() {
      apps.forEach(app => app.syncAudioButton());
    }

    startFindBeep() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      this.stopFindBeep();

      const chirp = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.22);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
        this.findOsc = osc;
        this.findGain = gain;
      };

      chirp();
      this.findTimer = window.setInterval(chirp, 1650);
    }

    stopFindBeep() {
      if (this.findTimer) {
        window.clearInterval(this.findTimer);
        this.findTimer = null;
      }
      if (this.findOsc) {
        try {
          this.findOsc.stop();
        } catch {
          /* already stopped */
        }
        this.findOsc = null;
      }
      this.findGain = null;
    }

    shortClick() {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.018, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  const audio = new PulseAudio();

  /* ————————————————————————— App instance ————————————————————————— */
  class PulseApp {
    constructor(root, initialRoute) {
      this.root = root;
      this.initialRoute = initialRoute || "welcome";
      this.route = "";
      this.history = [];
      this.slide = 0;
      this.sheet = null;
      this.sheetContext = null;
      this.sheetTimer = null;
      this.firmwareTimer = null;
      this.firmwareTarget = null;
      this.findTimer = null;
      this.toastTimer = null;
      this.active = false;

      root.appendChild(template.content.cloneNode(true));

      this.screens = Array.from(root.querySelectorAll("[data-screen]"));
      this.screenMap = Object.fromEntries(this.screens.map(screen => [screen.dataset.screen, screen]));
      this.backdrop = root.querySelector("[data-sheet-backdrop]");
      this.sheetHost = root.querySelector("[data-sheet-host]");
      this.toastEl = root.querySelector("[data-toast]");
      this.findOverlay = root.querySelector("[data-find-overlay]");
      this.carousel = root.querySelector("[data-carousel]");

      this.screens.forEach(screen => {
        screen.setAttribute("aria-hidden", "true");
        screen.inert = true;
      });

      this.bindEvents();
      this.syncState();
      this.navigate(this.initialRoute, { push: false });
      this.setSlide(0);
      this.syncAudioButton();
    }

    bindEvents() {
      this.root.addEventListener("click", event => this.handleClick(event));
      this.root.addEventListener("input", event => this.handleInput(event));
      this.root.addEventListener("submit", event => this.handleSubmit(event));
      this.root.addEventListener("keydown", event => {
        if (event.key === "Escape") {
          if (this.sheet) this.closeSheet();
          else if (!this.findOverlay.hidden) this.closeFind();
        }
      });

      this.backdrop.addEventListener("click", () => this.closeSheet());

      let startX = null;
      let startY = null;
      let tracking = false;

      this.carousel.addEventListener("pointerdown", event => {
        if (event.target.closest("button")) return;
        startX = event.clientX;
        startY = event.clientY;
        tracking = true;
        this.carousel.setPointerCapture?.(event.pointerId);
      });

      this.carousel.addEventListener("pointerup", event => {
        if (!tracking || startX === null) return;
        tracking = false;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        startX = null;
        startY = null;
        if (Math.abs(dx) < 34 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        if (dx < 0) this.setSlide(this.slide + 1);
        else this.setSlide(this.slide - 1);
      });

      this.carousel.addEventListener("pointercancel", () => {
        tracking = false;
        startX = null;
        startY = null;
      });
    }

    handleClick(event) {
      const target = event.target.closest(
        "[data-action], [data-nav], [data-back], [data-sheet], [data-preset], [data-anc], [data-toggle], [data-go-slide], [data-sheet-option]"
      );
      if (!target || !this.root.contains(target)) return;

      audio.ensureContext();
      const device = activeDevice();

      if (target.dataset.goSlide !== undefined) {
        this.setSlide(Number(target.dataset.goSlide));
        return;
      }

      if (target.dataset.nav) {
        this.navigate(target.dataset.nav);
        return;
      }

      if (target.dataset.back !== undefined) {
        this.back();
        return;
      }

      if (target.dataset.sheet) {
        this.openSheet(target.dataset.sheet);
        return;
      }

      if (target.dataset.preset) {
        this.selectPreset(target.dataset.preset);
        return;
      }

      if (target.dataset.anc) {
        const mode = target.dataset.anc;
        if (mode === "transparency" && !deviceSupports(device, "transparency")) {
          this.showToast("This device doesn't report a transparency mode");
          return;
        }
        if (mode !== "transparency" && !deviceSupports(device, "anc")) {
          this.showToast("Active noise cancelling isn't supported on this device");
          return;
        }
        state.anc = mode;
        audio.applyTuning();
        saveState();
        apps.forEach(app => app.syncState());
        audio.shortClick();
        return;
      }

      if (target.dataset.toggle) {
        const key = target.dataset.toggle;
        if (!deviceSupports(device, TOGGLE_CAPABILITY[key])) {
          this.showToast(`${prettyToggleName(key)} isn't available on this device`);
          return;
        }
        state[key] = !state[key];
        saveState();
        apps.forEach(app => app.syncState());
        this.showToast(`${prettyToggleName(key)} ${state[key] ? "on" : "off"}`);
        audio.shortClick();
        return;
      }

      if (target.dataset.sheetOption !== undefined) {
        this.handleSheetOption(target);
        return;
      }

      const action = target.dataset.action;

      switch (action) {
        case "start":
          this.navigate("equalizer");
          break;
        case "toggle-audio":
          this.toggleAudio();
          break;
        case "find-device":
          this.openFind(target.dataset.deviceId);
          break;
        case "close-find":
        case "stop-find":
          this.closeFind();
          break;
        case "firmware":
          this.openSheet("firmware");
          break;
        case "update-firmware":
          this.runFirmwareUpdate();
          break;
        case "close-sheet":
          this.closeSheet();
          break;
        case "reset-eq":
          this.resetBands();
          break;
        case "save-eq":
          this.saveCustomEQ();
          break;
        case "scan-devices":
          this.scanDevices();
          break;
        case "set-active":
          this.setActiveDevice(target.dataset.deviceId || state.activeDeviceId);
          break;
        case "pair-device":
          this.pairDevice(target.dataset.deviceId);
          break;
        case "rename-device":
        case "rename-active":
          this.openRenameSheet(target.dataset.deviceId);
          break;
        case "device-details":
          this.setActiveDevice(target.dataset.deviceId || state.activeDeviceId, { openDetails: true, announce: false });
          break;
        case "open-capabilities":
          this.openCapabilities(target.dataset.deviceId);
          break;
        case "manage-devices":
          this.closeSheet(true);
          this.navigate("devices");
          break;
        case "update-catalog":
          syncCatalog(true);
          break;
        case "delete-device":
          this.deleteDevice(target.dataset.deviceId);
          break;
        case "reset-device":
          this.resetDevice(target.dataset.deviceId);
          break;
        case "dismiss-toast":
          this.hideToast();
          break;
        default:
          break;
      }
    }

    handleInput(event) {
      const input = event.target;

      if (input.matches('[data-action="level"]')) {
        if (!deviceSupports(activeDevice(), "anc")) return;
        state.level = Number(input.value);
        saveState();
        apps.forEach(app => app.syncLevel());
        audio.applyTuning();
        return;
      }

      if (input.matches("[data-band]")) {
        const index = Array.from(this.root.querySelectorAll("[data-band]")).indexOf(input);
        if (index < 0) return;
        state.customBands[index] = Number(input.value);
        const band = input.closest(".vertical-band");
        band.querySelector(".band-value").textContent =
          Number(input.value) > 0 ? `+${input.value}` : String(input.value);
        this.updateBandFill(input);
        saveState();
        if (state.playing) audio.applyTuning();
        return;
      }
    }

    handleSubmit(event) {
      const form = event.target.closest("[data-rename-form]");
      if (!form) return;
      event.preventDefault();

      const device = getDevice(form.dataset.deviceId);
      if (!device) return;
      const input = form.querySelector('input[name="deviceName"]');
      const error = form.querySelector("[data-rename-error]");
      const name = (input?.value || "").trim().replace(/\s+/g, " ").slice(0, 32);

      if (!name) {
        if (error) error.textContent = "Give your device a name first.";
        input?.focus();
        return;
      }

      device.name = name;
      saveState();
      apps.forEach(app => app.syncState());
      this.closeSheet();
      this.showToast(`${name} renamed`);
      audio.shortClick();
    }

    handleSheetOption(target) {
      const type = target.dataset.sheetOption;

      if (type === "gesture") {
        const which = target.dataset.gesture;
        const value = target.dataset.value;
        const meta = deviceControlMeta(activeDevice());
        if (state.gestures[which] !== value) {
          state.gestures[which] = value;
          saveState();
          apps.forEach(app => app.syncState());
        }
        this.closeSheet();
        this.showToast(`${which === "double" ? meta.double : meta.triple} set to ${value}`);
        audio.shortClick();
        return;
      }

      if (type === "profile") {
        const value = target.dataset.value;
        if (value === "signature" || value === "balanced" || value === "warm") {
          const map = { signature: "default", balanced: "classic", warm: "bass" };
          state.preset = map[value];
          saveState();
          apps.forEach(app => app.syncState());
          audio.applyTuning();
          this.closeSheet();
          this.showToast(`Sound profile set to ${target.querySelector("b")?.textContent || value}`);
          return;
        }
      }

      if (type === "device") {
        const value = target.dataset.value;
        const device = getDevice(value);
        if (!device || !device.connected) return;
        this.closeSheet(true);
        this.setActiveDevice(value, { announce: false });
        this.showToast(`${device.name} is now active`);
        return;
      }

      if (type === "support") {
        this.closeSheet();
        this.showToast("Our audio care team will be with you shortly.");
        return;
      }
    }

    navigate(route, options = {}) {
      if (!this.screenMap[route]) return;
      if (route === this.route) {
        if (route === "equalizer") {
          const scroll = this.screenMap[route].querySelector(".screen-scroll");
          if (scroll) scroll.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      const current = this.screenMap[this.route];
      const next = this.screenMap[route];

      if (current) {
        current.classList.add("is-leaving-left");
        current.classList.remove("is-active");
        current.setAttribute("aria-hidden", "true");
        current.inert = true;
        window.setTimeout(() => current.classList.remove("is-leaving-left"), 460);
      }

      next.classList.add("is-active");
      next.setAttribute("aria-hidden", "false");
      next.inert = false;
      const scroll = next.querySelector(".screen-scroll");
      if (scroll) scroll.scrollTop = 0;

      this.route = route;
      if (options.push !== false) this.history.push(route);
      this.updateNav();
    }

    back() {
      if (this.history.length > 1) {
        this.history.pop();
        const previous = this.history[this.history.length - 1];
        this.navigate(previous, { push: false });
        return;
      }
      this.history = ["welcome"];
      this.navigate("welcome", { push: false });
    }

    setSlide(index) {
      const slides = Array.from(this.root.querySelectorAll("[data-slide]"));
      if (!slides.length) return;
      this.slide = (index + slides.length) % slides.length;

      slides.forEach((slide, i) => {
        const active = i === this.slide;
        slide.classList.toggle("is-active", active);
        slide.classList.toggle("is-prev", i < this.slide);
        slide.setAttribute("aria-hidden", String(!active));
      });

      this.root.querySelectorAll("[data-go-slide]").forEach(dot => {
        const active = Number(dot.dataset.goSlide) === this.slide;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", String(active));
      });
    }

    selectPreset(preset) {
      if (!PRESETS[preset]) return;
      state.preset = preset;
      if (preset !== "custom") {
        state.customBands = PRESETS[preset].bands.slice();
      }
      saveState();
      apps.forEach(app => app.syncState());
      audio.applyTuning();
      audio.shortClick();
    }

    toggleAudio() {
      const playing = audio.toggle();
      apps.forEach(app => app.syncAudioButton());
      this.showToast(playing ? "Sound preview playing" : "Sound preview paused");
      audio.shortClick();
    }

    syncAudioButton() {
      this.root.querySelectorAll('[data-action="toggle-audio"]').forEach(button => {
        button.classList.toggle("is-playing", state.playing);
        button.setAttribute("aria-label", state.playing ? "Pause sound preview" : "Play sound preview");
      });
    }

    syncLevel() {
      this.root.querySelectorAll("[data-level-fill]").forEach(fill => {
        fill.style.width = `${state.level}%`;
      });
      this.root.querySelectorAll("[data-level-value]").forEach(value => {
        value.textContent = String(state.level);
      });
      this.root.querySelectorAll('[data-action="level"]').forEach(input => {
        if (Number(input.value) !== state.level) input.value = state.level;
      });
    }

    syncState() {
      const preset = PRESETS[state.preset] || PRESETS.default;

      this.syncDeviceContext();

      this.root.querySelectorAll("[data-preset]").forEach(tile => {
        const active = tile.dataset.preset === state.preset;
        tile.classList.toggle("is-active", active);
        tile.setAttribute("aria-selected", String(active));
      });

      this.root.querySelectorAll("[data-preset-note]").forEach(note => {
        note.textContent = preset.note;
      });

      this.root.querySelectorAll("[data-anc]").forEach(tile => {
        const active = tile.dataset.anc === state.anc;
        tile.classList.toggle("is-active", active);
        tile.setAttribute("aria-pressed", String(active));
      });

      this.syncLevel();

      ["sleeping", "gaming", "adaptive", "spatial", "autopause"].forEach(key => {
        this.root.querySelectorAll(`[data-toggle="${key}"]`).forEach(button => {
          button.classList.toggle("is-on", Boolean(state[key]));
          button.setAttribute("aria-checked", String(Boolean(state[key])));
        });
      });

      this.root.querySelectorAll("[data-state-tag]").forEach(tag => {
        const key = tag.dataset.stateTag;
        const on = Boolean(state[key]);
        tag.textContent = on ? "ON" : "OFF";
        tag.classList.toggle("is-off", !on);
      });

      Object.entries(state.gestures).forEach(([which, value]) => {
        this.root.querySelectorAll(`[data-gesture-label="${which}"]`).forEach(label => {
          label.textContent = value;
        });
      });

      this.root.querySelectorAll("[data-firmware-version]").forEach(el => {
        el.textContent = state.firmware;
      });

      this.root.querySelectorAll("[data-settings-preset]").forEach(el => {
        el.textContent = preset.name;
      });

      this.syncBands();
      this.syncAudioButton();
      this.updateNav();
    }

    setHidden(selector, hidden) {
      this.root.querySelectorAll(selector).forEach(el => {
        el.hidden = Boolean(hidden);
      });
    }

    syncDeviceContext() {
      const device = activeDevice();
      if (!device) return;
      const caps = device.capabilities || {};
      const control = deviceControlMeta(device);
      const connected = connectedDevices();

      this.root.querySelectorAll("[data-active-device-name]").forEach(el => {
        el.textContent = device.name;
      });
      this.root.querySelectorAll("[data-active-device-brand]").forEach(el => {
        el.textContent = device.brand;
      });
      this.root.querySelectorAll("[data-active-device-form]").forEach(el => {
        el.textContent = deviceFormLabel(device);
      });
      this.root.querySelectorAll("[data-active-device-battery]").forEach(el => {
        el.textContent = `${device.lastBattery}%`;
      });
      this.root.querySelectorAll("[data-active-device-image]").forEach(img => {
        img.src = device.image;
        img.alt = device.name;
        img.onerror = () => { img.src = brandMonogramDataURI(device.brand); };
      });
      this.root.querySelectorAll("[data-active-device-chips]").forEach(el => {
        el.innerHTML = capabilityChipsHTML(device, 4);
      });
      this.root.querySelectorAll("[data-device-count]").forEach(el => {
        el.textContent = `${connected.length} connected`;
      });

      this.root.querySelectorAll("[data-device-name]").forEach(el => {
        el.textContent = device.name;
      });
      this.root.querySelectorAll("[data-device-brand]").forEach(el => {
        el.textContent = device.brand;
      });
      this.root.querySelectorAll("[data-device-type]").forEach(el => {
        el.textContent = deviceFormLabel(device);
      });
      this.root.querySelectorAll("[data-device-image]").forEach(img => {
        img.src = device.image;
        img.alt = device.name;
        img.onerror = () => { img.src = brandMonogramDataURI(device.brand); };
      });
      this.root.querySelectorAll("[data-battery-chips]").forEach(el => {
        el.innerHTML = batteryChipsHTML(device);
      });
      this.root.querySelectorAll("[data-device-capability-chips]").forEach(el => {
        el.innerHTML = capabilityChipsHTML(device, 4);
      });
      this.root.querySelectorAll("[data-eq-device-thumb]").forEach(img => {
        img.src = device.image;
        img.alt = device.name;
        img.onerror = () => { img.src = brandMonogramDataURI(device.brand); };
      });
      this.root.querySelectorAll("[data-eq-device-name]").forEach(el => { el.textContent = device.name; });

      // Battery display logic
      const isHeadphones = device.formFactor === "headphones";
      const leftVal = Math.round(device.battery ? (device.battery.left || device.battery.single || device.lastBattery || 0) : (device.lastBattery || 0));
      const rightVal = Math.round(device.battery ? (device.battery.right || device.battery.left || device.battery.single || device.lastBattery || 0) : (device.lastBattery || 0));
      const caseVal = Math.round(device.battery ? (device.battery.case || 100) : 100);
      const singleVal = Math.round(device.battery ? (device.battery.single || device.lastBattery || 0) : (device.lastBattery || 0));
      this.root.querySelectorAll("[data-battery-left]").forEach(el => { el.textContent = isHeadphones ? "" : leftVal + "%"; });
      this.root.querySelectorAll("[data-battery-right]").forEach(el => { el.textContent = isHeadphones ? "" : rightVal + "%"; });
      this.root.querySelectorAll("[data-battery-case]").forEach(el => { el.textContent = isHeadphones ? "" : caseVal + "%"; });
      this.root.querySelectorAll("[data-battery-single]").forEach(el => { el.textContent = isHeadphones ? singleVal + "%" : ""; });
      document.querySelectorAll(".headphones-only").forEach(el => el.style.display = isHeadphones ? "flex" : "none");
      document.querySelectorAll(".earbuds-only").forEach(el => el.style.display = isHeadphones ? "none" : "flex");
      this.root.querySelectorAll("[data-eq-device-battery]").forEach(el => { el.textContent = `${device.lastBattery}%`; });
      this.root.querySelectorAll("[data-eq-eyebrow]").forEach(el => {
        el.innerHTML = `Connected to <span data-eq-device-name>${device.name}</span> · <b data-eq-device-battery>${device.lastBattery}%</b>`;
      });
      this.root.querySelectorAll("[data-eq-battery]").forEach(el => {
        el.textContent = `${device.lastBattery}% · ${device.batteryText}`;
      });
      this.root.querySelectorAll("[data-advanced-device]").forEach(el => {
        el.textContent = device.name;
      });
      this.root.querySelectorAll("[data-settings-device-image]").forEach(img => {
        img.src = device.image;
        img.alt = device.name;
        img.onerror = () => { img.src = brandMonogramDataURI(device.brand); };
      });
      this.root.querySelectorAll("[data-settings-device-name]").forEach(el => {
        el.textContent = device.name;
      });
      this.root.querySelectorAll("[data-settings-device-status]").forEach(el => {
        el.textContent = `${deviceFormLabel(device)} · ${device.lastBattery}% battery`;
      });
      this.root.querySelectorAll("[data-profile-device-count]").forEach(el => {
        el.textContent = String(connected.length);
      });
      this.root.querySelectorAll("[data-capability-count]").forEach(el => {
        el.textContent = `${capabilityKeys(device).length} features`;
      });
      this.root.querySelectorAll("[data-control-label]").forEach(el => {
        el.textContent = control.label;
      });
      this.root.querySelectorAll("[data-control-double-label]").forEach(el => {
        el.textContent = control.double;
      });
      this.root.querySelectorAll("[data-control-triple-label]").forEach(el => {
        el.textContent = control.triple;
      });
      this.root.querySelectorAll("[data-managed-software]").forEach(el => {
        el.textContent = device.managedSoftware || "Managed by manufacturer";
      });
      this.root.querySelectorAll("[data-settings-version]").forEach(el => {
        el.textContent = caps.firmware ? state.firmware : "Companion mode";
      });

      const noiseControl = caps.anc || caps.transparency;
      this.setHidden("[data-adjustment-section]", !noiseControl);
      this.setHidden("[data-feature-fallback]", noiseControl);
      this.setHidden("[data-level-slider]", !caps.anc);
      this.setHidden('[data-anc="on"]', !caps.anc);
      this.setHidden('[data-anc="off"]', !caps.anc);
      this.setHidden('[data-anc="transparency"]', !caps.transparency);
      this.setHidden("[data-controls-section]", !device.controlStyle);
      this.setHidden("[data-find-row]", !caps.find);
      this.setHidden("[data-adaptive-row]", !caps.adaptive);
      this.setHidden("[data-spatial-row]", !caps.spatial);
      this.setHidden("[data-autopause-row]", !caps.autopause);
      this.setHidden("[data-sleeping-row]", !caps.sleeping);
      this.setHidden("[data-gaming-row]", !caps.gaming);
      this.setHidden("[data-controls-row]", !device.controlStyle);
      this.setHidden("[data-firmware-row]", !caps.firmware);
      this.setHidden("[data-managed-software-row]", caps.firmware || !device.managedSoftware);

      this.root.querySelectorAll("[data-adjustment-status]").forEach(el => {
        el.innerHTML = `<i></i>${caps.anc ? "ANC live" : "Transparency"}`;
      });

      this.root.querySelectorAll("[data-feature-fallback-chips]").forEach(el => {
        el.innerHTML = capabilityChipsHTML(device, 6);
      });

      this.renderDevices();
    }

    renderDevices() {
      const connectedList = this.root.querySelector("[data-connected-list]");
      const nearbyList = this.root.querySelector("[data-nearby-list]");
      if (!connectedList && !nearbyList) return;

      const connected = connectedDevices();
      const nearby = nearbyDevices();
      const activeId = state.activeDeviceId;

      if (connectedList) {
        connectedList.innerHTML = connected.map(device => {
          const active = device.id === activeId;
          const name = escapeHTML(device.name);
          return `<article class="connected-card ${active ? "is-active" : ""}" data-device-id="${device.id}">
            <button class="device-card-hit" data-action="${active ? "device-details" : "set-active"}" data-device-id="${device.id}" aria-label="${active ? `Open ${name} details` : `Use ${name}`}">
              <span class="device-card-art"><img src="${device.image}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='${brandMonogramDataURI(device.brand)}'"></span>
              <span class="device-card-copy">
                <span class="device-card-brand">${escapeHTML(device.brand)}</span>
                <b>${name}</b>
                <small>${deviceFormLabel(device)} · Last battery ${device.lastBattery}%</small>
              </span>
              <span class="device-card-state ${active ? "is-active" : ""}">${active ? "<i></i>Active" : "Tap to use"}</span>
            </button>
            <div class="device-card-actions">
              ${deviceSupports(device, "find") ? `<button class="card-icon-button" data-action="find-device" data-device-id="${device.id}" aria-label="Find ${name}">${icon("i-find")}</button>` : ""}
              <button class="card-icon-button" data-action="rename-device" data-device-id="${device.id}" aria-label="Rename ${name}">${icon("i-pencil")}</button>
              <button class="card-icon-button" data-action="reset-device" data-device-id="${device.id}" aria-label="Reset ${name}">${icon("i-reset")}</button>
              <button class="card-icon-button" data-action="delete-device" data-device-id="${device.id}" aria-label="Remove ${name}">${icon("i-x")}</button>
              <button class="card-icon-button" data-action="device-details" data-device-id="${device.id}" aria-label="Open ${name} details">${icon("i-chevron-right")}</button>
            </div>
          </article>`;
        }).join("");
      }

      if (nearbyList) {
        nearbyList.innerHTML = nearby.length
          ? nearby.map(device => {
              const name = escapeHTML(device.name);
              return `<article class="nearby-card" data-device-id="${device.id}">
                <span class="nearby-art"><img src="${device.image}" alt="${name}" loading="lazy" onerror="this.onerror=null;this.src='${brandMonogramDataURI(device.brand)}'"></span>
                <span class="nearby-copy">
                  <span class="nearby-brand">${escapeHTML(device.brand)}</span>
                  <b>${name}</b>
                  <small>${deviceFormLabel(device)} · Last battery ${device.lastBattery}%</small>
                </span>
                <button class="pair-button" data-action="pair-device" data-device-id="${device.id}">Pair</button>
              </article>`;
            }).join("")
          : `<div class="nearby-empty">${scanning ? "Searching for nearby audio devices…" : "No nearby devices. Tap scan to look again."}</div>`;
      }

      this.root.querySelectorAll("[data-connected-count]").forEach(el => {
        el.textContent = `${connected.length} paired`;
      });
      this.root.querySelectorAll("[data-nearby-count]").forEach(el => {
        el.textContent = `${nearby.length} found`;
      });
      this.root.querySelectorAll("[data-scan-status]").forEach(el => {
        el.classList.toggle("is-scanning", scanning);
        el.innerHTML = `<i></i>${scanning ? "Scanning" : "Ready"}`;
      });
      this.root.querySelectorAll('[data-action="scan-devices"]').forEach(button => {
        button.disabled = scanning;
        button.classList.toggle("is-scanning", scanning);
      });
    }

    syncBands() {
      const bands = this.root.querySelectorAll("[data-band]");
      bands.forEach((input, index) => {
        const value = Number(state.customBands[index] ?? 0);
        input.value = value;
        const band = input.closest(".vertical-band");
        const valueLabel = band.querySelector(".band-value");
        valueLabel.textContent = value > 0 ? `+${value}` : String(value);
        this.updateBandFill(input);
      });
    }

    updateBandFill(input) {
      const value = Number(input.value);
      const percent = ((value + 12) / 24) * 100;
      input.style.setProperty("--fill", `${percent}%`);
    }

    resetBands() {
      state.customBands = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      apps.forEach(app => app.syncBands());
      audio.applyTuning();
      this.showToast("Equalizer reset to flat");
      audio.shortClick();
    }

    saveCustomEQ() {
      state.preset = "custom";
      PRESETS.custom.bands = state.customBands.slice();
      saveState();
      apps.forEach(app => app.syncState());
      audio.applyTuning();
      this.showToast("Custom equalizer saved");
      this.navigate("equalizer");
      audio.shortClick();
    }

    setActiveDevice(deviceId, options = {}) {
      const device = getDevice(deviceId);
      if (!device || !device.connected) return;

      if (state.activeDeviceId === device.id) {
        if (options.openDetails) this.navigate("device");
        return;
      }

      persistActiveSettings();
      state.activeDeviceId = device.id;
      Object.assign(
        state,
        normalizeSettings(device, state.settingsByDevice[device.id] || defaultSettingsFor(device))
      );
      saveState();
      apps.forEach(app => app.syncState());
      audio.applyTuning();
      audio.shortClick();

      if (options.announce !== false) this.showToast(`${device.name} is now active`);
      if (options.openDetails) this.navigate("device");
    }

    openRenameSheet(deviceId) {
      const device = getDevice(deviceId) || activeDevice();
      if (!device || !device.connected) return;
      this.openSheet("rename-device", { deviceId: device.id });
    }

    openCapabilities(deviceId) {
      const device = getDevice(deviceId) || activeDevice();
      if (!device) return;
      this.openSheet("capabilities", { deviceId: device.id });
    }

    pairDevice(deviceId) {
      const device = getDevice(deviceId);
      if (!device || device.connected) return;

      device.connected = true;
      device.lastBattery = Math.max(20, Math.min(100, device.lastBattery + Math.floor(Math.random() * 4)));
      saveState();
      apps.forEach(app => app.syncState());
      this.showToast(`${device.name} paired`);
      audio.shortClick();
    }

    deleteDevice(deviceId) {
      const device = getDevice(deviceId);
      if (!device) return;
      device.connected = false;
      if (state.activeDeviceId === device.id) {
        state.activeDeviceId = DEVICE_CATALOG.find(d => d.id === "pulse-explore")?.id || state.activeDeviceId;
      }
      saveState();
      apps.forEach(app => app.syncState());
      this.showToast(`${device.name} removed`);
      audio.shortClick();
    }

    resetDevice(deviceId) {
      const device = getDevice(deviceId);
      if (!device) return;
      device.lastBattery = device.battery ? (device.battery.left || device.battery.single || 50) : 50;
      device.connected = false;
      if (state.activeDeviceId === device.id) {
        state.activeDeviceId = DEVICE_CATALOG.find(d => d.id === "pulse-explore")?.id || state.activeDeviceId;
      }
      saveState();
      apps.forEach(app => app.syncState());
      this.showToast(`${device.name} reset`);
      audio.shortClick();
    }

    scanDevices() {
      if (scanning) return;
      scanning = true;

      // Try real Web Bluetooth if available
      // Try LE scan (more permissive) first, then device request
      if (typeof navigator !== "undefined" && navigator.bluetooth && navigator.bluetooth.requestLEScan) {
        try {
          const scanPromise = navigator.bluetooth.requestLEScan({ acceptAllAdvertisements: true, keepRepeatedDevices: false });
          this.showToast("LE scanning active — nearby BT devices detected");
          setTimeout(() => { scanPromise.then(s => s.stop().catch(() => {})).catch(() => {}); }, 4000);
        } catch (e) { console.log("LE scan start error:", e); }
      }
      if (typeof navigator !== "undefined" && navigator.bluetooth && navigator.bluetooth.requestDevice) {
        this.showToast("Requesting Bluetooth device permission…");
        navigator.bluetooth.requestDevice({ acceptAllDevices: true })
          .then(device => {
            const name = device.name || "Unknown audio device";
            const id = "bt-" + device.id;
            const existing = state.devices.find(d => d.id === id);
            if (!existing) {
              const newDevice = {
                id: id,
                brand: "Detected",
                model: name,
                name: name,
                formFactor: "earbuds",
                image: "assets/devices/pulse-explore.webp",
                color: "Black",
                blurb: "Real device discovered via Bluetooth.",
                connectedByDefault: false,
                battery: { left: 70, right: 68, case: 60 },
                lastBattery: 70,
                batteryText: "5h left",
                firmware: "v1.0.0",
                controlStyle: "touch",
                capabilities: {
                  anc: false, transparency: false, adaptive: false, spatial: false,
                  autopause: true, sleeping: true, gaming: false, multipoint: false,
                  wirelessCharging: false, wearDetection: false, firmware: false, find: false, eq: true
                }
              };
              state.devices.push(newDevice);
              saveState();
            }
            this.showToast(`Found real device: ${name}`);
          })
          .catch(err => { console.log("BT scan cancelled or failed:", err); })
          .finally(() => {
            apps.forEach(app => app.renderDevices());
            this.showToast("Scanning nearby audio devices…");
            audio.shortClick();
            window.clearTimeout(scanTimer);
            scanTimer = window.setTimeout(() => {
              scanning = false;
              apps.forEach(app => app.renderDevices());
              this.showToast(`Scan complete · ${nearbyDevices().length} nearby`);
            }, 1400);
          });
        return;
      }

      apps.forEach(app => app.renderDevices());
      this.showToast("Scanning for nearby audio devices…");
      audio.shortClick();

      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(() => {
        scanning = false;
        apps.forEach(app => app.renderDevices());
        this.showToast(`Scan complete · ${nearbyDevices().length} nearby`);
      }, 1400);
    }

    updateNav() {
      this.root.querySelectorAll("[data-nav]").forEach(button => {
        if (!button.closest(".bottom-nav")) return;
        button.classList.toggle("is-active", button.dataset.nav === this.route);
      });
    }

    openSheet(type, options = {}) {
      if (this.sheet) this.closeSheet(true);
      this.sheet = type;
      this.sheetContext = { ...options };
      this.sheetHost.innerHTML = this.sheetMarkup(type);
      this.backdrop.hidden = false;
      this.root.querySelectorAll(".bottom-sheet").forEach(sheet => {
        window.requestAnimationFrame(() => sheet.classList.add("is-open"));
      });
      window.requestAnimationFrame(() => {
        this.backdrop.classList.add("is-open");
        const input = this.sheetHost.querySelector(".rename-field input");
        if (input) {
          input.focus();
          input.select();
        }
      });
      audio.shortClick();
    }

    closeSheet(immediate = false) {
      if (!this.sheet || !this.sheetHost) return;
      this.sheet = null;

      if (this.firmwareTimer) {
        window.clearInterval(this.firmwareTimer);
        this.firmwareTimer = null;
      }

      const sheet = this.sheetHost.querySelector(".bottom-sheet");
      if (sheet) sheet.classList.remove("is-open");
      this.backdrop.classList.remove("is-open");

      const finish = () => {
        this.sheetHost.innerHTML = "";
        this.backdrop.hidden = true;
        this.sheetContext = null;
      };

      if (immediate) finish();
      else {
        window.clearTimeout(this.sheetTimer);
        this.sheetTimer = window.setTimeout(finish, 330);
      }
    }

    sheetMarkup(type) {
      const device = activeDevice();
      const contextDevice = this.sheetContext?.deviceId ? getDevice(this.sheetContext.deviceId) : null;

      if (type === "gesture-double" || type === "gesture-triple") {
        const which = type === "gesture-double" ? "double" : "triple";
        const selected = state.gestures[which];
        const control = deviceControlMeta(device);
        return this.wrapSheet(
          "TOUCH CONTROLS",
          `${device.name} — ${which}`,
          `<div style="text-align:center;padding-top:8px;">
            <img src="${device.image}" alt="" style="width:100px;height:100px;object-fit:contain;margin:0 auto;display:block;filter:drop-shadow(0 8px 16px rgba(0,0,0,0.1));" onerror="this.onerror=null;this.src='${brandMonogramDataURI(device.brand)}'">
            <p style="font-family:'Manrope',sans-serif;font-weight:700;font-size:14px;color:#111;margin:10px 0 2px;">${escapeHTML(device.name)}</p>
            <p style="font-size:11px;color:#777;margin:0;">Touch controls mapped</p>
          </div>
          <div style="display:flex;justify-content:center;gap:8px;margin:16px 0 12px;">
            <button style="background:#111;color:#fff;border:none;border-radius:20px;padding:6px 14px;font-family:'Manrope',sans-serif;font-weight:700;font-size:11px;">Standard</button>
            <button style="background:#eee;color:#777;border:none;border-radius:20px;padding:6px 14px;font-family:'Manrope',sans-serif;font-weight:700;font-size:11px;">Mini</button>
            <button style="background:#eee;color:#777;border:none;border-radius:20px;padding:6px 14px;font-family:'Manrope',sans-serif;font-weight:700;font-size:11px;">Off</button>
          </div>
          <div style="font-family:'Manrope',sans-serif;font-size:13px;">
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0;">
              <span style="font-weight:600;color:#111;">MEDIA</span><span style="color:#777;">CALL</span>
            </div>
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0;">
              <span>Play/Pause <span style="color:#aaa;font-size:11px;">●</span></span><span></span>
            </div>
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0;">
              <span>Skip forward <span style="color:#aaa;font-size:11px;">●●</span></span><span>Answer/End call <span style="color:#aaa;font-size:11px;">●●</span></span>
            </div>
            <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:8px 0;">
              <span>Skip backward <span style="color:#aaa;font-size:11px;">●●●</span></span><span>Reject call</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;">
              <span>Spotify Tap <span style="color:#aaa;font-size:11px;">●</span></span><span></span>
            </div>
          </div>`
        );
      }

      if (type === "profile") {
        const profile = state.profile || DEFAULT_PROFILE;
        return this.wrapSheet(
          "Your profile",
          "PULSE member",
          `<div class="sheet-hero">
            <span class="sheet-avatar">${escapeHTML(profile.initials || "AR")}</span>
            <div><h3>${escapeHTML(profile.name)}</h3><p>${escapeHTML(profile.email)}</p></div>
          </div>
          <div class="profile-stats">
            <div><b>128h</b><span>Listened</span></div>
            <div><b>6</b><span>Presets</span></div>
            <div><b data-profile-device-count>${connectedDevices().length}</b><span>Devices</span></div>
          </div>
          <div class="device-switch-card">
            <span class="device-switch-image"><img src="${device.image}" alt="${escapeHTML(device.name)}" onerror="this.onerror=null;this.src='${brandMonogramDataURI(device.brand)}'"></span>
            <span><b>${escapeHTML(device.name)}</b><small>Connected · ${device.lastBattery}% battery</small></span>
            <span class="connected-pill"><i></i> Live</span>
          </div>
          <div class="sheet-cta">
            <button class="outline-button" data-sheet="device-picker">Switch device</button>
            <button class="primary-button" data-action="manage-devices">Manage devices</button>
          </div>`
        );
      }

      if (type === "device-picker") {
        return this.wrapSheet(
          "Choose a device",
          "My audio",
          `<p class="sheet-copy">Switch between your connected audio devices. Each device keeps its own sound profile, controls and noise settings.</p>
          <div class="sheet-options">
            ${connectedDevices().map(item => `<button class="sheet-option ${item.id === state.activeDeviceId ? "is-selected" : ""}" data-sheet-option="device" data-value="${item.id}">
              <span class="option-icon option-device-image"><img src="${item.image}" alt="" onerror="this.onerror=null;this.src='${brandMonogramDataURI(item.brand)}'"></span>
              <span class="option-copy"><b>${escapeHTML(item.name)}</b><small>${deviceFormLabel(item)} · ${item.lastBattery}%</small></span>
              <span class="option-check">${icon("i-check")}</span>
            </button>`).join("")}
          </div>
          <div class="sheet-cta">
            <button class="outline-button" data-action="manage-devices">Manage devices</button>
            <button class="primary-button" data-action="close-sheet">Done</button>
          </div>`
        );
      }

      if (type === "battery") {
        const copy = device.formFactor === "headphones"
          ? `${escapeHTML(device.name)} is charged and ready to go.`
          : `Both earbuds and the charging case are reporting their latest charge.`;
        return this.wrapSheet(
          "Battery",
          "Power status",
          `<p class="sheet-copy">${copy}</p>
          <div class="battery-detail">${batteryDetailHTML(device)}</div>
          <div class="sheet-cta">
            <button class="outline-button" data-sheet="support">Battery tips</button>
            <button class="primary-button" data-action="close-sheet">Done</button>
          </div>`
        );
      }

      if (type === "sound-profile") {
        const profiles = [
          { value: "signature", title: "Signature", description: "Our balanced, all-day tuning" },
          { value: "balanced", title: "Balanced", description: "Extra detail in the midrange" },
          { value: "warm", title: "Warm", description: "Richer bass, smoother treble" }
        ];
        const map = { default: "signature", classic: "balanced", bass: "warm" };
        const current = map[state.preset] || "signature";
        return this.wrapSheet(
          "Sound profile",
          "Adaptive signature",
          `<p class="sheet-copy">Fine tune the character of ${escapeHTML(device.name)}. You can still personalise each band in the equalizer.</p>
          <div class="sheet-options">
            ${profiles.map(profile => `<button class="sheet-option ${current === profile.value ? "is-selected" : ""}" data-sheet-option="profile" data-value="${profile.value}">
              <span class="option-icon">${icon("i-waves")}</span>
              <span class="option-copy"><b>${profile.title}</b><small>${profile.description}</small></span>
              <span class="option-check">${icon("i-check")}</span>
            </button>`).join("")}
          </div>`
        );
      }

      if (type === "firmware") {
        const target = device.firmwareTarget || (device.id === "pulse-explore" ? "v4.1.0" : null);
        if (!deviceSupports(device, "firmware") || !target) {
          return this.wrapSheet(
            "Device software",
            device.brand,
            `<p class="sheet-copy">${escapeHTML(device.name)} receives software updates through ${escapeHTML(device.managedSoftware || "the manufacturer's app")}.</p>
            <div class="sheet-cta"><button class="primary-button" data-action="close-sheet">Got it</button></div>`
          );
        }

        this.firmwareTarget = target;
        const upToDate = state.firmware === target;
        const prettyTarget = target.replace(/^v/, "");
        return this.wrapSheet(
          "Firmware update",
          "Device software",
          `<div class="firmware-progress">
            <span class="progress-icon">${icon("i-download")}</span>
            <h3>${upToDate ? "You're up to date" : `Version ${prettyTarget} is ready`}</h3>
            <p>${upToDate ? `${escapeHTML(device.name)} is running the latest software (${state.firmware}).` : `${escapeHTML(device.name)} is on ${state.firmware}. This update improves connection stability and adds smarter noise control.`}</p>
            ${
              upToDate
                ? `<div class="progress-meta"><span>Installed</span><span>${state.firmware}</span></div>`
                : `<div class="progress-track"><i data-progress-fill></i></div>
                  <div class="progress-meta"><span data-progress-copy>Ready to install</span><span data-progress-percent>0%</span></div>
                  <div class="sheet-cta"><button class="primary-button" data-action="update-firmware">Install update</button></div>`
            }
          </div>`
        );
      }

      if (type === "rename-device") {
        const target = contextDevice || device;
        return this.wrapSheet(
          "Rename device",
          target.brand,
          `<p class="sheet-copy">Give ${escapeHTML(target.name)} a name that's easy to spot in your audio network.</p>
          <form class="rename-form" data-rename-form data-device-id="${target.id}">
            <label class="rename-field">
              <span>Device name</span>
              <input name="deviceName" maxlength="32" value="${escapeHTML(target.name)}" autocomplete="off" spellcheck="false">
            </label>
            <p class="rename-error" data-rename-error role="alert"></p>
            <div class="sheet-cta">
              <button type="button" class="outline-button" data-action="close-sheet">Cancel</button>
              <button type="submit" class="primary-button">Save name</button>
            </div>
          </form>`
        );
      }

      if (type === "capabilities") {
        const target = contextDevice || device;
        const supported = capabilityKeys(target);
        const unsupported = Object.keys(CAPABILITY_META).filter(key => !supported.includes(key));
        return this.wrapSheet(
          "Detected features",
          `${target.brand} · ${target.model}`,
          `<p class="sheet-copy">PULSE reads these capabilities from ${escapeHTML(target.name)}. Hardware-dependent controls only appear when the device reports them.</p>
          <div class="capability-list">
            ${supported.map(key => {
              const meta = CAPABILITY_META[key];
              return `<div class="capability-item">
                <span class="capability-icon">${icon(meta.icon)}</span>
                <span><b>${meta.label}</b><small>Reported by ${escapeHTML(target.name)}</small></span>
                <span class="capability-check">${icon("i-check")}</span>
              </div>`;
            }).join("")}
          </div>
          ${unsupported.length ? `<p class="capability-note"><b>Not available on this model:</b> ${unsupported.map(key => CAPABILITY_META[key].short).join(", ")}.</p>` : ""}
          <div class="sheet-cta"><button class="primary-button" data-action="close-sheet">Done</button></div>`
        );
      }

      if (type === "support") {
        const faqs = [
          { title: "Pairing & connection", description: "Get help connecting your audio device" },
          { title: "Charging & battery", description: "Tips for keeping every bud powered" },
          { title: "Controls & gestures", description: "Customise gestures and shortcuts" }
        ];
        return this.wrapSheet(
          "How can we help?",
          "Audio support",
          `<p class="sheet-copy">Our support library has quick answers for the things that matter most.</p>
          <div class="sheet-options">
            ${faqs.map(faq => `<button class="sheet-option" data-sheet-option="support">
              <span class="option-icon">${icon("i-info")}</span>
              <span class="option-copy"><b>${faq.title}</b><small>${faq.description}</small></span>
              ${icon("i-chevron-right", "option-chevron")}
            </button>`).join("")}
          </div>
          <div class="sheet-cta">
            <button class="outline-button" data-sheet="profile">Your profile</button>
            <button class="primary-button" data-action="close-sheet">Close</button>
          </div>`
        );
      }

      return "";
    }

    wrapSheet(title, eyebrow, body) {
      return `<div class="bottom-sheet" role="dialog" aria-modal="true" aria-label="${escapeHTML(title)}">
        <span class="sheet-grabber"></span>
        <div class="sheet-header">
          <div><span class="eyebrow">${escapeHTML(eyebrow)}</span><h2>${escapeHTML(title)}</h2></div>
          <button class="sheet-close" data-action="close-sheet" aria-label="Close">${icon("i-x")}</button>
        </div>
        ${body}
      </div>`;
    }

    runFirmwareUpdate() {
      const sheet = this.sheetHost.querySelector(".bottom-sheet");
      if (!sheet) return;

      const fill = sheet.querySelector("[data-progress-fill]");
      const percentEl = sheet.querySelector("[data-progress-percent]");
      const copyEl = sheet.querySelector("[data-progress-copy]");
      const button = sheet.querySelector('[data-action="update-firmware"]');
      if (!fill || !percentEl || !copyEl) return;

      if (button) {
        button.disabled = true;
        button.style.opacity = "0.55";
        button.textContent = "Installing…";
      }

      let progress = 0;
      this.firmwareTimer = window.setInterval(() => {
        progress = Math.min(100, progress + Math.ceil(Math.random() * 8 + 3));
        fill.style.width = `${progress}%`;
        percentEl.textContent = `${progress}%`;
        copyEl.textContent = progress < 30 ? "Preparing update" : progress < 72 ? "Transferring" : progress < 100 ? "Verifying software" : "Complete";

        if (progress >= 100) {
          window.clearInterval(this.firmwareTimer);
          this.firmwareTimer = null;
          const target = this.firmwareTarget || "v4.1.0";
          const device = activeDevice();
          state.firmware = target;
          if (device) device.firmware = target;
          saveState();
          apps.forEach(app => app.syncState());

          const wrap = sheet.querySelector(".firmware-progress");
          if (wrap) {
            wrap.innerHTML = `<span class="progress-icon">${icon("i-check")}</span>
              <h3>Update complete</h3>
              <p>${escapeHTML(device?.name || "Your device")} is now running ${escapeHTML(target)}. Everything is ready.</p>
              <div class="progress-meta"><span>Firmware</span><span>${escapeHTML(target)}</span></div>
              <div class="sheet-cta"><button class="primary-button" data-action="close-sheet">Done</button></div>`;
          }
          audio.shortClick();
        }
      }, 220);
    }

    openFind(deviceId) {
      const device = getDevice(deviceId) || activeDevice();
      if (!device) return;

      apps.forEach(app => {
        if (app !== this && !app.findOverlay.hidden) app.closeFind();
      });

      this.closeFind();
      this.findOverlay.hidden = false;

      const eyebrow = this.root.querySelector("[data-find-eyebrow]");
      const name = this.root.querySelector("[data-find-name]");
      const copy = this.root.querySelector("[data-find-copy]");
      const image = this.root.querySelector("[data-find-image]");

      if (eyebrow) eyebrow.textContent = `Locating your ${device.formFactor}`;
      if (name) name.textContent = device.name;
      if (copy) copy.textContent = `Your ${device.formFactor} are nearby. The signal is getting stronger.`;
      if (image) {
        image.src = device.image;
        image.alt = device.name;
        image.onerror = () => { image.src = brandMonogramDataURI(device.brand); };
      }

      audio.startFindBeep();
      audio.shortClick();

      this.findTimer = window.setTimeout(() => {
        const liveCopy = this.root.querySelector("[data-find-copy]");
        if (liveCopy) {
          liveCopy.textContent = `Signal locked. ${device.name} is about 1.2 metres away.`;
        }
      }, 4200);
    }

    closeFind() {
      if (!this.findOverlay) return;
      this.findOverlay.hidden = true;
      audio.stopFindBeep();
      if (this.findTimer) {
        window.clearTimeout(this.findTimer);
        this.findTimer = null;
      }
    }

    showToast(message) {
      if (!this.toastEl) return;
      this.toastEl.textContent = message;
      this.toastEl.classList.add("is-visible");
      window.clearTimeout(this.toastTimer);
      this.toastTimer = window.setTimeout(() => {
        this.toastEl.classList.remove("is-visible");
      }, 2400);
    }

    hideToast() {
      this.toastEl.classList.remove("is-visible");
    }

  }

  const prettyToggleName = key => ({
    sleeping: "Sleeping mode",
    gaming: "Gaming mode",
    adaptive: "Adaptive EQ",
    spatial: "Spatial audio",
    autopause: "Auto pause"
  }[key] || key);

  async function syncCatalog(manual = false) {
    try {
      const response = await fetch("catalog.json", { cache: "no-store" });
      if (!response.ok) throw new Error("catalog unavailable");
      const catalog = await response.json();
      const incoming = Array.isArray(catalog.devices) ? catalog.devices : [];
      let added = 0;

      incoming.forEach(profile => {
        if (!profile || typeof profile.id !== "string" || state.devices.some(device => device.id === profile.id)) {
          return;
        }

        const device = {
          ...profile,
          connected: Boolean(profile.connectedByDefault),
          battery: { ...(profile.battery || {}) },
          lastBattery: Number.isFinite(Number(profile.lastBattery))
            ? Math.max(0, Math.min(100, Number(profile.lastBattery)))
            : 80,
          capabilities: { ...(profile.capabilities || {}) },
          name: typeof profile.name === "string" ? profile.name.trim().slice(0, 32) || profile.id : profile.id
        };

        state.devices.push(device);
        state.settingsByDevice[device.id] = normalizeSettings(device, defaultSettingsFor(device));
        added += 1;
      });

      if (added) {
        if (!state.devices.some(device => device.id === state.activeDeviceId)) {
          const connected = state.devices.filter(device => device.connected);
          state.activeDeviceId = connected[0]?.id || state.devices[0].id;
        }
        saveState();
        apps.forEach(app => app.syncState());
      }

      if (manual) {
        apps.forEach(app =>
          app.showToast(added ? `Catalog updated · ${added} new device${added === 1 ? "" : "s"}` : "Catalog is up to date")
        );
      }
    } catch {
      if (manual) apps.forEach(app => app.showToast("Catalog update unavailable"));
    }
  }

  /* ————————————————————————— Boot ————————————————————————— */
  slots.forEach(slot => {
    const root = slot.querySelector(".phone");
    const app = new PulseApp(root, root.dataset.initial);
    slot._app = app;
    apps.push(app);
  });

  window.setTimeout(() => syncCatalog(false), 300);

  const layout = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width <= 980;
    document.body.classList.toggle("is-mobile", mobile);

    if (mobile) {
      slots.forEach(slot => {
        slot.style.width = "";
        slot.style.height = "";
        slot.style.removeProperty("--phone-scale");
      });
      return;
    }

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    if (!stageWidth || !stageHeight) return;

    const gap = Math.max(22, Math.min(56, stageWidth * 0.03));
    stage.style.gap = `${gap}px`;

    const scale = Math.max(
      0.55,
      Math.min((stageWidth - gap * 2) / (390 * 3), stageHeight / 844, 0.96)
    );

    slots.forEach(slot => {
      slot.style.width = `${390 * scale}px`;
      slot.style.height = `${844 * scale}px`;
      slot.style.setProperty("--phone-scale", scale);
    });
  };

  window.addEventListener("resize", layout, { passive: true });
  window.addEventListener("orientationchange", () => window.setTimeout(layout, 80));
  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(layout);
    observer.observe(stage);
  }
  window.requestAnimationFrame(() => {
    layout();
    window.setTimeout(layout, 80);
  });

  window.addEventListener("keydown", event => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      if (document.activeElement && document.activeElement.closest(".welcome-screen")) {
        const app = apps.find(a => a.route === "welcome");
        if (app) app.setSlide(app.slide + (event.key === "ArrowRight" ? 1 : -1));
      }
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && audio.playing) {
      audio.stop();
    }
  });

  // Expose a tiny debug surface for previews and manual QA.
  window.PulseDemo = {
    apps,
    state,
    navigate: (index, route) => apps[index]?.navigate(route),
    layout,
    syncCatalog: (manual = true) => syncCatalog(manual)
  };
})();
