export type AccentName = "blue" | "teal" | "violet" | "cyan" | "amber" | "rose" | "emerald" | "indigo";

export const ACCENTS: Record<
  AccentName,
  { iconBg: string; iconText: string; bar: string; soft: string; text: string; ring: string }
> = {
  blue: {
    iconBg: "bg-[#eaf2fe]",
    iconText: "text-[#2c6bc9]",
    bar: "from-[#5b93e8] via-[#3b7ad8] to-[#2f6fce]",
    soft: "bg-[#f4f8ff]",
    text: "text-[#2b66bd]",
    ring: "group-hover:border-[#bdd7f6]",
  },
  teal: {
    iconBg: "bg-[#e6f7f3]",
    iconText: "text-[#158d7d]",
    bar: "from-[#4dc6b4] via-[#22a996] to-[#128577]",
    soft: "bg-[#f3fbf9]",
    text: "text-[#148273]",
    ring: "group-hover:border-[#b6e3da]",
  },
  violet: {
    iconBg: "bg-[#f0ecfd]",
    iconText: "text-[#6749c6]",
    bar: "from-[#a58cf0] via-[#8567df] to-[#6f51cc]",
    soft: "bg-[#f8f6fe]",
    text: "text-[#6144c2]",
    ring: "group-hover:border-[#d7cdf7]",
  },
  cyan: {
    iconBg: "bg-[#e6f6fa]",
    iconText: "text-[#1f8aa4]",
    bar: "from-[#63c7da] via-[#35a8c2] to-[#1f8aa4]",
    soft: "bg-[#f4fbfd]",
    text: "text-[#1c829b]",
    ring: "group-hover:border-[#bfe3ed]",
  },
  amber: {
    iconBg: "bg-[#fdf3e2]",
    iconText: "text-[#b9751d]",
    bar: "from-[#eab765] via-[#d99a3e] to-[#c47a20]",
    soft: "bg-[#fffbf3]",
    text: "text-[#a96a18]",
    ring: "group-hover:border-[#eed6ae]",
  },
  rose: {
    iconBg: "bg-[#fdeef1]",
    iconText: "text-[#c34e6a]",
    bar: "from-[#eb93a9] via-[#db6f8b] to-[#c94f6c]",
    soft: "bg-[#fff7f9]",
    text: "text-[#b84561]",
    ring: "group-hover:border-[#f0c6d0]",
  },
  emerald: {
    iconBg: "bg-[#e8f7ef]",
    iconText: "text-[#1b8a67]",
    bar: "from-[#65cda5] via-[#33ae82] to-[#1b8a67]",
    soft: "bg-[#f4fcf8]",
    text: "text-[#187a5c]",
    ring: "group-hover:border-[#bfe8d7]",
  },
  indigo: {
    iconBg: "bg-[#eceffd]",
    iconText: "text-[#4a5fc4]",
    bar: "from-[#8495ea] via-[#6276dc] to-[#4a5fc4]",
    soft: "bg-[#f6f8fe]",
    text: "text-[#4256b7]",
    ring: "group-hover:border-[#ccd5f5]",
  },
};
