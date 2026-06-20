//XSS (Cross site scripting) per proteggere il browser

"use strict";

export function escapeHtml(string) {
  const str = "" + string;
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return str.replace(/[&<>"']/g, (m) => map[m]);
}
