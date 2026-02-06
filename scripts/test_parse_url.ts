function parseUrl(input: string): { domain: string; url: string } {
  const withProtocol = input.match(/^https?:\/\//) ? input : `https://${input}`;
  
  try {
    const urlObj = new URL(withProtocol);
    const domain = urlObj.hostname.replace(/^www\./, "");
    
    let displayUrl = domain + urlObj.pathname + urlObj.search;
    
    if (displayUrl.endsWith("/") && urlObj.pathname === "/") {
      displayUrl = displayUrl.slice(0, -1);
    }

    return { domain, url: displayUrl };
  } catch (e) {
    const clean = input.toLowerCase().trim();
    return { domain: clean.split(/[/?#]/)[0], url: clean };
  }
}

const testCases = [
  "https://developer.flutterwave.com/v3.0/docs/bvn-verification",
  "developer.flutterwave.com/v3.0/docs/bvn-verification",
  "https://developer.flutterwave.com",
  "developer.flutterwave.com",
];

console.log("Testing parseUrl function:\n");
testCases.forEach(test => {
  const result = parseUrl(test);
  console.log(`Input:  "${test}"`);
  console.log(`Domain: "${result.domain}"`);
  console.log(`URL:    "${result.url}"`);
  console.log("---");
});
