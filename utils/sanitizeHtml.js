const sanitizeHtml = require('sanitize-html');

const urlify = (text) => {
  const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
  return text.replace(urlPattern, (url) => {
    const encodedUrl = encodeURI(url);
    if (encodedUrl.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return `<img src="${encodedUrl}" alt="Image" style="max-width: 100%;">`;
    }
    return `<a href="${encodedUrl}" target="_blank">${encodedUrl}</a>`;
  });
};

const transformHtml = (html, authToken) => {
  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'a']), // Allow img and a tags
    allowedAttributes: {
      '*': ['class', 'id'], // Allow class and id attributes for all tags
      img: ['src', 'alt', 'title', 'width', 'height'], // Allow specific attributes for img tags
      a: ['href', 'target'], // Allow specific attributes for a tags
    },
    transformTags: {
      img: (tagName, attribs) => {
        if (attribs.src) {
          attribs.src += `?authorization=${authToken}`;
        }
        return { tagName, attribs };
      },
      div: 'p', // Transform <div> to <p>
      span: () => ({
        tagName: false, // Remove <span> elements but keep their inner text
      }),
    },
  });

  return sanitizedHtml;
};

module.exports = { transformHtml, urlify };