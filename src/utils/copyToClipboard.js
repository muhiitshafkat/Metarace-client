/**
 * Cross-browser clipboard copy.
 * Tries navigator.clipboard (HTTPS / modern browsers) first,
 * falls back to document.execCommand for HTTP or older browsers.
 */
export const copyToClipboard = (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      success ? resolve() : reject(new Error("execCommand copy failed"));
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
};
