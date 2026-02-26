const BROWSERS: [RegExp, string][] = [
  [/Edg(?:e|A|iOS)?\/(\d+[\d.]*)/, "Edge"],
  [/OPR\/(\d+[\d.]*)/, "Opera"],
  [/Vivaldi\/(\d+[\d.]*)/, "Vivaldi"],
  [/Firefox\/(\d+[\d.]*)/, "Firefox"],
  [/(?:Chromium|CriOS)\/(\d+[\d.]*)/, "Chromium"],
  [/Chrome\/(\d+[\d.]*)/, "Chrome"],
  [/Version\/(\d+[\d.]*).*Safari/, "Safari"],
  [/Safari\/(\d+[\d.]*)/, "Safari"],
];

const OS_PATTERNS: [RegExp, string][] = [
  [/Windows NT 10\.0/, "Windows"],
  [/Windows NT 6\.3/, "Windows 8.1"],
  [/Windows NT 6\.2/, "Windows 8"],
  [/Windows NT 6\.1/, "Windows 7"],
  [/Windows/, "Windows"],
  [/iPhone OS ([\d_]+)/, "iOS"],
  [/iPad/, "iPadOS"],
  [/Mac OS X/, "macOS"],
  [/Macintosh/, "macOS"],
  [/Android ([\d.]+)/, "Android $1"],
  [/Android/, "Android"],
  [/CrOS/, "ChromeOS"],
  [/Linux/, "Linux"],
];

export function parseUserAgent(ua: string): string {
  let browser = "Unknown browser";
  for (const [re, name] of BROWSERS) {
    const m = ua.match(re);
    if (m) {
      const major = m[1]?.split(".")[0];
      browser = major ? `${name} ${major}` : name;
      break;
    }
  }

  let os = "Unknown OS";
  for (const [re, name] of OS_PATTERNS) {
    const m = ua.match(re);
    if (m) {
      if (name.includes("$1") && m[1]) {
        os = name.replace("$1", m[1].replace(/_/g, "."));
      } else {
        os = name;
      }
      break;
    }
  }

  return `${browser} on ${os}`;
}
