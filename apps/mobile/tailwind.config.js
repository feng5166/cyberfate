module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        base: "#FAF6EE",
        "base-alt": "#F2EDE0",
        ink: "#1B2540",
        "text-secondary": "#5A5A5A",
        "text-muted": "#9E9E9E",
        accent: "#E87722",
        "accent-bg": "rgba(232,119,34,0.08)",
        wood: "#6B8E5A",
        fire: "#C0392B",
        earth: "#C9A86C",
        metal: "#BDB7A4",
        water: "#4A6FA5",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
    },
  },
  plugins: [],
};
