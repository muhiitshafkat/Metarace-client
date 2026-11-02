/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        metarace: {
          ink: "#0d0d1a",
          violet: "#7936d9",
          magenta: "#c03dff",
          blue: "#5f3dff",
        },
      },
    },
  },
 
};
