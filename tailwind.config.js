/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#F6F1EA",
        paper: "#FBF8F3",
        ink: "#514C48",
        muted: "#8D8580",
        rose: "#CFA3A0",
        roseSoft: "#E8D4D1",
        blue: "#9AAEBC",
        blueSoft: "#DCE6EA",
        sage: "#A7B8A4",
        sageSoft: "#DDE7D8",
        warm: "#D8CFC4",
        taupe: "#B7AAA0"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(93, 79, 70, 0.10)"
      }
    },
  },
  plugins: [],
};
